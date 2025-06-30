import Dockets from "../models/Dockets.js";
import ApplicationDetails from "../models/ApplicationDetails.js";
import ApplicationDocuments from "../models/ApplicationDocuments.js";
import { getClaimWithFallback } from "../libs/rejectionRoutesHelper.js";

export const verify102rejection = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (typeof data !== "object" || Object.keys(data).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    if (!data.rejectionType || data.rejectionType !== "102") {
      return res.status(400).json({
        status: "error",
        message: "Invalid rejection type",
      });
    }

    const applicationExist = await ApplicationDetails.findOne({
      applicationId: data.applicationId,
      user: data.user,
    });

    if (!applicationExist) {
      return res.status(400).json({
        status: "error",
        message: "Application doesn't exist",
      });
    }

    if (
      !applicationExist.isSubjectClaimsExists ||
      !applicationExist.isSubjectDescriptionExists ||
      !applicationExist.isPriorArtDescriptionExists
    ) {
      return res.status(400).json({
        status: "error",
        message: "Application Documents doesn't exist",
      });
    }

    const applicationDocuments = await ApplicationDocuments.findOne({
      applicationId: data.applicationId,
      user: data.user,
    });

    if (!applicationDocuments) {
      return res.status(400).json({
        status: "error",
        message: "Application Documents doesn't exist",
      });
    }

    const docketExist = await Dockets.findOne({
      rejectionId: data.rejectionId,
      user: data.user,
    });

    if (!docketExist) {
      return res.status(400).json({
        status: "error",
        message: "Dockets doesn't exist",
      });
    }

    const subjectDescription =
      applicationDocuments.subjectPublicationDescription;
    const priorArtNumber = data.priorArtReferences[0].citedPubNo;
    const priorArtDescription = applicationDocuments.priorArtDescription.filter(
      (prior) => prior.citedPubNo === priorArtNumber
    )[0].citedDescription;
    let subjectClaims = getClaimWithFallback(
      applicationDocuments.subjectPublicationClaim,
      data.rejectedClaims[0]
    );

    if (!subjectClaims) {
      return res.status(400).json({
        status: "error",
        message: "Rejected claim couldn't be found!",
      });
    }

    const examinerReasoning = applicationExist.rejections.filter(
      (reject) => reject._id.toString() === data.rejectionId
    )[0].examinerReasoning;
    req.data = {
      subjectClaims,
      user: data.user,
      examinerReasoning,
      subjectDescription,
      priorArtDescription,
      rejectionId: data.rejectionId,
      applicationId: data.applicationId,
      applicationNumber: applicationExist.applicationNumber,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const verify103rejection = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (typeof data !== "object" || Object.keys(data).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    if (!data.rejectionType || data.rejectionType !== "103") {
      return res.status(400).json({
        status: "error",
        message: "Invalid rejection type",
      });
    }

    const applicationExist = await ApplicationDetails.findOne({
      applicationId: data.applicationId,
      user: data.user,
    });

    if (!applicationExist) {
      return res.status(400).json({
        status: "error",
        message: "Application doesn't exist",
      });
    }

    if (
      !applicationExist.isSubjectClaimsExists ||
      !applicationExist.isSubjectDescriptionExists ||
      !applicationExist.isPriorArtDescriptionExists
    ) {
      return res.status(400).json({
        status: "error",
        message: "Application Documents doesn't exist",
      });
    }

    const applicationDocuments = await ApplicationDocuments.findOne({
      applicationId: data.applicationId,
      user: data.user,
    });

    if (!applicationDocuments) {
      return res.status(400).json({
        status: "error",
        message: "Application Documents doesn't exist",
      });
    }

    const docketExist = await Dockets.findOne({
      rejectionId: data.rejectionId,
      user: data.user,
    });

    if (!docketExist) {
      return res.status(400).json({
        status: "error",
        message: "Dockets doesn't exist",
      });
    }

    const subjectDescription =
      applicationDocuments.subjectPublicationDescription;
    const priorArtNumber = data.priorArtReferences.map(
      (prior) => prior.citedPubNo
    );
    const priorArtDescription = applicationDocuments.priorArtDescription.filter(
      (prior) => priorArtNumber.includes(prior.citedPubNo)
    );
    const examinerReasoning = applicationExist.rejections.filter(
      (reject) => reject._id.toString() === data.rejectionId
    )[0].examinerReasoning;
    let subjectClaims = getClaimWithFallback(
      applicationDocuments.subjectPublicationClaim,
      data.rejectedClaims[0]
    );
    req.data = {
      subjectClaims,
      user: data.user,
      examinerReasoning,
      subjectDescription,
      priorArtDescription,
      rejectionId: data.rejectionId,
      applicationId: data.applicationId,
      applicationNumber: applicationExist.applicationNumber,
    };
    next();
  } catch (error) {
    next(error);
  }
};
