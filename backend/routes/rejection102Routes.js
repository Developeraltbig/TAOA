import express from "express";
import {
  generateResponse,
  extractAndParseAllJson,
} from "../libs/rejectionRoutesHelper.js";
import Dockets from "../models/Dockets.js";
import OneFeature from "../models/OneFeatures.js";
import NovelFeature from "../models/NovelFeatures.js";
import DependentClaim from "../models/DependentClaims.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { saveToFile } from "../libs/applicationRoutesHelpers.js";
import CompositeAmendment from "../models/CompositeAmendments.js";
import TechnicalComparison from "../models/TechnicalComparison.js";
import { verify102rejection } from "../middlewares/verifyRejections.js";

const router = express.Router();
const enviroment = process.env.NODE_ENV;

router.post(
  "/technicalcomparison",
  verifyToken,
  verify102rejection,
  async (req, res, next) => {
    try {
      const {
        user,
        rejectionId,
        applicationId,
        subjectClaims,
        examinerReasoning,
        applicationNumber,
        subjectDescription,
        priorArtDescription,
      } = req.data;

      if (
        !user ||
        !rejectionId ||
        !subjectClaims ||
        !applicationId ||
        !examinerReasoning ||
        !applicationNumber ||
        !subjectDescription ||
        !priorArtDescription
      ) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      if (enviroment === "development") {
        console.log(subjectClaims);
      }

      const prompt = `You are an expert patent prosecutor analyzing a §102 rejection to identify genuine differentiating features and propose strategic claim amendments.
PROVIDED INPUTS:
1.	Rejected Independent Claim from Client's Patent Application
2.	Complete Specification of Client's Patent Application
3.	Examiner's Detailed Rejection Reasoning
4.	Complete Specification of the Cited Prior Art Reference
YOUR TASK:
PART 1 - COMPREHENSIVE ANALYSIS (Free-form narrative) Write a detailed analytical essay that:
a) Understands the rejected claim in light of its specification
•	Break down each claim element
•	Identify the technical problem and inventive concept
•	Note critical specification support (para/fig numbers)
•	Determine if claim is structural, functional, or hybrid
b) Dissects the examiner's rejection
•	Identify exact prior art portions cited (para/col/line numbers)
•	Understand examiner's element mapping
•	Spot any misinterpretations or overreach
c) Performs deep technical comparison
•	Apply key doctrines: inherency, functional claiming equivalence
•	For each potential difference, evaluate: 
o	Is it truly absent from prior art?
o	Does it provide unexpected advantages?
o	Is it more than an obvious design choice?
•	Consider what prior art actually teaches vs examiner's interpretation
d) Identifies the strongest differentiating features
•	Focus on features that solve unrecognized problems
•	Highlight non-obvious technical advantages
•	Ensure specification support exists
This should be a thorough, story-telling analysis that builds your case.
PART 2 - STRUCTURED OUTPUTS
Based on your analysis above, provide ONLY these two outputs:
1.	TECHNICAL COMPARISON TABLE (20-30 WORDS PER CELL):
\`\`\`json
{
  "comparisonTable": [
    {
      "featureNumber": 1,
      "subjectApplication": "Concise description of claimed feature [Spec ref]",
      "priorArt": "What prior art shows/lacks [Prior art ref]",
      "differentiatingFeature": "Key technical distinction and its significance"
    }
  ]
}
\`\`\`
WORD LIMIT: Strictly 20-30 words per cell. Be precise and technical. Limit to 4-5 strongest differentiating features.
2.	STRATEGIC CLAIM AMENDMENT:
\`\`\`json
{
  "amendedClaim": {
    "preamble": "[Keep original or minimally modify]",
    "elements": [
      {
        "elementId": "(a)",
        "text": "[Original element with minimal amendments if needed]"
      }
    ],
    "additionalElements": [
      {
        "elementId": "(x)",
        "text": "[New wherein clause or element only if essential]"
      }
    ]
  },
  "amendmentStrategy": "Explain how these amendments: (1) distinguish over prior art, (2) maintain broad scope, (3) have full spec support, (4) avoid legal issues"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output – first, the comparison one should start with \`\`\`json and end with \`\`\`. Same for the next json output of amendment to start with \`\`\`json and end with \`\`\`.
AMENDMENT PRINCIPLES: ✓ MINIMAL CHANGES - Don't rewrite, refine ✓ Prefer "wherein" clauses over restructuring ✓ Structural claims → structural amendments (no functional language that risks MPF) ✓ Method claims → maintain step format ✓ Add narrowest distinguishing feature that works ✓ Avoid creating 112(a)/(b)/(f) issues ✓ Consider ease of infringement detection ✓ Pull from dependent claims when helpful
LEGAL SAFEGUARDS:
•	No means-plus-function triggers
•	Clear antecedent basis
•	Definite claim boundaries
•	Full written description support
Remember: Precision over revision. Add only what's necessary to win, keeping claims as broad as legally possible.
Remember: The free-form analysis should comprehensively explore the technical distinctions. The structured outputs should provide clear, actionable deliverables for responding to the Office Action.
Rejected Independent Claim from Client's Patent Application: ${subjectClaims}
Complete Specification of Client's Patent Application: ${subjectDescription}
Examiner Detailed Rejection Reasoning: ${examinerReasoning}
Complete Specification of the Cited Prior Art Reference: ${priorArtDescription}
`;

      let rawText = await generateResponse(prompt, applicationNumber);

      if (!rawText) {
        rawText = await generateResponse(prompt, applicationNumber);
      }

      if (enviroment === "development") {
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
      }

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        if (enviroment === "development") {
          await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        }
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse technical comparison claim!",
        });
      }

      if (enviroment === "development") {
        await saveToFile(data, `data/${applicationNumber}.json`);
      }

      const { comparisonTable, amendedClaim, amendmentStrategy } = data;

      const techComparison = await TechnicalComparison.findOneAndUpdate(
        {
          user,
          applicationId,
          rejectionId,
        },
        {
          $set: {
            amendedClaim,
            comparisonTable,
            amendmentStrategy,
            rejectedClaim: subjectClaims,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const checkDocket = await Dockets.findOne({
        rejectionId,
        user,
      });

      if (checkDocket?.finalizedType === "technicalComparison") {
        await Dockets.findOneAndUpdate(
          {
            rejectionId,
            user,
          },
          {
            showFinalizedType: false,
          }
        );
      }

      return res.status(200).json({
        status: "success",
        message: "Successfully analysed technical comparison",
        data: techComparison,
      });
    } catch (error) {
      if (error.message.includes("Error in AI processing")) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error! Please try again.",
        });
      } else {
        next(error);
      }
    }
  }
);

