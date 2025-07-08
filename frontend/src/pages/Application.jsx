import axios from "axios";
import {
  setFlag,
  setIsGenerating,
  updateFinalizationStatus,
} from "../store/slices/draftSlice";
import {
  setIsDocketsAnalysing,
  clearIsDocketsAnalysing,
} from "../store/slices/loadingSlice";
import {
  setDocketId,
  setPriorArt,
  clearUserSlice,
  setSubjectClaims,
  setApplicationId,
  setSubjectDescription,
  setApplicationDocuments,
} from "../store/slices/authUserSlice";
import { toast } from "react-toastify";
import { post } from "../services/ApiEndpoint";
import {
  clearShowState,
  clearDocketState,
} from "../store/slices/applicationDocketsSlice";
import {
  setLatestApplication,
  updateApplication,
  updateApplicationData,
} from "../store/slices/latestApplicationsSlice";
import { useState, useEffect, useRef } from "react";
import HelpSection from "../components/HelpSection";
import { useDispatch, useSelector } from "react-redux";
import StepIndicator from "../components/StepIndicator";
import { Navigate, useNavigate } from "react-router-dom";
import TutorialOverlay from "../components/TutorialOverlay";
import ClaimStatusModal from "../components/ClaimStatusModal";
import LatestClaimsModal from "../components/LatestClaimModal";
import DraftPreviewModal from "../components/DraftPreviewModal";
import ApplicationHeader from "../components/ApplicationHeader";
import RejectionAnalysis from "../components/RejectionAnalysis";
import ApplicationDetails from "../components/ApplicationDetails";
import DocumentCollection from "../components/DocumentCollection";
import ResponseGeneration from "../components/ResponseGeneration";
import OtherRejectionsModal from "../components/OtherRejectionsModal";
import ExaminerReasoningModal from "../components/ExaminerReasoningModal";
import ApplicationDetailsSkeleton from "../skeletons/ApplicationDetailsSkeleton";

import "../styles/animation.css";

