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
import { verify103rejection } from "../middlewares/verifyRejections.js";

const router = express.Router();

const enviroment = process.env.NODE_ENV;

router.post(
  "/technicalcomparison",
  verifyToken,
  verify103rejection,
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

      const prompt = `You are an expert patent prosecutor analyzing a §103 obviousness rejection involving multiple prior art references to identify genuine differentiating features and propose strategic claim amendments.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art References

YOUR TASK:
PART 1 - COMPREHENSIVE ANALYSIS (Free-form narrative)
Write a detailed analytical essay that:
a) Understands the rejected claim in light of its specification

Break down each claim element
Identify the technical problem and inventive concept
Note critical specification support (para/fig numbers)
Determine if claim is structural, functional, or hybrid

b) Dissects the examiner's combination rationale

Map which elements come from which references
Analyze examiner's motivation to combine
Identify proposed modifications
Spot hindsight reconstruction issues

c) Performs deep technical comparison

Evaluate compatibility of references
Check for teaching away
Identify conflicting operational principles
Analyze fields of endeavor
Look for unexpected results from claimed combination

d) Challenges the combination

Why wouldn't PHOSITA combine these references?
What problems arise from combination?
Does combination change principle of operation?
Are references from incompatible fields?

e) Identifies features missing from combination

What does no single reference show?
What's not obvious from combination?
What provides unexpected advantages?
What solves unrecognized problems?

This should be a thorough analysis that dismantles the obviousness rejection by showing why the combination is improper or incomplete.
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
AMENDMENT PRINCIPLES FOR 103:
✓ Target features no reference teaches
✓ Emphasize unexpected results
✓ Show why combination fails
✓ Highlight teaching away
✓ Preserve commercial embodiments
Rejected Independent Claim from Client's Patent Application: ${subjectClaims}
Complete Specification of Client's Patent Application: ${subjectDescription}
Examiner Detailed Rejection Reasoning: ${examinerReasoning}
Complete Specification of the Cited Prior Art References: ${priorArtDescription}
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
  verify103rejection,
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

      const prompt = `You are an expert patent prosecutor identifying the crown jewel novel feature to overcome a §103 obviousness rejection involving multiple references.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference1: ""
Complete Specification of the Cited Prior Art Reference2: ""
[Additional references as needed]

YOUR TASK:
PART 1 - NOVEL FEATURE DISCOVERY (Free-form narrative)
Write a comprehensive analysis that:
a) Maps the combination landscape

What does each reference contribute?
How does examiner propose to combine?
What's the resulting hypothetical device/method?
Where are the combination gaps?

b) Identifies non-obvious features

Features solving unrecognized problems
Features producing unexpected results
Features references teach away from
Features requiring non-obvious modifications

c) Validates true non-obviousness

Would combination destroy reference functionality?
Does feature contradict combination teachings?
Are there long-felt needs addressed?
Do secondary considerations apply?

d) Selects optimal novel feature for 103

Feature hardest to reach by combination
Feature providing unexpected advantages
Feature with teaching away evidence
Feature preserving broadest scope

