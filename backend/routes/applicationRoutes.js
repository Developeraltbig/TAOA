import express from "express";
import {
  uploadPdf,
  extractTextFromDoc,
  extractTextFromPDF,
} from "../libs/analyzeDocument.js";
import { customAlphabet } from "nanoid";
import Dockets from "../models/Dockets.js";
import {
  parseDate,
  isRejectionDoc,
  checkInclusion,
  getFullBodyText,
  generatePatentUrl,
  extractFilingDate,
  processClaimsWithAI,
  fetchOfficeActionData,
  getApplicationDetails,
  fetchPublicationDetails,
  extractApplicationNumber,
  fetchPatentTextFromSerpAPI,
  backgroundProcessRejection,
} from "../libs/applicationRoutesHelpers.js";
import { upload } from "../middlewares/multer.js";
import { getCLMCount } from "../libs/usptoService.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import ApplicationDetails from "../models/ApplicationDetails.js";
import TechnicalComparison from "../models/TechnicalComparison.js";
import ApplicationDocuments from "../models/ApplicationDocuments.js";

const router = express.Router();
const enviroment = process.env.NODE_ENV;

const generateApplicationId = customAlphabet(
  "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  6
);

router.post("/analyse", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { appNumber } = req.body;
    if (!appNumber) {
      return res.status(400).json({
        status: "error",
        message: "Application number is required",
      });
    }

    const applicationExist = await ApplicationDetails.findOneAndUpdate(
      {
        applicationNumber: appNumber,
        user: user.userId,
      },
      { $set: { updatedAt: new Date() } },
      { sort: { updatedAt: -1 }, new: true }
    );

    const getApplicationWithDockets = async (application, user) => {
      const dockets = await Dockets.find({
        applicationId: application.applicationId,
        user: user.userId,
      }).sort({ updatedAt: 1 });

      const applicationObj = application.toObject();

      applicationObj.dockets = await Promise.all(
        dockets.map(async (docket) => {
          const technicalData = await TechnicalComparison.findOne({
            user: user.userId,
            rejectionId: docket.rejectionId,
            applicationId: application.applicationId,
          });
          return {
            ...docket.toObject(),
            technicalData: technicalData ? technicalData : {},
          };
        })
      );

      return applicationObj;
    };

    if (applicationExist) {
      const applicationWithDockets = await getApplicationWithDockets(
        applicationExist,
        user
      );
      return res.status(200).json({
        status: "success",
        message: `Successfully fetched all the rejection summary`,
        data: applicationWithDockets,
      });
    }

    const results = await fetchOfficeActionData(appNumber);
    if (!results) {
      return res.status(400).json({
        status: "error",
        message:
          "Failed to fetch data or no data available for this application number.",
      });
    }

    const docs = results.response?.docs || results.docs || [];
    const rejectionDocs = docs.filter((doc) => isRejectionDoc(doc));

    let isFirstRejection = true;
    if (!rejectionDocs.length) {
      return res.status(400).json({
        status: "error",
        message: "No rejection documents found for this application.",
      });
    } else if (rejectionDocs.length > 1) {
      isFirstRejection = false;
    }

    if (isFirstRejection) {
      const clmResult = await getCLMCount(appNumber);

      if (clmResult.success) {
        const clmCount = clmResult.clmCount;
        isFirstRejection = clmCount === 1;
      } else {
        isFirstRejection = false;
      }
    }

    const sortedDocs = rejectionDocs.sort((a, b) => {
      const [, dateA] = parseDate(a);
      const [, dateB] = parseDate(b);
      return (dateB || new Date(0)) - (dateA || new Date(0));
    });

    const latestDoc = sortedDocs[0];
    const latestRejectionText = getFullBodyText(latestDoc);
    const publicationDetails = await fetchPublicationDetails(appNumber);

    if (!publicationDetails) {
      return res.status(400).json({
        status: "error",
        message: "Failed to extract publication details",
      });
    }

    const applicationDetails = getApplicationDetails(latestDoc);

    const aiResponse = await backgroundProcessRejection(
      appNumber,
      latestRejectionText
    );

    if (!aiResponse) {
      return res.status(400).json({
        status: "error",
        message: "Failed to generate rejection. Please try again!",
      });
    }

    const processedRejection = aiResponse.rejections.map((rejection) => {
      if (rejection?.priorArtReferences?.length > 0) {
        return {
          ...rejection,
          analyseRejection:
            rejection.rejectionType.includes("102") ||
            rejection.rejectionType.includes("103"),
          priorArtReferences: rejection.rejectionType.includes("102")
            ? [generatePatentUrl(rejection.priorArtReferences[0])]
            : rejection.priorArtReferences.map((priorReference) =>
                generatePatentUrl(priorReference)
              ),
        };
      }
      return rejection;
    });

    let applicationId;
    let isUnique = false;
    const maxAttempts = 10;
    let attempts = 0;

    while (!isUnique && attempts < maxAttempts) {
      applicationId = generateApplicationId();
      const existingRecord = await ApplicationDetails.findOne({
        applicationId,
      });
      if (!existingRecord) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        status: "error",
        message: "Failed to generate a unique application ID",
      });
    }

    const newApplication = new ApplicationDetails({
      applicationId,
      applicationNumber: appNumber,
      isFirstRejection,
      publicationNumber: "US" + publicationDetails.document_number + "A1",
      user: user.userId,
      applicationDetails,
      isSubjectClaimsExists: false,
      isPriorArtDescriptionExists: false,
      isSubjectDescriptionExists: false,
      rejections: processedRejection,
      claimStatus: aiResponse.claimStatus,
    });

    await newApplication.save();

    res.status(200).json({
      status: "success",
      message: `Successfully generated all the rejection summary`,
      data: newApplication,
    });
  } catch (error) {
    if (error.message.includes("Error in fetching publication details")) {
      return res.status(400).json({
        status: "error",
        message: "Failed to extract publication details. Please try again!",
      });
    } else if (error.message.includes("Error in AI Processing")) {
      return res.status(400).json({
        status: "error",
        message: "Failed to generate rejection. Please try again!",
      });
    } else {
      next(error);
    }
  }
});