router.post(
  "/novelfeatures",
  verifyToken,
  verify102rejection,
  async (req, res, next) => {
    try {
      const {
        user,
        rejectionId,
        applicationId,
        subjectClaims,
        examinerReasoning,
        applicationNumber,
        subjectDescription,
        priorArtDescription,
      } = req.data;

      if (
        !user ||
        !rejectionId ||
        !subjectClaims ||
        !applicationId ||
        !examinerReasoning ||
        !applicationNumber ||
        !subjectDescription ||
        !priorArtDescription
      ) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      if (enviroment === "development") {
        console.log(subjectClaims);
      }

      const prompt = `You are an expert patent prosecutor identifying the crown jewel novel feature to overcome a §102 rejection through surgical claim amendment.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference

YOUR TASK:
PART 1 - NOVEL FEATURE DISCOVERY (Free-form narrative)
Write a comprehensive analysis that:
a) Identifies the invention's core innovation

What problem did inventors uniquely recognize?
What insight led to their solution?
Which technical aspects were non-obvious?
Review inventor declarations/background section

b) Maps the novelty landscape

Create hierarchy: revolutionary → pioneering → incremental features
Identify features with unexpected results/advantages
Find features solving long-felt but unsolved needs
Locate features contradicting conventional wisdom

c) Validates true novelty

For each candidate feature, ask:

Does prior art teach away from this?
Would PHOSITA combine references to achieve this?
Does this enable new functionality?
Are there secondary indicia of non-obviousness?

d) Selects the optimal novel feature

Balance: novelty strength vs. claim scope preservation
Ensure bulletproof specification support
Verify commercial embodiment coverage
Consider litigation/enforcement perspective

This should be an exhaustive analysis identifying every possible novel aspect, ranking them by strength, and justifying why certain features represent true innovation over prior art.
PART 2 - STRUCTURED OUTPUTS
Based on your analysis above, provide ONLY these two outputs:

TECHNICAL COMPARISON TABLE (20-30 WORDS PER CELL):

\`\`\`json
{
  "comparisonTable": [
    {
      "featureNumber": 1,
      "subjectApplication": "Concise description of claimed feature [Spec ref]",
      "priorArt": "What prior art shows/lacks [Prior art ref]",
      "differentiatingFeature": "Key technical distinction and its significance"
    }
  ]
}
\`\`\`
WORD LIMIT: Strictly 20-30 words per cell. Be precise and technical. Limit to 4-5 strongest differentiating features.

STRATEGIC CLAIM AMENDMENT:

\`\`\`json
{
  "amendedClaim": {
    "preamble": "[Keep original or minimally modify]",
    "elements": [
      {
        "elementId": "(a)",
        "text": "[Original element with minimal amendments if needed]"
      }
    ],
    "additionalElements": [
      {
        "elementId": "(x)",
        "text": "[New wherein clause or element only if essential]"
      }
    ]
  },
  "amendmentStrategy": "Explain how these amendments: (1) distinguish over prior art, (2) maintain broad scope, (3) have full spec support, (4) avoid legal issues"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output – first, the comparison one should start with \`\`\`json and end with \`\`\`. Same for the next json output of amendment to start with \`\`\`json and end with \`\`\`.
AMENDMENT PRINCIPLES:
✓ Find the ONE feature that wins
✓ Integrate seamlessly, don't restructure
✓ Use "wherein" for clean addition
✓ Maintain method/apparatus claim type
✓ Avoid divided infringement risks     
Rejected Independent Claim from Client's Patent Application: ${subjectClaims}
Complete Specification of Client's Patent Application: ${subjectDescription}
Examiner Detailed Rejection Reasoning: ${examinerReasoning}
Complete Specification of the Cited Prior Art Reference: ${priorArtDescription}
`;

      let rawText = await generateResponse(prompt, applicationNumber);

      if (!rawText) {
        rawText = await generateResponse(prompt, applicationNumber);
      }

      if (enviroment === "development") {
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
      }

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        if (enviroment === "development") {
          await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        }
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse novel features claim!",
        });
      }

      if (enviroment === "development") {
        await saveToFile(data, `data/${applicationNumber}.json`);
      }

      const { comparisonTable, amendedClaim, amendmentStrategy } = data;

      const novelComparison = await NovelFeature.findOneAndUpdate(
        {
          user,
          applicationId,
          rejectionId,
        },
        {
          $set: {
            amendedClaim,
            comparisonTable,
            amendmentStrategy,
            rejectedClaim: subjectClaims,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const checkDocket = await Dockets.findOne({
        rejectionId,
        user,
      });

      if (checkDocket?.finalizedType === "novelFeatures") {
        await Dockets.findOneAndUpdate(
          {
            rejectionId,
            user,
          },
          {
            showFinalizedType: false,
          }
        );
      }

      return res.status(200).json({
        status: "success",
        message: "Successfully analysed novel features",
        data: novelComparison,
      });
    } catch (error) {
      if (error.message.includes("Error in AI processing")) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error! Please try again.",
        });
      } else {
        next(error);
      }
    }
  }
);

