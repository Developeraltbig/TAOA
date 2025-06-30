import mongoose from "mongoose";

const otherRejectionResponseSchema = new mongoose.Schema(
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
    },
    user: {
      type: Number,
      required: true,
      ref: "User",
    },
    response: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
    finalizedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const OtherRejectionResponse = mongoose.model(
  "OtherRejectionResponse",
  otherRejectionResponseSchema
);

export default OtherRejectionResponse;