router.post(
  "/upload",
  upload.single("file"),
  verifyToken,
  async (req, res, next) => {
    try {
      const user = req.user;
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          status: "error",
          message: "File is required",
        });
      }

      let text;
      if (file.mimetype === "application/pdf") {
        const uploadedPdfURL = await uploadPdf(file.originalname, file.buffer);
        text = await extractTextFromPDF(uploadedPdfURL);
      } else if (
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await extractTextFromDoc(file.buffer);
      } else {
        throw new Error("Unsupported file type");
      }

      const appNumber = extractApplicationNumber(text);
      if (!appNumber) {
        return res.status(400).json({
          status: "error",
          message: "Invalid document",
        });
      }

      const applicationExist = await ApplicationDetails.findOneAndUpdate(
        {
          applicationNumber: appNumber,
          user: user.userId,
        },
        { $set: { updatedAt: new Date() } },
        { sort: { updatedAt: -1 }, new: true }
      );

      const getApplicationWithDockets = async (application, user) => {
        const dockets = await Dockets.find({
          applicationId: application.applicationId,
          user: user.userId,
        }).sort({ updatedAt: 1 });

        const applicationObj = application.toObject();

        applicationObj.dockets = await Promise.all(
          dockets.map(async (docket) => {
            const technicalData = await TechnicalComparison.findOne({
              user: user.userId,
              rejectionId: docket.rejectionId,
              applicationId: application.applicationId,
            });
            return {
              ...docket.toObject(),
              technicalData: technicalData ? technicalData : {},
            };
          })
        );

        return applicationObj;
      };

      if (applicationExist) {
        const applicationWithDockets = await getApplicationWithDockets(
          applicationExist,
          user
        );
        return res.status(200).json({
          status: "success",
          message: `Successfully fetched all the rejection summary`,
          data: applicationWithDockets,
        });
      }

      const results = await fetchOfficeActionData(appNumber);
      if (!results) {
        return res.status(400).json({
          status: "error",
          message: "No data available for this application number.",
        });
      }

      const docs = results.response?.docs || results.docs || [];
      const rejectionDocs = docs.filter((doc) => isRejectionDoc(doc));

      let isFirstRejection = true;
      if (!rejectionDocs.length) {
        return res.status(400).json({
          status: "error",
          message: "Invalid document",
        });
      } else if (rejectionDocs.length > 1) {
        isFirstRejection = false;
      }

      if (isFirstRejection) {
        const clmResult = await getCLMCount(appNumber);

        if (clmResult.success) {
          const clmCount = clmResult.clmCount;
          isFirstRejection = clmCount === 1;
        } else {
          isFirstRejection = false;
        }
      }

      const sortedDocs = rejectionDocs.sort((a, b) => {
        const [, dateA] = parseDate(a);
        const [, dateB] = parseDate(b);
        return (dateB || new Date(0)) - (dateA || new Date(0));
      });

      const latestDoc = sortedDocs[0];
      const latestRejectionText = getFullBodyText(latestDoc);

      const filingDate = extractFilingDate(text);
      if (!filingDate) {
        return res.status(400).json({
          status: "error",
          message: "Invalid document",
        });
      }

      const isLatestRejection = checkInclusion(text, latestRejectionText);
      if (!isLatestRejection) {
        return res.status(400).json({
          status: "error",
          message:
            "The document is either invalid or not the latest rejection notice.",
        });
      }

      const publicationDetails = await fetchPublicationDetails(appNumber);

      if (!publicationDetails) {
        return res.status(400).json({
          status: "error",
          message: "Failed to extract publication details",
        });
      }

      const aiResponse = await backgroundProcessRejection(appNumber, text);

      if (!aiResponse) {
        return res.status(400).json({
          status: "error",
          message: "Failed to generate rejection. Please try again!",
        });
      }

      const processedRejection = aiResponse.rejections.map((rejection) => {
        if (rejection?.priorArtReferences?.length > 0) {
          return {
            ...rejection,
            analyseRejection:
              rejection.rejectionType.includes("102") ||
              rejection.rejectionType.includes("103"),
            priorArtReferences: rejection.rejectionType.includes("102")
              ? [generatePatentUrl(rejection.priorArtReferences[0])]
              : rejection.priorArtReferences.map((priorReference) =>
                  generatePatentUrl(priorReference)
                ),
          };
        }
        return rejection;
      });

      let applicationId;
      let isUnique = false;
      const maxAttempts = 10;
      let attempts = 0;

      while (!isUnique && attempts < maxAttempts) {
        applicationId = generateApplicationId();
        const existingRecord = await ApplicationDetails.findOne({
          applicationId,
        });
        if (!existingRecord) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({
          status: "error",
          message: "Failed to generate a unique application ID",
        });
      }

      const newApplication = new ApplicationDetails({
        applicationId,
        applicationNumber: appNumber,
        publicationNumber: "US" + publicationDetails.document_number + "A1",
        isFirstRejection,
        user: user.userId,
        isSubjectClaimsExists: false,
        isSubjectDescriptionExists: false,
        isPriorArtDescriptionExists: false,
        applicationDetails: {
          inventionTitle: publicationDetails.publication_title,
          lastFilingDate: filingDate,
        },
        rejections: processedRejection,
        claimStatus: aiResponse.claimStatus,
      });

      await newApplication.save();

      res.status(200).json({
        status: "success",
        message: `Successfully generated all the rejection summary`,
        data: newApplication,
      });
    } catch (error) {
      if (
        error.message.includes("Only .pdf") ||
        error.message.includes("Unsupported file type")
      ) {
        if (enviroment === "development") {
          console.error(error);
        }
        return res.status(400).json({
          status: "error",
          message: "Only .pdf and .doc/.docx files are allowed",
        });
      } else if (
        error.message.includes("Failed to extract text") ||
        error.message.includes("Failed to upload file to Mistral AI")
      ) {
        if (enviroment === "development") {
          console.error(error);
        }
        return res.status(400).json({
          status: "error",
          message: "Failed to process file content",
        });
      } else if (
        error.message.includes("Error in fetching publication details")
      ) {
        return res.status(400).json({
          status: "error",
          message: "Failed to extract publication details. Please try again!",
        });
      } else if (error.message.includes("Error in AI Processing")) {
        return res.status(400).json({
          status: "error",
          message: "Failed to generate rejection. Please try again!",
        });
      } else {
        next(error);
      }
    }
  }
);

