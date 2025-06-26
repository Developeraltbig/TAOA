import express from "express";
import {
  generateResponse,
  extractAndParseAllJson,
} from "../libs/rejectionRoutesHelper.js";
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

      await saveToFile(rawText, `unclean/${applicationNumber}.json`);

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse technical comparison claim!",
        });
      }

      await saveToFile(data, `data/${applicationNumber}.json`);

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

      await saveToFile(rawText, `unclean/${applicationNumber}.json`);

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse novel features claim!",
        });
      }

      await saveToFile(data, `data/${applicationNumber}.json`);

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

      await saveToFile(rawText, `unclean/${applicationNumber}.json`);

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse dependent claims!",
        });
      }

      await saveToFile(data, `data/${applicationNumber}.json`);

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

      await saveToFile(rawText, `unclean/${applicationNumber}.json`);

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse composite amendment claim!",
        });
      }

      await saveToFile(data, `data/${applicationNumber}.json`);

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

      await saveToFile(rawText, `unclean/${applicationNumber}.json`);

      let data = extractAndParseAllJson(rawText);

      if (data === null) {
        rawText = await generateResponse(prompt, applicationNumber);
        await saveToFile(rawText, `unclean/${applicationNumber}.json`);
        data = extractAndParseAllJson(rawText);
      }

      if (data === null) {
        return res.status(400).json({
          status: "error",
          message: "Failed to analyse one features claim!",
        });
      }

      await saveToFile(data, `data/${applicationNumber}.json`);

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
