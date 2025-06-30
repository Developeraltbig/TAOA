import mongoose from "mongoose";

const finalizedAmendmentSchema = new mongoose.Schema(
  {
    rejectionId: {
      type: String,
      required: true,
      unique: true,
    },
    applicationId: {
      type: String,
      required: true,
      ref: "ApplicationDetail",
      trim: true,
    },
    user: {
      type: Number,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: [
        "technicalComparison",
        "novelFeatures",
        "dependentClaims",
        "compositeAmendment",
        "oneFeatures",
      ],
    },
    amendedClaim: {
      preamble: {
        type: String,
        required: true,
      },
      elements: [
        {
          elementId: {
            type: String,
            required: true,
          },
          text: {
            type: String,
            required: true,
          },
        },
      ],
      additionalElements: [
        {
          elementId: {
            type: String,
            required: true,
          },
          text: {
            type: String,
            required: true,
          },
        },
      ],
    },
    comparisonTable: [
      {
        featureNumber: {
          type: Number,
        },
        subjectApplication: {
          type: String,
        },
        priorArt: {
          type: String,
        },
        differentiatingFeature: {
          type: String,
        },
      },
    ],
    amendmentStrategy: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "finalized"],
    },
    finalizedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const FinalizedAmendment = mongoose.model(
  "FinalizedAmendment",
  finalizedAmendmentSchema
);

export default FinalizedAmendment;