const Application = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const documentRef = useRef(null);
  const responseRef = useRef(null);
  const rejectionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [data, setData] = useState({});
  const enviroment = import.meta.env.VITE_ENV;
  const [activeStep, setActiveStep] = useState(1);
  const [latestClaim, setLatestClaim] = useState([]);
  const [tutorialStep, setTutorialStep] = useState(0);
  const draftState = useSelector((state) => state.draft);
  const [showTutorial, setShowTutorial] = useState(false);
  const authUser = useSelector((state) => state.user.authUser);
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [expandedSection, setExpandedSection] = useState("documents");
  const [isLatestClaimFailed, setIsLatestClaimFailed] = useState(false);
  const [isLatestClaimLoading, setIsLatestClaimLoading] = useState(false);
  const activeApplicationId = useSelector((state) => state.user.applicationId);
  const finalizationStatus = draftState.finalizationStatus[activeApplicationId];
  const [isLatestClaimsModalOpen, setIsLatestClaimsModalOpen] = useState(false);
  const isRejectionLoading = useSelector(
    (state) => state.loading.isDocketsAnalysing
  );
  const latestApplications = useSelector(
    (state) => state.applications.latestApplication
  );
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const currentApplicationDocuments = useSelector(
    (state) => state.user.applicationDocuments[activeApplicationId]
  );
  const [reasoningModal, setReasoningModal] = useState({
    isOpen: false,
    content: "",
    rejectionType: "",
  });
  const allRejectionsFinalized = data?.rejections?.every(
    (r) => finalizationStatus?.rejections?.[r._id]?.isFinalized
  );
  const [otherRejectionModal, setOtherRejectionModal] = useState({
    isOpen: false,
    rejection: null,
  });
  const allDocumentsReady =
    data?.isSubjectClaimsExists &&
    data?.isSubjectDescriptionExists &&
    data?.isPriorArtDescriptionExists &&
    !(
      currentApplicationDocuments?.isSubjectClaimsUploading ||
      currentApplicationDocuments?.isPriorArtDescriptionFetching ||
      currentApplicationDocuments?.isSubjectDescriptionFetching ||
      currentApplicationDocuments?.subjectClaimsFailed ||
      currentApplicationDocuments?.subjectDescriptionFailed ||
      currentApplicationDocuments?.priorArtDescriptionFailed
    );

  const fetchUploadAllDocuments = async ({
    formData,
    uploadClaims = false,
    fetchSubjectDesc = false,
    fetchPriorArt = false,
  }) => {
    const promises = [];

    const handleError = (error, operationName) => {
      if (enviroment === "development") {
        console.error(`Error during ${operationName}:`, error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      } else if (error.status === 400) {
        const message =
          error?.response?.data?.message + ` during ${operationName}` ||
          `Bad request for ${operationName}.`;
        toast.error(message);
      } else {
        toast.error(
          `Internal server error during ${operationName}! Please try again.`
        );
      }
    };

    if (uploadClaims) {
      const uploadClaimsPromise = (async () => {
        try {
          dispatch(
            setSubjectClaims({
              applicationId: data.applicationId,
              name: "isSubjectClaimsUploading",
              value: true,
            })
          );
          dispatch(
            setSubjectClaims({
              applicationId: data.applicationId,
              name: "subjectClaimsUploaded",
              value: false,
            })
          );
          dispatch(
            setSubjectClaims({
              applicationId: data.applicationId,
              name: "subjectClaimsFailed",
              value: false,
            })
          );
          const response = await post("/application/uploadClaims", formData);
          dispatch(
            setSubjectClaims({
              applicationId: data.applicationId,
              name: "subjectClaimsUploaded",
              value: true,
            })
          );
          return {
            data: response.data.data,
            endTime: Date.now(),
          };
        } catch (error) {
          dispatch(
            setSubjectClaims({
              applicationId: data.applicationId,
              name: "subjectClaimsFailed",
              value: true,
            })
          );
          handleError(error, "Claims Upload");
          throw error;
        } finally {
          dispatch(
            setSubjectClaims({
              applicationId: data.applicationId,
              name: "isSubjectClaimsUploading",
              value: false,
            })
          );
        }
      })();
      promises.push(uploadClaimsPromise);
    }

    if (fetchSubjectDesc) {
      const fetchSubjectDescPromise = (async () => {
        try {
          dispatch(
            setSubjectDescription({
              applicationId: data.applicationId,
              name: "isSubjectDescriptionFetching",
              value: true,
            })
          );
          dispatch(
            setSubjectDescription({
              applicationId: data.applicationId,
              name: "subjectDescriptionFetched",
              value: false,
            })
          );
          dispatch(
            setSubjectDescription({
              applicationId: data.applicationId,
              name: "subjectDescriptionFailed",
              value: false,
            })
          );
          if (data.isFirstRejection) {
            dispatch(
              setSubjectClaims({
                applicationId: data.applicationId,
                name: "isSubjectClaimsUploading",
                value: true,
              })
            );
            dispatch(
              setSubjectClaims({
                applicationId: data.applicationId,
                name: "subjectClaimsUploaded",
                value: false,
              })
            );
            dispatch(
              setSubjectClaims({
                applicationId: data.applicationId,
                name: "subjectClaimsFailed",
                value: false,
              })
            );
          }
          const response = await post("/application/fetchSubjectDescription", {
            token: authUser.token,
            applicationId: activeApplicationId,
            publicationNumber: data.publicationNumber,
            isFirstRejection: data.isFirstRejection,
          });
          dispatch(
            setSubjectDescription({
              applicationId: data.applicationId,
              name: "subjectDescriptionFetched",
              value: true,
            })
          );
          if (data.isFirstRejection) {
            dispatch(
              setSubjectClaims({
                applicationId: data.applicationId,
                name: "subjectClaimsUploaded",
                value: true,
              })
            );
          }
          return {
            data: response.data.data,
            endTime: Date.now(),
          };
        } catch (error) {
          dispatch(
            setSubjectDescription({
              applicationId: data.applicationId,
              name: "subjectDescriptionFailed",
              value: true,
            })
          );
          if (data.isFirstRejection) {
            dispatch(
              setSubjectClaims({
                applicationId: data.applicationId,
                name: "subjectClaimsFailed",
                value: true,
              })
            );
          }
          handleError(error, "Subject Description Fetch");
          throw error;
        } finally {
          dispatch(
            setSubjectDescription({
              applicationId: data.applicationId,
              name: "isSubjectDescriptionFetching",
              value: false,
            })
          );
          if (data.isFirstRejection) {
            dispatch(
              setSubjectClaims({
                applicationId: data.applicationId,
                name: "isSubjectClaimsUploading",
                value: false,
              })
            );
          }
        }
      })();
      promises.push(fetchSubjectDescPromise);
    }

    if (fetchPriorArt) {
      const fetchPriorArtPromise = (async () => {
        try {
          dispatch(
            setPriorArt({
              applicationId: data.applicationId,
              name: "isPriorArtDescriptionFetching",
              value: true,
            })
          );
          dispatch(
            setPriorArt({
              applicationId: data.applicationId,
              name: "priorArtDescriptionFetched",
              value: false,
            })
          );
          dispatch(
            setPriorArt({
              applicationId: data.applicationId,
              name: "priorArtDescriptionFailed",
              value: false,
            })
          );
          const response = await post("/application/fetchPriorArtDescription", {
            token: authUser.token,
            applicationId: activeApplicationId,
          });
          dispatch(
            setPriorArt({
              applicationId: data.applicationId,
              name: "priorArtDescriptionFetched",
              value: true,
            })
          );
          return {
            data: response.data.data,
            endTime: Date.now(),
          };
        } catch (error) {
          dispatch(
            setPriorArt({
              applicationId: data.applicationId,
              name: "priorArtDescriptionFailed",
              value: true,
            })
          );
          handleError(error, "Prior Art Fetch");
          throw error;
        } finally {
          dispatch(
            setPriorArt({
              applicationId: data.applicationId,
              name: "isPriorArtDescriptionFetching",
              value: false,
            })
          );
        }
      })();
      promises.push(fetchPriorArtPromise);
    }

    if (promises.length === 0) {
      return;
    }

    try {
      const results = await Promise.allSettled(promises);
      let lastFulfilledValue = undefined;
      let latestSettlementTime = -1;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { data, endTime } = result.value;
          if (endTime > latestSettlementTime) {
            latestSettlementTime = endTime;
            lastFulfilledValue = data;
          }
        }
      });

      if (lastFulfilledValue) {
        dispatch(updateApplication(lastFulfilledValue));
      }
    } catch (error) {
      if (enviroment === "development") {
        console.error(
          "An unexpected error occurred outside individual promise handling:",
          error
        );
      }
      toast.error("An unexpected error occurred during document processing.");
    }
  };

  const handleFile = async (file) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      return toast.error("Please upload a PDF, DOC, DOCX file");
    }

    if (file.size > 10 * 1024 * 1024) {
      return toast.error("File size must be less than 10MB");
    }

    if (data.isFirstRejection) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", authUser.token);
    formData.append("applicationId", activeApplicationId);
    dispatch(
      setApplicationDocuments({
        applicationId: data.applicationId,
        showApplicationDocumentsLoading: true,
      })
    );
    await fetchUploadAllDocuments({
      formData,
      uploadClaims: true,
      fetchSubjectDesc: !data.isSubjectDescriptionExists,
      fetchPriorArt: !data.isPriorArtDescriptionExists,
    });
    fileInputRef.current.value = "";
  };

  const fetchApplication = () => {
    if (
      !isLatestApplicationLoading &&
      latestApplications.length > 0 &&
      activeApplicationId
    ) {
      const newData = latestApplications?.find(
        (application) => application.applicationId === activeApplicationId
      );
      if (newData) {
        setData(newData);
      } else {
        setData(null);
        dispatch(setApplicationId(null));
        dispatch(setDocketId(null));
        dispatch(clearShowState());
      }
    }
  };

  const handleBeginAnalysisClick = async (
    e,
    rejection,
    applicationId,
    publicationNumber
  ) => {
    e.preventDefault();
    if (
      !(
        rejection.rejectionType.includes("102") ||
        rejection.rejectionType.includes("103")
      )
    ) {
      return;
    }

    try {
      dispatch(
        setIsDocketsAnalysing({
          docketId: rejection._id,
          loading: true,
        })
      );
      const response = await post("/docket/generate", {
        token: authUser.token,
        rejection,
        applicationId,
        publicationNumber,
      });
      const updatedData = latestApplications.map((prev) => {
        if (prev.applicationId === applicationId) {
          const updatedObj = { ...prev };
          if (Array.isArray(updatedObj.dockets)) {
            updatedObj.dockets = [...updatedObj.dockets, response.data.data];
          } else {
            updatedObj.dockets = [response.data.data];
          }
          return updatedObj;
        }
        return prev;
      });
      dispatch(setLatestApplication(updatedData));
      dispatch(setDocketId(response.data.data._id));
      dispatch(setFlag());
      navigate("/technicalcomparison");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      } else if (error.status === 400) {
        const message = error?.response?.data?.message;
        toast.error(message);
      } else {
        toast.error("Internal server error! Please try again.");
      }
      dispatch(setDocketId(null));
    } finally {
      dispatch(clearIsDocketsAnalysing());
    }
  };

  const handleViewAnalysisClick = (e, docket) => {
    e.preventDefault();
    dispatch(setDocketId(docket._id));
    navigate("/technicalcomparison");
  };

  const handleOtherRejectionClick = (rejection) => {
    setOtherRejectionModal({
      isOpen: true,
      rejection,
    });
  };

  const checkFinalizationStatus = async () => {
    if (!data || !activeApplicationId) {
      return;
    }

    const rejectionStatuses = {};
    const promises = [];

    if (data.rejections) {
      data.rejections.forEach((rejection) => {
        const isAnalysisRejection =
          rejection.rejectionType.includes("102") ||
          rejection.rejectionType.includes("103");

        promises.push(
          (async () => {
            try {
              let isFinalized = null;

              if (isAnalysisRejection) {
                const result = await post(`/rejection/status`, {
                  token: authUser.token,
                  rejectionId: rejection._id,
                });
                isFinalized = result.data.data;
                if (isFinalized !== null) {
                  rejectionStatuses[rejection._id] = {
                    isFinalized: !!isFinalized.finalizedType,
                  };
                }
              } else {
                const result = await post(`/rejection/other/fetch`, {
                  token: authUser.token,
                  rejectionId: rejection._id,
                  applicationId: activeApplicationId,
                });
                isFinalized = result.data.data;
                if (isFinalized !== null) {
                  rejectionStatuses[rejection._id] = {
                    isFinalized: isFinalized?.status === "finalized",
                  };
                }
              }
            } catch (error) {
              if (error.status === 401 || error.status === 404) {
                dispatch(clearDocketState());
                dispatch(clearUserSlice());
              }
            }
          })()
        );
      });
    }

    await Promise.all(promises);

    dispatch(
      updateFinalizationStatus({
        applicationId: activeApplicationId,
        rejectionStatuses,
      })
    );
  };

  const handleGenerateDraft = async () => {
    if (!allRejectionsFinalized) {
      return toast.error(
        "Please finalize all rejections before generating draft"
      );
    }

    try {
      dispatch(setIsGenerating(true));
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || "/api"}/draft/generate`,
        {
          token: authUser.token,
          applicationId: activeApplicationId,
          applicationNumber: data.applicationNumber,
        },
        {
          responseType: "blob",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
        }
      );

      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute(
        "download",
        `Draft_Response_${data.applicationNumber}.docx`
      );
      document.body.appendChild(a);
      a.addEventListener("click", () => {
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
      });
      a.click();
      toast.success("Draft response generated successfully");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.response?.status === 401 || error.response?.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to generate draft response");
      }
    } finally {
      dispatch(setIsGenerating(false));
    }
  };

  const handleShowDraftPreview = () => {
    if (!allRejectionsFinalized) {
      return toast.error(
        "Please finalize all rejections before generating draft"
      );
    }
    setShowDraftPreview(true);
  };

  const fetchLatestClaims = async () => {
    try {
      setIsLatestClaimLoading(true);
      setIsLatestClaimFailed(false);
      const response = await post("/application/fetchLatestClaim", {
        token: authUser.token,
        applicationId: activeApplicationId,
      });
      setLatestClaim(response.data.data);
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.response?.status === 401 || error.response?.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        const message = error?.response?.data?.message;
        toast.error(message);
      }
      setIsLatestClaimFailed(true);
    } finally {
      setIsLatestClaimLoading(false);
    }
  };

  const updateTutorial = async () => {
    try {
      await post("/application/updateTutorial", {
        token: authUser.token,
        applicationId: data.applicationId,
      });
      dispatch(
        updateApplicationData({
          applicationId: data.applicationId,
          key: "viewTutorial",
          value: false,
        })
      );
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      }
    }
  };

  useEffect(() => {
    if (data && data.applicationId === activeApplicationId) {
      checkFinalizationStatus();
    }
  }, [data, draftState.flag]);

  useEffect(() => {
    async function applicationDocumentsFetch() {
      await fetchUploadAllDocuments({
        fetchPriorArt: !data.isPriorArtDescriptionExists,
        fetchSubjectDesc:
          !data.isSubjectClaimsExists || !data.isSubjectDescriptionExists,
      });
    }
    if (
      data.isFirstRejection &&
      (!data.isSubjectClaimsExists ||
        !data.isSubjectDescriptionExists ||
        !data.isPriorArtDescriptionExists)
    ) {
      applicationDocumentsFetch();
    }
  }, [data.isFirstRejection]);

  useEffect(() => {
    if (data.isSubjectClaimsExists) {
      fetchLatestClaims();
    }
  }, [data, data.isSubjectClaimsExists]);

  useEffect(() => {
    if (activeApplicationId) {
      fetchApplication();
    }
  }, [latestApplications, activeApplicationId]);

  useEffect(() => {
    if (allDocumentsReady && activeStep === 1) {
      setActiveStep(2);
      setExpandedSection("rejections");
    } else if (allRejectionsFinalized && activeStep === 2) {
      setActiveStep(3);
      setExpandedSection("response");
    }
  }, [allDocumentsReady, allRejectionsFinalized, activeStep]);

  useEffect(() => {
    if (data && Object.keys(data).length && data?.viewTutorial) {
      setExpandedSection(null);
      setShowTutorial(true);
      setTutorialStep(0);
      updateTutorial();
    }
  }, [data]);

  if ((!isLatestApplicationLoading && data === null) || !activeApplicationId) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationHeader userName={authUser.name} />
        {isLatestApplicationLoading ? (
          <ApplicationDetailsSkeleton />
        ) : (
          <>
            <ApplicationDetails data={data} />

            <StepIndicator
              activeStep={activeStep}
              allDocumentsReady={allDocumentsReady}
              allRejectionsFinalized={allRejectionsFinalized}
              documentRef={documentRef}
              rejectionRef={rejectionRef}
              responseRef={responseRef}
              setExpandedSection={setExpandedSection}
            />

            <div className="space-y-4">
              <DocumentCollection
                data={data}
                ref={documentRef}
                handleFile={handleFile}
                fileInputRef={fileInputRef}
                expandedSection={expandedSection}
                handleViewDocumentClick={(e) => {
                  e.preventDefault();
                  if (!isLatestClaimFailed && !isLatestClaimLoading) {
                    setIsLatestClaimsModalOpen(true);
                  }
                }}
                allDocumentsReady={allDocumentsReady}
                finalizationStatus={finalizationStatus}
                setExpandedSection={setExpandedSection}
                isLatestClaimFailed={isLatestClaimFailed}
                isLatestClaimLoading={isLatestClaimLoading}
                fetchUploadAllDocuments={fetchUploadAllDocuments}
                currentApplicationDocuments={currentApplicationDocuments}
              />

              <RejectionAnalysis
                data={data}
                ref={rejectionRef}
                expandedSection={expandedSection}
                setReasoningModal={setReasoningModal}
                allDocumentsReady={allDocumentsReady}
                setExpandedSection={setExpandedSection}
                finalizationStatus={finalizationStatus}
                isRejectionLoading={isRejectionLoading}
                handleBeginAnalysisClick={handleBeginAnalysisClick}
                handleViewAnalysisClick={handleViewAnalysisClick}
                handleOtherRejectionClick={handleOtherRejectionClick}
                currentApplicationDocuments={currentApplicationDocuments}
              />

              <ResponseGeneration
                data={data}
                ref={responseRef}
                draftState={draftState}
                expandedSection={expandedSection}
                rejections={data?.rejections || []}
                setExpandedSection={setExpandedSection}
                finalizationStatus={finalizationStatus}
                allRejectionsFinalized={allRejectionsFinalized}
                handleShowDraftPreview={handleShowDraftPreview}
              />
            </div>

            <HelpSection
              onTutorialClick={() => {
                setExpandedSection(null);
                setShowTutorial(true);
                setTutorialStep(0);
              }}
            />
          </>
        )}
      </main>

      <ClaimStatusModal claimStatus={data?.claimStatus} />

      <OtherRejectionsModal
        isOpen={otherRejectionModal.isOpen}
        onClose={() =>
          setOtherRejectionModal({ isOpen: false, rejection: null })
        }
        rejection={otherRejectionModal.rejection}
        applicationId={data?.applicationId}
      />

      <DraftPreviewModal
        isOpen={showDraftPreview}
        onClose={() => setShowDraftPreview(false)}
        applicationId={activeApplicationId}
        onGenerate={handleGenerateDraft}
      />

      <LatestClaimsModal
        claims={latestClaim}
        token={authUser.token}
        isOpen={isLatestClaimsModalOpen}
        applicationId={activeApplicationId}
        finalizationStatus={finalizationStatus}
        onClose={() => setIsLatestClaimsModalOpen(false)}
      />

      <ExaminerReasoningModal
        isOpen={reasoningModal.isOpen}
        onClose={() =>
          setReasoningModal({
            isOpen: false,
            content: reasoningModal?.content,
            rejectionType: reasoningModal?.rejectionType,
          })
        }
        content={reasoningModal.content}
        rejectionType={reasoningModal.rejectionType}
      />

      <TutorialOverlay
        showTutorial={showTutorial}
        tutorialStep={tutorialStep}
        setTutorialStep={setTutorialStep}
        onClose={() => {
          setShowTutorial(false);
          setTutorialStep(0);
        }}
      />
    </div>
  );
};

export default Application;