router.post(
  "/dependentclaims",
  verifyToken,
  verify102rejection,
  async (req, res, next) => {
    try {
      const {
        user,
        rejectionId,
        applicationId,
        subjectClaims,
        examinerReasoning,
        applicationNumber,
        subjectDescription,
        priorArtDescription,
      } = req.data;

      if (
        !user ||
        !rejectionId ||
        !subjectClaims ||
        !applicationId ||
        !examinerReasoning ||
        !applicationNumber ||
        !subjectDescription ||
        !priorArtDescription
      ) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      if (enviroment === "development") {
        console.log(subjectClaims);
      }

      const prompt = `You are an expert patent prosecutor leveraging existing dependent claims to efficiently overcome a §102 rejection.
PROVIDED INPUTS:

Rejected Independent Claim AND ALL Dependent Claims
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference

YOUR TASK:
PART 1 - DEPENDENT CLAIM STRATEGIC ANALYSIS (Free-form narrative)
a) Catalog all dependent claims

Group by feature type (structural/functional/method)
Identify claim dependencies and combinations
Note which dependent claims examiner addressed
Flag commercially important dependencies

b) Evaluate each dependent claim's strength

Which genuinely distinguish over prior art?
Which add minimal limitations?
Which preserve broadest scope?
Which align with commercial embodiments?

c) Analyze combination strategies

Can multiple dependencies create synergy?
Which combinations avoid prior art entirely?
What's the minimal combination needed?
Consider antecedent basis chains

d) Select optimal dependent claim strategy

Prioritize: single dependency > multiple
Balance novelty vs. scope
Ensure no 112 issues in combination
Verify real-world detectability

Provide detailed rationale for why certain dependent claims offer better strategic value, how they interact with the independent claim, and which combinations create the strongest position against prior art while preserving commercial coverage.
PART 2 - STRUCTURED OUTPUTS
Based on your analysis above, provide ONLY these two outputs:

TECHNICAL COMPARISON TABLE (20-30 WORDS PER CELL):

\`\`\`json
{
  "comparisonTable": [
    {
      "featureNumber": 1,
      "subjectApplication": "Concise description of claimed feature [Spec ref]",
      "priorArt": "What prior art shows/lacks [Prior art ref]",
      "differentiatingFeature": "Key technical distinction and its significance"
    }
  ]
}
\`\`\`
WORD LIMIT: Strictly 20-30 words per cell. Be precise and technical. Limit to 4-5 strongest differentiating features.

STRATEGIC CLAIM AMENDMENT:

\`\`\`json
{
  "amendedClaim": {
    "preamble": "[Keep original or minimally modify]",
    "elements": [
      {
        "elementId": "(a)",
        "text": "[Original element with minimal amendments if needed]"
      }
    ],
    "additionalElements": [
      {
        "elementId": "(x)",
        "text": "[New wherein clause or element only if essential]"
      }
    ]
  },
  "amendmentStrategy": "Explain how these amendments: (1) distinguish over prior art, (2) maintain broad scope, (3) have full spec support, (4) avoid legal issues"
}
IMPORTANT NOTE ON JSON DATA: Each of the json output – first, the comparison one should start with \`\`\`json and end with \`\`\`. Same for the next json output of amendment to start with \`\`\`json and end with \`\`\`.
STRATEGIC PRINCIPLES:
✓ Mine existing claim set first
✓ Single dependency preferred
✓ Maintain claim hierarchy logic
✓ Consider future continuation practice
✓ Preserve terminal disclaimer options
Rejected Independent Claim from Client's Patent Application: ${subjectClaims}
Complete Specification of Client's Patent Application: ${subjectDescription}
Examiner Detailed Rejection Reasoning: ${examinerReasoning}
Complete Specification of the Cited Prior Art Reference: ${priorArtDescription}
`;

      let rawText = await generateResponse(prompt, applicationNumber);

      if (!rawText) {
        rawText = await generateResponse(prompt, applicationNumber);
      }

      if (enviroment === "development") {
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
      }

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        if (enviroment === "development") {
          await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        }
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse dependent claims!",
        });
      }

      if (enviroment === "development") {
        await saveToFile(data, `data/${applicationNumber}.json`);
      }

      const { comparisonTable, amendedClaim, amendmentStrategy } = data;

      const dependentComparison = await DependentClaim.findOneAndUpdate(
        {
          user,
          applicationId,
          rejectionId,
        },
        {
          $set: {
            amendedClaim,
            comparisonTable,
            amendmentStrategy,
            rejectedClaim: subjectClaims,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const checkDocket = await Dockets.findOne({
        rejectionId,
        user,
      });

      if (checkDocket?.finalizedType === "dependentClaims") {
        await Dockets.findOneAndUpdate(
          {
            rejectionId,
            user,
          },
          {
            showFinalizedType: false,
          }
        );
      }

      return res.status(200).json({
        status: "success",
        message: "Successfully analysed dependent claims",
        data: dependentComparison,
      });
    } catch (error) {
      if (error.message.includes("Error in AI processing")) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error! Please try again.",
        });
      } else {
        next(error);
      }
    }
  }
);

