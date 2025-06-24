import express from "express";
import {
  generateResponse,
  extractAndParseAllJson,
} from "../libs/rejectionRoutesHelper.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { saveToFile } from "../libs/applicationRoutesHelpers.js";
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
1. Rejected Independent Claim from Client's Patent Application
2. Complete Specification of Client's Patent Application  
3. Examiner's Detailed Rejection Reasoning
4. Complete Specification of the Cited Prior Art Reference

YOUR TASK:

PART 1 - COMPREHENSIVE ANALYSIS (Free-form narrative)
Write a detailed analytical essay that:

a) Understands the rejected claim in light of its specification
   - Break down each claim element
   - Identify the technical problem and inventive concept
   - Note critical specification support (para/fig numbers)

b) Dissects the examiner's rejection
   - Identify exact prior art portions cited (para/col/line numbers)
   - Understand examiner's element mapping
   - Spot any misinterpretations or overreach

c) Performs deep technical comparison
   - Is this a structural or functional claim?
   - Apply key doctrines: inherency, functional claiming equivalence
   - For each potential difference, evaluate:
     * Is it truly absent from prior art?
     * Does it provide unexpected advantages?
     * Is it more than an obvious design choice?
   - Consider what prior art actually teaches vs examiner's interpretation

d) Identifies the strongest differentiating features
   - Focus on features that solve unrecognized problems
   - Highlight non-obvious technical advantages
   - Ensure specification support exists

This should be a thorough, story-telling analysis that builds your case.

PART 2 - STRUCTURED OUTPUTS

Based on your analysis above, provide ONLY these two outputs:

1. TECHNICAL COMPARISON TABLE:
{
  "comparisonTable": [
    {
      "featureNumber": 1,
      "subjectApplication": "Describe what the claim/specification teaches for this feature, with exact language where relevant [Spec Para X, Lines Y-Z or Claim X]",
      "priorArt": "Describe what the prior art actually discloses regarding this feature [Prior Art Para A, Col B, Lines C-D] or state 'Prior art does not disclose [specific feature]. Examiner cites [X] which only teaches [Y]'",
      "differentiatingFeature": "The subject application differs by [specific technical distinction]. This distinction is significant because [technical advantage/unexpected result/problem solved that prior art does not address]"
    }
  ]
}
Limit to 4-5 strongest differentiating features that can overcome the rejection.
2.	STRATEGIC CLAIM AMENDMENT:
{
  "amendedClaim": {
    "preamble": "A [device/method/system] for [purpose], comprising:",
    "elements": [
      {
        "elementId": "(a)",
        "text": "complete element text with any amendments incorporated"
      },
      {
        "elementId": "(b)", 
        "text": "complete element text with any amendments incorporated"
      },
      {
        "elementId": "(c)",
        "text": "complete element text with any amendments incorporated"
      }
    ],
    "additionalElements": [
      {
        "elementId": "(d)",
        "text": "any new elements added to distinguish over prior art"
      }
    ]
  },
  "amendmentStrategy": "Explain how these amendments: (1) distinguish over the cited prior art, (2) maintain broad commercial scope, (3) are fully supported by the specification, and (4) avoid introducing indefiniteness or other issues"
}
IMPORTANT NOTE ON JSON DATA: Each of the json output – first, the comparison one should start with \`\`\`json and end with \`\`\`. Same for the next json output of amendment to start with \`\`\`json and end with \`\`\`.
AMENDMENT GUIDELINES:
•	Add limitations that meaningfully distinguish while preserving commercial value
•	Use clear, definite language supported by the specification
•	Avoid unnecessarily narrow limitations unless required
•	Consider adding functional language tied to the inventive concept
•	Ensure all antecedent basis is proper
•	Think about enforcement and design-around concerns
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
          message: "Failed to analyse technical comparison",
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

export default router;