This exhaustive analysis should identify features that cannot be reached through any reasonable combination of the cited references, with particular focus on unexpected results and teaching away.
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
NOVEL FEATURE PRINCIPLES FOR 103:
✓ Find features combination can't reach
✓ Emphasize unexpected results
✓ Show teaching away evidence
✓ Target unrecognized problems
✓ Maintain commercial coverage
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
  verify103rejection,
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

      const prompt = `You are an expert patent prosecutor leveraging existing dependent claims to efficiently overcome a §103 obviousness rejection involving multiple references.
PROVIDED INPUTS:

Rejected Independent Claim AND ALL Dependent Claims
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference1: ""
Complete Specification of the Cited Prior Art Reference2: ""
[Additional references as needed]

YOUR TASK:
PART 1 - DEPENDENT CLAIM STRATEGIC ANALYSIS (Free-form narrative)
a) Map dependent claims against combination

Which dependencies escape the combination?
Which add non-obvious limitations?
Which create unexpected results?
Which would references teach away from?

b) Evaluate combination-breaking potential

Dependencies making combination inoperable
Dependencies conflicting with reference teachings
Dependencies from different field
Dependencies solving different problems

c) Analyze synergistic dependencies

Which dependent features work together?
Do combinations produce unexpected results?
Are there commercial embodiment matches?
Can we create teaching away arguments?

d) Select optimal strategy for 103

Single dependency that breaks combination
Multiple dependencies creating synergy
Dependencies highlighting unexpected results
Dependencies preserving scope

Provide detailed analysis of how specific dependent claims either break the examiner's combination rationale or add features that would not have been obvious to combine with the cited references.
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
DEPENDENT CLAIM PRINCIPLES FOR 103:
✓ Find dependencies that break combination
✓ Show incompatibility with references
✓ Highlight unexpected advantages
✓ Preserve claim hierarchy
✓ Enable continuation strategy
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
  verify103rejection,
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

      const prompt = `You are an expert patent prosecutor crafting a multi-feature amendment strategy that creates an unassailable combination while preserving maximum scope against a §103 obviousness rejection.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference1: ""
Complete Specification of the Cited Prior Art Reference2: ""
[Additional references as needed]

YOUR TASK:
PART 1 - COMPOSITE STRATEGY DEVELOPMENT (Free-form narrative)
a) Map combination vulnerabilities

Where do references conflict?
What combinations create problems?
Which features are incompatible?
Where does combination fail?

b) Build synergistic non-obvious combination

Features producing unexpected results together
Elements references teach away from combining
Aspects solving unrecognized problems
Components from different fields

c) Analyze composite non-obviousness

Why wouldn't PHOSITA combine these?
What unexpected advantages emerge?
How do features interrelate uniquely?
What problems would combination create?

d) Structure optimal composite for 103

Lead with strongest non-obvious feature
Add synergistic elements
Create teaching away narrative
Maintain claim clarity

Thoroughly explain why this specific composite of features would not have been obvious to combine in view of the cited references, emphasizing unexpected synergies, teaching away, and technical incompatibilities.
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
COMPOSITE PRINCIPLES FOR 103:
✓ Synergistic unexpected results
✓ Multiple teaching away points
✓ Technical incompatibilities
✓ Unrecognized problem solving
✓ Strong design-around barriers
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
  verify103rejection,
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

      const prompt = `You are an expert patent prosecutor identifying THE ONE surgical amendment that defeats a §103 obviousness rejection with minimal scope sacrifice.
PROVIDED INPUTS:

Rejected Independent Claim from Client's Patent Application
Complete Specification of Client's Patent Application
Examiner's Detailed Rejection Reasoning
Complete Specification of the Cited Prior Art Reference1: ""
Complete Specification of the Cited Prior Art Reference2: ""
[Additional references as needed]

YOUR TASK:
PART 1 - ONE FEATURE IDENTIFICATION (Free-form narrative)
a) Find the combination breaker

What single feature defeats combination?
Which feature would PHOSITA not add?
What creates unexpected results alone?
What do references teach away from?

b) Apply obviousness filters

Is feature suggested by any reference?
Would combination naturally lead here?
Does feature solve recognized problem?
Are there design incentives for feature?

c) Validate non-obviousness of ONE

Check no reference hints at feature
Verify combination doesn't suggest it
Confirm unexpected advantages exist
Ensure teaching away evidence

d) Craft precision language for 103

Emphasize unexpected results
Highlight incompatibility
Show non-obvious advantages
Maintain detectability

Explain why this single feature cannot be reached through any reasonable combination of the references, focusing on unexpected results, teaching away, or incompatibility that makes the combination non-obvious.
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
ONE FEATURE PRINCIPLES FOR 103:
✓ Single feature breaking combination
✓ Unexpected results emphasis
✓ Teaching away evidence
✓ Minimal scope limitation
✓ Clear enforcement point
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