router.post(
  "/compositeamendments",
  verifyToken,
  verify102rejection,
  async (req, res, next) => {
    try {
      const {
        user,
        rejectionId,
        applicationId,
        subjectClaims,
        examinerReasoning,
        applicationNumber,
        subjectDescription,
        priorArtDescription,
      } = req.data;

      if (
        !user ||
        !rejectionId ||
        !subjectClaims ||
        !applicationId ||
        !examinerReasoning ||
        !applicationNumber ||
        !subjectDescription ||
        !priorArtDescription
      ) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      if (enviroment === "development") {
        console.log(subjectClaims);
      }

      const prompt = `You are an expert patent prosecutor crafting a multi-feature amendment strategy that creates an unassailable combination while preserving maximum scope.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference

YOUR TASK:
PART 1 - COMPOSITE STRATEGY DEVELOPMENT (Free-form narrative)
a) Identify synergistic features

Which features work better together?
Find technical interdependencies
Locate mutually reinforcing elements
Spot emergent properties from combinations

b) Build the optimal composite

Start with minimum viable combination
Add only synergistic elements
Ensure no redundancy
Verify each addition adds value

c) Analyze combination effects

Does combination create unexpected results?
Are features inseparable in practice?
Does prior art teach away from combination?
Would combination be obvious to try?

d) Structure the composite amendment

Logical flow between features
Clear interdependencies
Maintain claim readability
Preserve enforcement clarity

Thoroughly explain why a composite approach is necessary, how the selected features create synergistic effects beyond their individual contributions, and why this combination represents the optimal balance between distinguishing over prior art and maintaining commercial value.
PART 2 - STRUCTURED OUTPUTS
Based on your analysis above, provide ONLY these two outputs:

TECHNICAL COMPARISON TABLE (20-30 WORDS PER CELL):

\`\`\`json
{
  "comparisonTable": [
    {
      "featureNumber": 1,
      "subjectApplication": "Concise description of claimed feature [Spec ref]",
      "priorArt": "What prior art shows/lacks [Prior art ref]",
      "differentiatingFeature": "Key technical distinction and its significance"
    }
  ]
}
\`\`\`
WORD LIMIT: Strictly 20-30 words per cell. Be precise and technical. Limit to 4-5 strongest differentiating features.

STRATEGIC CLAIM AMENDMENT:

\`\`\`json
{
  "amendedClaim": {
    "preamble": "[Keep original or minimally modify]",
    "elements": [
      {
        "elementId": "(a)",
        "text": "[Original element with minimal amendments if needed]"
      }
    ],
    "additionalElements": [
      {
        "elementId": "(x)",
        "text": "[New wherein clause or element only if essential]"
      }
    ]
  },
  "amendmentStrategy": "Explain how these amendments: (1) distinguish over prior art, (2) maintain broad scope, (3) have full spec support, (4) avoid legal issues"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output – first, the comparison one should start with \`\`\`json and end with \`\`\`. Same for the next json output of amendment to start with \`\`\`json and end with \`\`\`.
COMPOSITE PRINCIPLES:
✓ Synergy over addition
✓ Technical interdependence
✓ Clear combination rationale
✓ Maintain claim elegance
✓ Create design-around barriers
Rejected Independent Claim from Client's Patent Application: ${subjectClaims}
Complete Specification of Client's Patent Application: ${subjectDescription}
Examiner Detailed Rejection Reasoning: ${examinerReasoning}
Complete Specification of the Cited Prior Art Reference: ${priorArtDescription}
`;

      let rawText = await generateResponse(prompt, applicationNumber);

      if (!rawText) {
        rawText = await generateResponse(prompt, applicationNumber);
      }

      if (enviroment === "development") {
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
      }

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        if (enviroment === "development") {
          await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        }
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse composite amendment claim!",
        });
      }

      if (enviroment === "development") {
        await saveToFile(data, `data/${applicationNumber}.json`);
      }

      const { comparisonTable, amendedClaim, amendmentStrategy } = data;

      const compositeComparison = await CompositeAmendment.findOneAndUpdate(
        {
          user,
          applicationId,
          rejectionId,
        },
        {
          $set: {
            amendedClaim,
            comparisonTable,
            amendmentStrategy,
            rejectedClaim: subjectClaims,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const checkDocket = await Dockets.findOne({
        rejectionId,
        user,
      });

      if (checkDocket?.finalizedType === "compositeAmendment") {
        await Dockets.findOneAndUpdate(
          {
            rejectionId,
            user,
          },
          {
            showFinalizedType: false,
          }
        );
      }

      return res.status(200).json({
        status: "success",
        message: "Successfully analysed composite amendment claims",
        data: compositeComparison,
      });
    } catch (error) {
      if (error.message.includes("Error in AI processing")) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error! Please try again.",
        });
      } else {
        next(error);
      }
    }
  }
);

