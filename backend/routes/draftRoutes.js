import express from "express";
import Dockets from "../models/Dockets.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import ApplicationDetails from "../models/ApplicationDetails.js";
import FinalizedAmendment from "../models/FinalizedAmendment.js";
import { generateDraftDocument } from "../libs/draftGenerator.js";
import OtherRejectionResponse from "../models/OtherRejectionResponse.js";

const router = express.Router();

router.post("/generate", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { applicationId, applicationNumber } = req.body;

    if (!applicationId || !applicationNumber) {
      return res.status(400).json({
        status: "error",
        message: "Application number is required",
      });
    }

    const application = await ApplicationDetails.findOne({
      applicationId,
      user: user.userId,
    });

    if (!application) {
      return res.status(400).json({
        status: "error",
        message: "Application not found",
      });
    }

    const draftData = {
      applicationNumber,
      applicationId,
      publicationNumber: application.publicationNumber,
      rejections: [],
      dateGenerated: new Date(),
    };

    for (const rejection of application.rejections) {
      const rejectionData = {
        type: rejection.rejectionType,
        claims: rejection.claimsRejected,
        priorArtReferences: rejection.priorArtReferences,
        examinerReasoning: rejection.examinerReasoning,
        response: null,
      };

      if (rejection?.analyseRejection) {
        const docket = await Dockets.findOne({
          rejectionId: rejection._id,
          user: user.userId,
        });

        if (docket) {
          const finalizedAmendments = await FinalizedAmendment.findOne({
            rejectionId: rejection._id,
            user: user.userId,
          });

          rejectionData.response = {
            type: finalizedAmendments.type,
            amendedClaim: finalizedAmendments.amendedClaim,
            comparisonTable: finalizedAmendments.comparisonTable,
            amendmentStrategy: finalizedAmendments.amendmentStrategy,
            finalizedAt: finalizedAmendments.finalizedAt,
          };
        }
      } else {
        const otherResponse = await OtherRejectionResponse.findOne({
          rejectionId: rejection._id,
          user: user.userId,
        });

        if (otherResponse) {
          rejectionData.response = {
            type: "other",
            userResponse: otherResponse.response,
            finalizedAt: otherResponse.finalizedAt,
          };
        }
      }
      draftData.rejections.push(rejectionData);
    }

    const documentBuffer = await generateDraftDocument(draftData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Draft_Response_${applicationNumber}.docx"`
    );
    res.send(documentBuffer);
  } catch (error) {
    next(error);
  }
});

router.post("/preview", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { applicationId } = req.body;

    const application = await ApplicationDetails.findOne({
      applicationId,
      user: user.userId,
    });

    if (!application) {
      return res.status(404).json({
        status: "error",
        message: "Application not found",
      });
    }

    const preview = {
      totalRejections: application.rejections.length,
      rejectionTypes: application.rejections.map((r) => r.rejectionType),
      readyForGeneration: true,
      missingItems: [],
    };

    for (const rejection of application.rejections) {
      if (
        rejection.rejectionType.includes("102") ||
        rejection.rejectionType.includes("103")
      ) {
        if (rejection.analyseRejection) {
          const amendments = await FinalizedAmendment.findOne({
            rejectionId: rejection._id,
            user: user.userId,
          });
          if (amendments?.status !== "finalized") {
            preview.readyForGeneration = false;
            preview.missingItems.push(
              `No finalized amendments for ${rejection.rejectionType}`
            );
          }
        }
      } else {
        const response = await OtherRejectionResponse.findOne({
          rejectionId: rejection._id.toString(),
          user: user.userId,
        });
        if (!response || response.status !== "finalized") {
          preview.readyForGeneration = false;
          preview.missingItems.push(
            `No response for ${rejection.rejectionType}`
          );
        }
      }
    }

    res.status(200).json({
      status: "success",
      message: "Successfully fetched finalized status",
      data: preview,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