router.post(
  "/fetchLatestThreeApplication",
  verifyToken,
  async (req, res, next) => {
    const user = req.user;
    try {
      const applications = await ApplicationDetails.find({
        user: user.userId,
      })
        .sort({ updatedAt: -1 })
        .limit(3);

      const applicationWithDockets = await Promise.all(
        applications.map(async (application) => {
          const dockets = await Dockets.find({
            applicationId: application.applicationId,
            user: user.userId,
          }).sort({ updatedAt: 1 });

          const applicationObj = application.toObject();
          applicationObj.dockets = await Promise.all(
            dockets.map(async (docket) => {
              const technicalData = await TechnicalComparison.findOne({
                user: user.userId,
                rejectionId: docket.rejectionId,
                applicationId: application.applicationId,
              });
              return {
                ...docket.toObject(),
                technicalData: technicalData ? technicalData : {},
              };
            })
          );
          return applicationObj;
        })
      );

      res.status(200).json({
        status: "success",
        message: `Successfully fetched last 3 application`,
        data: applicationWithDockets,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/fetchAllApplication", verifyToken, async (req, res, next) => {
  const user = req.user;
  try {
    const applications = await ApplicationDetails.find({
      user: user.userId,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      status: "success",
      message: `Successfully fetched all application`,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/uploadClaims",
  upload.single("file"),
  verifyToken,
  async (req, res, next) => {
    try {
      const user = req.user;
      const file = req.file;
      const { applicationId } = req.body;
      if (!file || !applicationId) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      let text;
      if (file.mimetype === "application/pdf") {
        const uploadedPdfURL = await uploadPdf(file.originalname, file.buffer);
        text = await extractTextFromPDF(uploadedPdfURL);
      } else if (
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await extractTextFromDoc(file.buffer);
      } else {
        throw new Error("Unsupported file type");
      }

      const appNumber = extractApplicationNumber(text);

      let applicationExist = {};
      if (appNumber) {
        applicationExist = await ApplicationDetails.findOne({
          applicationNumber: appNumber,
          user: user.userId,
        });
      }

      if (
        Object.keys(applicationExist).length > 0 &&
        applicationExist?.applicationId !== applicationId
      ) {
        return res.status(400).json({
          status: "error",
          message: "Invalid document",
        });
      }

      let structuredClaims = await processClaimsWithAI(text);
      if (!structuredClaims) {
        structuredClaims = await processClaimsWithAI(text);
      }

      if (!structuredClaims) {
        return res.status(400).json({
          status: "error",
          message: "Failed to process file content",
        });
      }

      const independentClaims = structuredClaims.map(
        (claim) => claim.independentClaim
      );

      await ApplicationDocuments.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            updatedAt: new Date(),
            subjectPublicationClaim: text,
            structuredClaims,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      const updatedApplication = await ApplicationDetails.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            "rejections.$[rej].analyseRejection": false,
            isSubjectClaimsExists: true,
          },
        },
        {
          new: true,
          arrayFilters: [
            {
              "rej.claimsRejected": {
                $not: { $elemMatch: { $in: independentClaims } },
              },
            },
          ],
        }
      );

      const getApplicationWithDockets = async () => {
        const dockets = await Dockets.find({
          applicationId,
          user: user.userId,
        }).sort({ updatedAt: -1 });

        const applicationObj = updatedApplication.toObject();
        applicationObj.dockets = dockets.map((docket) => docket.toObject());
        return applicationObj;
      };

      const applicationWithDockets = await getApplicationWithDockets();

      return res.status(200).json({
        status: "success",
        message: "Uploaded Claims",
        data: applicationWithDockets,
      });
    } catch (error) {
      if (
        error.message.includes("Only .pdf") ||
        error.message.includes("Unsupported file type")
      ) {
        if (enviroment === "development") {
          console.error(error);
        }
        return res.status(400).json({
          status: "error",
          message: "Only .pdf and .doc/.docx files are allowed",
        });
      } else if (
        error.message.includes("Failed to extract text") ||
        error.message.includes("Failed to upload file to Mistral AI") ||
        error.message.includes("Error parsing AI processing")
      ) {
        if (enviroment === "development") {
          console.error(error);
        }
        return res.status(400).json({
          status: "error",
          message: "Failed to process file content",
        });
      } else {
        next(error);
      }
    }
  }
);

router.post("/fetchSubjectDescription", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { applicationId, publicationNumber, isFirstRejection } = req.body;
    if (
      !applicationId ||
      !publicationNumber ||
      isFirstRejection === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    const checkApplicationExists = await ApplicationDetails.findOne({
      applicationId,
      user: user.userId,
    });
    if (
      !checkApplicationExists ||
      checkApplicationExists?.publicationNumber !== publicationNumber
    ) {
      return res.status(400).json({
        status: "error",
        message: "Application doesn't exist",
      });
    }

    const subjectDescription = await fetchPatentTextFromSerpAPI(
      publicationNumber,
      isFirstRejection
    );

    let updatedApplication = {};
    if (isFirstRejection) {
      const structuredClaims = await processClaimsWithAI(
        subjectDescription.claims
      );
      if (!structuredClaims) {
        structuredClaims = await processClaimsWithAI(subjectDescription.claims);
      }

      if (!structuredClaims) {
        return res.status(400).json({
          status: "error",
          message: "Failed to process file content",
        });
      }
      const independentClaims = structuredClaims.map(
        (claim) => claim.independentClaim
      );

      await ApplicationDocuments.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            updatedAt: new Date(),
            subjectPublicationDescription: subjectDescription.fullDescription,
            subjectPublicationClaim: subjectDescription.claims,
            structuredClaims,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      updatedApplication = await ApplicationDetails.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            "rejections.$[rej].analyseRejection": false,
            isSubjectClaimsExists: true,
            isSubjectDescriptionExists: true,
          },
        },
        {
          new: true,
          arrayFilters: [
            {
              "rej.claimsRejected": {
                $not: { $elemMatch: { $in: independentClaims } },
              },
            },
          ],
        }
      );
    } else {
      await ApplicationDocuments.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            updatedAt: new Date(),
            subjectPublicationDescription: subjectDescription,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      updatedApplication = await ApplicationDetails.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            isSubjectDescriptionExists: true,
          },
        },
        {
          new: true,
        }
      );
    }

    const getApplicationWithDockets = async () => {
      const dockets = await Dockets.find({
        applicationId,
        user: user.userId,
      }).sort({ updatedAt: -1 });

      const applicationObj = updatedApplication.toObject();
      applicationObj.dockets = dockets.map((docket) => docket.toObject());
      return applicationObj;
    };

    const applicationWithDockets = await getApplicationWithDockets();

    res.status(200).json({
      status: "success",
      message: `Successfully fetched subject description`,
      data: applicationWithDockets,
    });
  } catch (error) {
    if (
      error.message.includes(
        "No patent text retrieved from API or description link"
      ) ||
      error.message.includes("Error fetching patent information")
    ) {
      if (enviroment === "development") {
        console.error(error);
      }
      return res.status(400).json({
        status: "error",
        message: "Failed to fetch application description",
      });
    } else if (error.message.includes("Error parsing AI processing")) {
      if (enviroment === "development") {
        console.error(error);
      }
      return res.status(400).json({
        status: "error",
        message: "Failed to fetch application claims",
      });
    } else {
      next(error);
    }
  }
});

