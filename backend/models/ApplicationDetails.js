import mongoose from "mongoose";

const applicationDetailsSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      length: 6,
    },
    applicationNumber: {
      type: Number,
      required: true,
      trim: true,
    },
    publicationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isSubjectDescriptionExists: {
      type: Boolean,
      required: true,
    },
    isSubjectClaimsExists: {
      type: Boolean,
      required: true,
    },
    isPriorArtDescriptionExists: {
      type: Boolean,
      required: true,
    },
    isFirstRejection: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Number,
      required: true,
      ref: "User",
    },
    applicationDetails: {
      inventionTitle: {
        type: String,
        required: true,
        trim: true,
      },
      lastFilingDate: {
        type: String,
        required: true,
        trim: true,
      },
    },
    rejections: [
      {
        analyseRejection: {
          type: Boolean,
        },
        rejectionType: {
          type: String,
          required: true,
          trim: true,
        },
        claimsRejected: [
          {
            type: Number,
          },
        ],
        priorArtReferences: [
          {
            citedPubNo: {
              type: String,
              trim: true,
            },
            citedPubURL: {
              type: String,
              trim: true,
            },
          },
        ],
        examinerReasoning: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    claimStatus: [
      {
        claimNumbers: {
          type: String,
          required: true,
          trim: true,
        },
        status: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    viewTutorial: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ApplicationDetails = mongoose.model(
  "ApplicationDetail",
  applicationDetailsSchema
);

export default ApplicationDetails;
