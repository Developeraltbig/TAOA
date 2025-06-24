import express from "express";
import Dockets from "../models/Dockets.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import ApplicationDetails from "../models/ApplicationDetails.js";

const router = express.Router();

router.post("/generate", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { rejection, applicationId, publicationNumber } = req.body;

    if (!rejection || !applicationId || !publicationNumber) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    const checkApplicationExists = await ApplicationDetails.findOne({
      applicationId: applicationId,
      user: user.userId,
    });
    if (!checkApplicationExists) {
      return res.status(400).json({
        status: "error",
        message: "Application doesn't exist",
      });
    }

    const checkRejectionExistsInApplication =
      checkApplicationExists.rejections.some(
        (reject) =>
          reject._id.toString() === rejection._id &&
          (reject.rejectionType.includes("102") ||
            reject.rejectionType.includes("103"))
      );
    if (!checkRejectionExistsInApplication) {
      return res.status(400).json({
        status: "error",
        message: "Rejection doesn't exist or invalid rejection",
      });
    }

    const checkRejectionExistsInDatabase = await Dockets.findOne({
      rejectionId: rejection._id,
    });
    if (checkRejectionExistsInDatabase) {
      return res.status(400).json({
        status: "error",
        message: "Rejection already exist",
      });
    }

    const newDocket = new Dockets({
      applicationId,
      rejectionId: rejection._id,
      subjectPublicationNumber: publicationNumber,
      priorArtReferences: rejection.priorArtReferences,
      rejectedClaims: rejection?.claimsRejected,
      rejectionType: rejection.rejectionType.includes("102") ? "102" : "103",
      user: user.userId,
    });

    await newDocket.save();

    res.status(200).json({
      status: "success",
      message: `Successfully created the docket`,
      data: newDocket,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
