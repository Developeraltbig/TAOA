import mongoose from "mongoose";

const docketsSchema = new mongoose.Schema(
  {
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
    finalizedType: {
      type: String,
      enum: [
        "technicalComparison",
        "novelFeatures",
        "dependentClaims",
        "compositeAmendment",
        "oneFeatures",
      ],
    },
    showFinalizedType: {
      type: Boolean,
    },
    rejectionId: {
      type: String,
      required: true,
      unique: true,
    },
    rejectionType: {
      type: String,
      required: true,
    },
    rejectedClaims: [
      {
        type: Number,
      },
    ],
    priorArtReferences: [
      {
        citedPubNo: {
          type: String,
          required: true,
          trim: true,
        },
        citedPubURL: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    subjectPublicationNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Dockets = mongoose.model("Docket", docketsSchema);

export default Dockets;
