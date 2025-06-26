import mongoose from "mongoose";

const novelFeatureSchema = new mongoose.Schema(
  {
    user: {
      type: Number,
      required: true,
      ref: "User",
    },
    applicationId: {
      type: String,
      required: true,
      ref: "ApplicationDetail",
    },
    rejectionId: {
      type: String,
      required: true,
      unique: true,
    },
    comparisonTable: [
      {
        featureNumber: {
          type: Number,
          trim: true,
        },
        subjectApplication: {
          type: String,
          trim: true,
        },
        priorArt: {
          type: String,
          trim: true,
        },
        differentiatingFeature: {
          type: String,
          trim: true,
        },
      },
    ],
    amendedClaim: {
      preamble: {
        type: String,
        trim: true,
      },
      elements: [
        {
          elementId: {
            type: String,
            trim: true,
          },
          text: {
            type: String,
            trim: true,
          },
        },
      ],
      additionalElements: [
        {
          elementId: {
            type: String,
            trim: true,
          },
          text: {
            type: String,
            trim: true,
          },
        },
      ],
    },
    amendmentStrategy: {
      type: String,
      trim: true,
    },
    rejectedClaim: {
      type: String,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const NovelFeature = mongoose.model("NovelFeature", novelFeatureSchema);

export default NovelFeature;