router.post(
  "/onefeatures",
  verifyToken,
  verify102rejection,
  async (req, res, next) => {
    try {
      const {
        user,
        rejectionId,
        applicationId,
        subjectClaims,
        examinerReasoning,
        applicationNumber,
        subjectDescription,
        priorArtDescription,
      } = req.data;

      if (
        !user ||
        !rejectionId ||
        !subjectClaims ||
        !applicationId ||
        !examinerReasoning ||
        !applicationNumber ||
        !subjectDescription ||
        !priorArtDescription
      ) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      if (enviroment === "development") {
        console.log(subjectClaims);
      }

      const prompt = `You are an expert patent prosecutor identifying THE ONE surgical amendment that defeats a §102 rejection with minimal scope sacrifice.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference

YOUR TASK:
PART 1 - ONE FEATURE IDENTIFICATION (Free-form narrative)
a) Distill the invention to its essence

What's the minimum that makes this patentable?
Strip away nice-to-haves vs. must-haves
Find the irreducible innovative core
Identify the "but for" feature

b) Apply the subtraction test

Remove each feature mentally
Which removal defeats the invention?
Which removal prior art can't replicate?
Find the keystone feature

c) Validate the ONE feature

Confirm prior art truly lacks it
Verify it's not inherent/obvious
Ensure it provides technical advantage
Check specification describes clearly

d) Craft precision language

Draft multiple formulations
Choose clearest, narrowest version
Avoid functional claiming traps
Ensure single point of novelty

Explain in detail why this single feature represents the most efficient path to allowance, how it preserves maximum claim scope, and why adding anything more would unnecessarily limit the patent's commercial value.
PART 2 - STRUCTURED OUTPUTS
Based on your analysis above, provide ONLY these two outputs:

TECHNICAL COMPARISON TABLE (20-30 WORDS PER CELL):

\`\`\`json
{
  "comparisonTable": [
    {
      "featureNumber": 1,
      "subjectApplication": "Concise description of claimed feature [Spec ref]",
      "priorArt": "What prior art shows/lacks [Prior art ref]",
      "differentiatingFeature": "Key technical distinction and its significance"
    }
  ]
}
\`\`\`
WORD LIMIT: Strictly 20-30 words per cell. Be precise and technical. Limit to 4-5 strongest differentiating features.

STRATEGIC CLAIM AMENDMENT:

\`\`\`json
{
  "amendedClaim": {
    "preamble": "[Keep original or minimally modify]",
    "elements": [
      {
        "elementId": "(a)",
        "text": "[Original element with minimal amendments if needed]"
      }
    ],
    "additionalElements": [
      {
        "elementId": "(x)",
        "text": "[New wherein clause or element only if essential]"
      }
    ]
  },
  "amendmentStrategy": "Explain how these amendments: (1) distinguish over prior art, (2) maintain broad scope, (3) have full spec support, (4) avoid legal issues"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output – first, the comparison one should start with \`\`\`json and end with \`\`\`. Same for the next json output of amendment to start with \`\`\`json and end with \`\`\`.
ONE FEATURE PRINCIPLES:
✓ Less is more - find THE differentiator
✓ Precision over proliferation
✓ Structural > functional language
✓ Clear infringement detection point
✓ Maximum scope preservation
Rejected Independent Claim from Client's Patent Application: ${subjectClaims}
Complete Specification of Client's Patent Application: ${subjectDescription}
Examiner Detailed Rejection Reasoning: ${examinerReasoning}
Complete Specification of the Cited Prior Art Reference: ${priorArtDescription}
`;

      let rawText = await generateResponse(prompt, applicationNumber);

      if (!rawText) {
        rawText = await generateResponse(prompt, applicationNumber);
      }

      if (enviroment === "development") {
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
      }

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        if (enviroment === "development") {
          await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        }
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse one features claim!",
        });
      }

      if (enviroment === "development") {
        await saveToFile(data, `data/${applicationNumber}.json`);
      }

      const { comparisonTable, amendedClaim, amendmentStrategy } = data;

      const oneComparison = await OneFeature.findOneAndUpdate(
        {
          user,
          applicationId,
          rejectionId,
        },
        {
          $set: {
            amendedClaim,
            comparisonTable,
            amendmentStrategy,
            rejectedClaim: subjectClaims,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const checkDocket = await Dockets.findOne({
        rejectionId,
        user,
      });

      if (checkDocket?.finalizedType === "oneFeatures") {
        await Dockets.findOneAndUpdate(
          {
            rejectionId,
            user,
          },
          {
            showFinalizedType: false,
          }
        );
      }

      return res.status(200).json({
        status: "success",
        message: "Successfully analysed one features claims",
        data: oneComparison,
      });
    } catch (error) {
      if (error.message.includes("Error in AI processing")) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error! Please try again.",
        });
      } else {
        next(error);
      }
    }
  }
);

export default router;