router.post(
  "/fetchPriorArtDescription",
  verifyToken,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { applicationId } = req.body;

      if (!applicationId) {
        return res.status(400).json({
          status: "error",
          message: "All fields are required",
        });
      }

      const checkApplicationExists = await ApplicationDetails.findOne({
        applicationId,
        user: user.userId,
      });
      if (!checkApplicationExists) {
        return res.status(400).json({
          status: "error",
          message: "Application doesn't exist",
        });
      }

      const allPriorArt = checkApplicationExists.rejections.flatMap(
        (rejection) => rejection.priorArtReferences
      );

      const uniquePubNos = [
        ...new Set(allPriorArt.map((prior) => prior.citedPubNo)),
      ];

      const priorArtPromises = uniquePubNos.map(async (pubNo) => {
        const description = await fetchPatentTextFromSerpAPI(pubNo);
        return {
          citedPubNo: pubNo,
          citedDescription: description,
        };
      });

      const priorArtDescription = await Promise.all(priorArtPromises);

      await ApplicationDocuments.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            updatedAt: new Date(),
            priorArtDescription,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      const updatedApplication = await ApplicationDetails.findOneAndUpdate(
        {
          applicationId,
          user: user.userId,
        },
        {
          $set: {
            isPriorArtDescriptionExists: true,
          },
        },
        {
          new: true,
        }
      );

      const getApplicationWithDockets = async () => {
        const dockets = await Dockets.find({
          applicationId,
          user: user.userId,
        }).sort({ updatedAt: -1 });

        const applicationObj = updatedApplication.toObject();
        applicationObj.dockets = dockets.map((docket) => docket.toObject());
        return applicationObj;
      };

      const applicationWithDockets = await getApplicationWithDockets();

      res.status(200).json({
        status: "success",
        message: `Successfully fetched prior art description`,
        data: applicationWithDockets,
      });
    } catch (error) {
      if (
        error.message.includes(
          "No patent text retrieved from API or description link"
        ) ||
        error.message.includes("Error fetching patent information")
      ) {
        if (enviroment === "development") {
          console.error(error);
        }
        return res.status(400).json({
          status: "error",
          message: "Failed to fetch prior art description",
        });
      } else {
        next(error);
      }
    }
  }
);

export default router;
