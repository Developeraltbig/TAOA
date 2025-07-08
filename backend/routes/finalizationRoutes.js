import express from "express";
import Dockets from "../models/Dockets.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import FinalizedAmendment from "../models/FinalizedAmendment.js";

const router = express.Router();

router.post("/finalize", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const {
      type,
      rejectionId,
      applicationId,
      amendedClaim,
      comparisonTable,
      amendmentStrategy,
    } = req.body;

    if (!rejectionId || !type || !amendedClaim || !applicationId) {
      return res.status(400).json({
        status: "error",
        message: "Required fields are missing",
      });
    }

    const rejectionExists = await Dockets.findOne({ rejectionId });

    if (!rejectionExists) {
      return res.status(400).json({
        status: "error",
        message: "Rejection does not exists",
      });
    }

    await FinalizedAmendment.findOneAndUpdate(
      {
        rejectionId,
        applicationId,
        user: user.userId,
      },
      {
        type,
        amendedClaim,
        comparisonTable,
        amendmentStrategy,
        status: "finalized",
        finalizedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    await Dockets.findOneAndUpdate(
      {
        rejectionId,
        user: user.userId,
      },
      {
        finalizedType: type,
        showFinalizedType: true,
      }
    );

    res.status(200).json({
      status: "success",
      message: "Amendment finalized successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/status", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { rejectionId } = req.body;

    const finalizedAmendments = await Dockets.findOne({
      rejectionId,
      user: user.userId,
    });

    res.status(200).json({
      status: "success",
      message: "Successfully checked rejection status",
      data: finalizedAmendments || null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
