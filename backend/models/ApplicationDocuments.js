import mongoose from "mongoose";

const applicationDocumentsSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      ref: "ApplicationDetail",
      trim: true,
      unique: true,
    },
    subjectPublicationDescription: {
      type: String,
    },
    subjectPublicationClaim: {
      type: String,
    },
    user: {
      type: Number,
      required: true,
      ref: "User",
    },
    structuredClaims: [
      {
        independentClaim: {
          type: Number,
        },
        dependentClaims: [{ type: Number }],
      },
    ],
    priorArtDescription: [
      {
        citedPubNo: {
          type: String,
          trim: true,
        },
        citedDescription: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ApplicationDocuments = mongoose.model(
  "ApplicationDocument",
  applicationDocumentsSchema
);

export default ApplicationDocuments;
