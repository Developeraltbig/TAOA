import {
  X,
  Check,
  FileUp,
  FilePen,
  FileDown,
  RotateCcw,
  ChevronDown,
  CloudUpload,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import {
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
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import ReasoningSection from "../components/ReasoningSection";
import ClaimStatusModal from "../components/ClaimStatusModal";
import ConfirmationModal from "../components/ConfirmationModal";
import DraftPreviewModal from "../components/DraftPreviewModal";
import OtherRejectionsModal from "../components/OtherRejectionsModal";
import { setIsClaimStatusModalOpen } from "../store/slices/modalsSlice";
import { setLatestApplication } from "../store/slices/latestApplicationsSlice";
import ApplicationAnalyseSkeleton from "../skeletons/ApplicationAnalyseSkeleton";

import "./Application.css";

const formatDate = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getUTCDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day + 1} ${month}, ${year}`;
};

const Application = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [data, setData] = useState({});
  const enviroment = import.meta.env.VITE_ENV;
  const [newfile, setNewFile] = useState(null);
  const isRejectionLoading = useSelector(
    (state) => state.loading.isDocketsAnalysing
  );
  const latestApplications = useSelector(
    (state) => state.applications.latestApplication
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const draftState = useSelector((state) => state.draft);
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const activeApplicationId = useSelector((state) => state.user.applicationId);

  const finalizationStatus = draftState.finalizationStatus[activeApplicationId];
  const canGenerateDraft = finalizationStatus?.allFinalized;

  const currentApplicationDocuments = useSelector(
    (state) => state.user.applicationDocuments[activeApplicationId]
  );
  const isClaimsUploading =
    currentApplicationDocuments?.isSubjectClaimsUploading;
  const subjectDescriptionFailed =
    currentApplicationDocuments?.subjectDescriptionFailed;
  const subjectDescriptionFetched =
    currentApplicationDocuments?.subjectDescriptionFetched;
  const priorDescriptionFailed =
    currentApplicationDocuments?.priorArtDescriptionFailed;
  const priorDescriptionFetched =
    currentApplicationDocuments?.priorArtDescriptionFetched;
  const isSubjectDescriptionFetching =
    currentApplicationDocuments?.isSubjectDescriptionFetching;
  const authUser = useSelector((state) => state.user.authUser);
  const isPriorDescriptionFetching =
    currentApplicationDocuments?.isPriorArtDescriptionFetching;
  const showDocumentsLoading =
    currentApplicationDocuments?.showApplicationDocumentsLoading;
  const claimsUploaded = currentApplicationDocuments?.subjectClaimsUploaded;
  const claimsUploadFailed = currentApplicationDocuments?.subjectClaimsFailed;

  const [otherRejectionModal, setOtherRejectionModal] = useState({
    isOpen: false,
    rejection: null,
  });

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewFile(null);
    fileInputRef.current.value = "";
  };

  const handleConfirmation = async () => {
    const formData = new FormData();
    formData.append("file", newfile);
    formData.append("token", authUser.token);
    formData.append("applicationId", activeApplicationId);
    handleCloseModal();
    await fetchUploadAllDocuments({
      formData,
      uploadClaims: true,
      fetchSubjectDesc: !data.isSubjectDescriptionExists,
      fetchPriorArt: !data.isPriorArtDescriptionExists,
    });
    fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files?.length > 0 && !data.isSubjectClaimsExists) {
      handleFile(files[0]);
    } else if (files?.length > 0 && data.isSubjectClaimsExists) {
      handleOpenModal();
      setNewFile(files[0]);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      handleFile(files[0]);
    }
  };

  async function fetchUploadAllDocuments({
    formData,
    uploadClaims = false,
    fetchSubjectDesc = false,
    fetchPriorArt = false,
  }) {
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
          error?.response?.data?.message || `Bad request for ${operationName}.`;
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

      const latestClaimsSettled = results[0].status === "fulfilled";
      if (latestClaimsSettled && !isCollapsed) {
        setIsCollapsed(true);
      }

      if (lastFulfilledValue) {
        const updatedApplications = latestApplications.map((application) => {
          if (application.applicationId === data.applicationId) {
            return lastFulfilledValue;
          }
          return application;
        });
        dispatch(setLatestApplication(updatedApplications));
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
  }

  async function handleFile(file) {
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
  }

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
              let isFinalized = false;

              if (isAnalysisRejection) {
                if (rejection.analyseRejection) {
                  const result = await post(`/rejection/status`, {
                    token: authUser.token,
                    rejectionId: rejection._id,
                  });
                  isFinalized = result.data.data;
                  rejectionStatuses[rejection._id] = { isFinalized };
                }
              } else {
                const result = await post(`/rejection/other/fetch`, {
                  token: authUser.token,
                  rejectionId: rejection._id,
                  applicationId: activeApplicationId,
                });
                isFinalized = result.data.data?.status === "finalized";
                rejectionStatuses[rejection._id] = { isFinalized };
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
    if (!canGenerateDraft) {
      return toast.error(
        "Please finalize all rejections before generating draft"
      );
    }

    try {
      dispatch(setIsGenerating(true));
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/draft/generate`,
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
    if (!canGenerateDraft) {
      return toast.error(
        "Please finalize all rejections before generating draft"
      );
    }
    setShowDraftPreview(true);
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
    if (activeApplicationId) {
      fetchApplication();
    }
  }, [latestApplications, activeApplicationId]);

  if ((!isLatestApplicationLoading && data === null) || !activeApplicationId) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <div className="flex flex-col gap-6 px-4 sm:px-8 md:px-12 lg:px-16 pt-16 pb-10 transition-all duration-300 ease-in min-w-0">
        <header className="text-[calc(1rem+0.9vw)] font-[700]">
          <h2>
            Hello,{" "}
            <span className="text-[#38b6ff] font-bold">
              {authUser.name.split(" ")[0]}
            </span>
          </h2>
          <h5>Thinking about analyzing Office Actions</h5>
          <h5>(Examination Reports/Search Report) today?</h5>
        </header>

        {isLatestApplicationLoading && data !== null ? (
          <ApplicationAnalyseSkeleton />
        ) : (
          <>
            {data && (
              <>
                <section className="bg-gradient-to-br from-indigo-100 to-transparent rounded-xl px-6 py-6 sm:px-8 sm:py-8 h-fit shadow-lg flex flex-col gap-3 max-[425px]:px-2 max-[375px]:px-1">
                  <h2 className="font-[600] text-[1.25rem]">
                    Project - {data?.applicationNumber}
                  </h2>
                  <div className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl shadow-lg w-full border border-gray-300">
                    <div className="grid grid-cols-1 border-b border-gray-300 p-5">
                      <h4 className="font-bold text-lg text-gray-600">
                        Invention Title
                      </h4>
                      <span className="text-[0.9rem] text-[#333] font-[500]">
                        {data?.applicationDetails?.inventionTitle}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 border-b border-gray-300 p-5 min-[850px]:hidden">
                      <h4 className="font-bold text-lg text-gray-600">
                        Publication Number
                      </h4>
                      <div className="text-[0.9rem] text-[#333] font-[500] flex items-center gap-2">
                        <span>{data?.publicationNumber}</span>
                        <a
                          href={`https://patents.google.com/patent/${data?.publicationNumber}/en`}
                          target="_blank"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>

                    <div className="grid max-[850px]:grid-cols-2 grid-cols-3">
                      <div className="border-r border-gray-300 p-5 max-[850px]:hidden">
                        <h4 className="font-bold text-lg text-gray-600">
                          Publication Number
                        </h4>
                        <div className="text-[0.9rem] text-[#333] font-[500] flex items-center gap-2">
                          <span>{data?.publicationNumber}</span>
                          <a
                            href={`https://patents.google.com/patent/${data?.publicationNumber}/en`}
                            target="_blank"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>

                      <div className="border-r border-gray-300 p-5">
                        <h4 className="font-bold text-lg text-gray-600">
                          Filing Date
                        </h4>
                        <span className="text-[0.9rem] text-[#333] font-[500]">
                          {formatDate(data?.applicationDetails?.lastFilingDate)}
                        </span>
                      </div>

                      <div className="p-5">
                        <h4 className="font-bold text-lg text-gray-600">
                          Claim Status
                        </h4>
                        <button
                          className="text-[0.9rem] text-blue-600 font-[500] hover:underline cursor-pointer"
                          onClick={() =>
                            dispatch(setIsClaimStatusModalOpen(true))
                          }
                        >
                          Check Claim Status
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {data.isFirstRejection ? (
                  <div className="upload-claims-container collapsed cursor-auto">
                    <div className="upload-header">
                      <div className="upload-title">
                        <div className="upload-icon">
                          <FileUp />
                        </div>
                        <div>
                          <h3>Relevant Documents</h3>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-content">
                      <div className="status-track">
                        {/* Subject Claims Loader */}
                        <div
                          className={`status-item ${
                            claimsUploadFailed
                              ? "failed"
                              : claimsUploaded || data.isSubjectClaimsExists
                              ? "success"
                              : "processing"
                          }`}
                        >
                          <div className="status-circle">
                            {isClaimsUploading && (
                              <div className="spinner"></div>
                            )}
                            {(claimsUploaded || data.isSubjectClaimsExists) && (
                              <div className="status-icon">
                                <Check />
                              </div>
                            )}
                            {claimsUploadFailed && (
                              <div className="error-icon">
                                <X />
                              </div>
                            )}
                          </div>
                          <div className="status-info">
                            <p className="status-name">Latest Claims</p>
                            <p className="status-file">
                              {claimsUploadFailed
                                ? "Error while fetching claims"
                                : claimsUploaded || data.isSubjectClaimsExists
                                ? "Fetched from USPTO"
                                : "Fetching from USPTO"}
                            </p>
                          </div>
                          {claimsUploadFailed && (
                            <button
                              className="action-btn retry-btn"
                              onClick={async (e) =>
                                await fetchUploadAllDocuments({
                                  fetchSubjectDesc: true,
                                })
                              }
                              title="Retry"
                            >
                              <RotateCcw />
                            </button>
                          )}
                        </div>
                        {/* Subject Description Loader */}
                        <div
                          className={`status-item ${
                            subjectDescriptionFailed
                              ? "failed"
                              : subjectDescriptionFetched ||
                                data.isSubjectDescriptionExists
                              ? "success"
                              : "processing"
                          }`}
                        >
                          <div className="status-circle">
                            {isSubjectDescriptionFetching && (
                              <div className="spinner"></div>
                            )}
                            {(subjectDescriptionFetched ||
                              data.isSubjectDescriptionExists) && (
                              <div className="status-icon">
                                <Check />
                              </div>
                            )}
                            {subjectDescriptionFailed && (
                              <div className="error-icon">
                                <X />
                              </div>
                            )}
                          </div>
                          <div className="status-info">
                            <p className="status-name">
                              Application Description
                            </p>
                            <p className="status-file">
                              {subjectDescriptionFailed
                                ? "Error while fetching description"
                                : subjectDescriptionFetched ||
                                  data.isSubjectDescriptionExists
                                ? "Fetched from USPTO"
                                : "Fetching from USPTO"}
                            </p>
                          </div>
                          {subjectDescriptionFailed && (
                            <button
                              className="action-btn retry-btn"
                              onClick={async (e) =>
                                await fetchUploadAllDocuments({
                                  fetchSubjectDesc: true,
                                })
                              }
                              title="Retry"
                            >
                              <RotateCcw />
                            </button>
                          )}
                        </div>
                        {/* Prior Art Description Loader */}
                        <div
                          className={`status-item ${
                            priorDescriptionFailed
                              ? "failed"
                              : priorDescriptionFetched ||
                                data.isPriorArtDescriptionExists
                              ? "success"
                              : "processing"
                          }`}
                        >
                          <div className="status-circle">
                            {isPriorDescriptionFetching && (
                              <div className="spinner"></div>
                            )}
                            {(priorDescriptionFetched ||
                              data.isPriorArtDescriptionExists) && (
                              <div className="status-icon">
                                <Check />
                              </div>
                            )}
                            {priorDescriptionFailed && (
                              <div className="error-icon">
                                <X />
                              </div>
                            )}
                          </div>
                          <div className="status-info">
                            <p className="status-name">Prior Art Description</p>
                            <p className="status-file">
                              {priorDescriptionFailed
                                ? "Error while fetching description"
                                : priorDescriptionFetched ||
                                  data.isPriorArtDescriptionExists
                                ? "Fetched from USPTO"
                                : "Fetching from USPTO"}
                            </p>
                          </div>
                          {priorDescriptionFailed && (
                            <button
                              className="action-btn retry-btn"
                              onClick={async (e) =>
                                await fetchUploadAllDocuments({
                                  fetchPriorArt: true,
                                })
                              }
                              title="Retry"
                            >
                              <RotateCcw />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`upload-claims-container ${
                      isCollapsed ? "collapsed" : ""
                    }`}
                    id="uploadContainer"
                  >
                    <div className="upload-header" onClick={toggleCollapse}>
                      <div className="upload-title">
                        <div className="upload-icon">
                          <FileUp />
                        </div>
                        <div>
                          <h3>
                            {data.isSubjectClaimsExists
                              ? "Relevant Documents"
                              : "Upload Latest Claims"}
                          </h3>
                          {!data.isSubjectClaimsExists && (
                            <p className="upload-subtitle">
                              Critical step: Update claims before running
                              analysis
                            </p>
                          )}
                        </div>
                      </div>
                      {!data.isSubjectClaimsExists && (
                        <div className="collapsed-indicator">
                          Click to upload
                        </div>
                      )}
                      <div className="expand-arrow">
                        <ChevronDown />
                      </div>
                    </div>

                    <div className="upload-content-wrapper">
                      <div
                        className={`upload-area ${
                          isDragging ? "drag-over" : ""
                        }`}
                        id="uploadArea"
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        <input
                          type="file"
                          id="fileInput"
                          className="upload-input"
                          accept=".pdf,.doc,.docx"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        <div className="upload-content">
                          <div className="upload-cloud-icon">
                            <CloudUpload size={54} />
                          </div>
                          <div className="upload-text">
                            Drop your updated claims file here
                          </div>
                          <div className="upload-subtext">
                            or click to browse • PDF, DOC, DOCX (max 10MB)
                          </div>
                          <button className="upload-button">
                            Select Claims File
                          </button>
                        </div>
                      </div>
                    </div>

                    {(showDocumentsLoading ||
                      data.isPriorArtDescriptionExists ||
                      data.isSubjectClaimsExists ||
                      data.isSubjectDescriptionExists) && (
                      <div className="dropdown-content">
                        <div className="status-track">
                          {/* Subject Claims Loader */}
                          <div
                            className={`status-item ${
                              isClaimsUploading
                                ? "processing"
                                : claimsUploaded || data.isSubjectClaimsExists
                                ? "success"
                                : (claimsUploadFailed ||
                                    !data.isSubjectClaimsExists) &&
                                  "failed"
                            }`}
                          >
                            <div className="status-circle">
                              {isClaimsUploading ? (
                                <div className="spinner"></div>
                              ) : claimsUploaded ||
                                data.isSubjectClaimsExists ? (
                                <div className="status-icon">
                                  <Check />
                                </div>
                              ) : (
                                (claimsUploadFailed ||
                                  !data.isSubjectClaimsExists) && (
                                  <div className="error-icon">
                                    <X />
                                  </div>
                                )
                              )}
                            </div>
                            <div className="status-info">
                              <p className="status-name">Latest Claims</p>
                              <p className="status-file">
                                {isClaimsUploading
                                  ? "Processing"
                                  : claimsUploaded || data.isSubjectClaimsExists
                                  ? ""
                                  : (claimsUploadFailed ||
                                      !data.isSubjectClaimsExists) &&
                                    "Error while uploading"}
                              </p>
                            </div>
                            {isClaimsUploading ? (
                              <></>
                            ) : claimsUploaded || data.isSubjectClaimsExists ? (
                              <button
                                className="action-btn change-btn"
                                onClick={(e) => setIsCollapsed(false)}
                                title="Change document"
                              >
                                <FilePen />
                              </button>
                            ) : (
                              (claimsUploadFailed ||
                                data.isSubjectClaimsExists) && (
                                <button
                                  className="action-btn retry-btn"
                                  onClick={(e) => setIsCollapsed(false)}
                                  title="Retry"
                                >
                                  <RotateCcw />
                                </button>
                              )
                            )}
                          </div>
                          {/* Subject Description Loader */}
                          <div
                            className={`status-item ${
                              isSubjectDescriptionFetching
                                ? "processing"
                                : subjectDescriptionFetched ||
                                  data.isSubjectDescriptionExists
                                ? "success"
                                : subjectDescriptionFailed ||
                                  (!data.isSubjectDescriptionExists && "failed")
                            }`}
                          >
                            <div className="status-circle">
                              {isSubjectDescriptionFetching ? (
                                <div className="spinner"></div>
                              ) : subjectDescriptionFetched ||
                                data.isSubjectDescriptionExists ? (
                                <div className="status-icon">
                                  <Check />
                                </div>
                              ) : (
                                (subjectDescriptionFailed ||
                                  data.isSubjectDescriptionExists) && (
                                  <div className="error-icon">
                                    <X />
                                  </div>
                                )
                              )}
                            </div>
                            <div className="status-info">
                              <p className="status-name">
                                Application Description
                              </p>
                              <p className="status-file">
                                {isSubjectDescriptionFetching
                                  ? "Fetching from USPTO"
                                  : subjectDescriptionFetched ||
                                    data.isSubjectDescriptionExists
                                  ? "Fetched from USPTO"
                                  : (subjectDescriptionFailed ||
                                      !data.isSubjectDescriptionExists) &&
                                    "Error while fetching description"}
                              </p>
                            </div>
                            {isSubjectDescriptionFetching ? (
                              <></>
                            ) : (
                              (subjectDescriptionFailed ||
                                !data.isSubjectDescriptionExists) && (
                                <button
                                  className="action-btn retry-btn"
                                  onClick={async (e) =>
                                    await fetchUploadAllDocuments({
                                      fetchSubjectDesc: true,
                                    })
                                  }
                                  title="Retry"
                                >
                                  <RotateCcw />
                                </button>
                              )
                            )}
                          </div>
                          {/* Prior Art Description Loader */}
                          <div
                            className={`status-item ${
                              isPriorDescriptionFetching
                                ? "processing"
                                : priorDescriptionFetched ||
                                  data.isPriorArtDescriptionExists
                                ? "success"
                                : (priorDescriptionFailed ||
                                    !data.isPriorArtDescriptionExists) &&
                                  "failed"
                            }`}
                          >
                            <div className="status-circle">
                              {isPriorDescriptionFetching ? (
                                <div className="spinner"></div>
                              ) : priorDescriptionFetched ||
                                data.isPriorArtDescriptionExists ? (
                                <div className="status-icon">
                                  <Check />
                                </div>
                              ) : (
                                (priorDescriptionFailed ||
                                  !data.isPriorArtDescriptionExists) && (
                                  <div className="error-icon">
                                    <X />
                                  </div>
                                )
                              )}
                            </div>
                            <div className="status-info">
                              <p className="status-name">
                                Prior Art Description
                              </p>
                              <p className="status-file">
                                {isPriorDescriptionFetching
                                  ? "Fetching from USPTO"
                                  : priorDescriptionFetched ||
                                    data.isPriorArtDescriptionExists
                                  ? "Fetched from USPTO"
                                  : (priorDescriptionFailed ||
                                      !data.isPriorArtDescriptionExists) &&
                                    "Error while fetching description"}
                              </p>
                            </div>
                            {isPriorDescriptionFetching ? (
                              <></>
                            ) : (
                              (priorDescriptionFailed ||
                                !data.isPriorArtDescriptionExists) && (
                                <button
                                  className="action-btn retry-btn"
                                  onClick={async (e) =>
                                    await fetchUploadAllDocuments({
                                      fetchPriorArt: true,
                                    })
                                  }
                                  title="Retry"
                                >
                                  <RotateCcw />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {data?.rejections?.length > 0 &&
              data?.rejections.map((rejection, idx) => {
                return (
                  <section
                    key={idx}
                    className="bg-gradient-to-l from-[#e6eefa] to-[#f0faf4] rounded-xl px-6 py-6 sm:px-8 sm:py-8 h-fit shadow-lg flex flex-col gap-6 max-[425px]:px-2 max-[375px]:px-1"
                  >
                    <h2 id="law-heading" className="font-[500] text-[1.25rem]">
                      {rejection.rejectionType.split(",")[0]}
                    </h2>
                    {rejection.claimsRejected.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <span className="font-bold text-gray-600 text-lg">
                          Claims Rejected:
                        </span>
                        <div className="w-full flex flex-wrap gap-3">
                          {rejection.claimsRejected.map((claimNo, index) => {
                            return (
                              <div
                                key={index}
                                className="border border-black size-9 rounded-full font-bold flex items-center justify-center bg-gray-200"
                              >
                                {claimNo}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {rejection.priorArtReferences.length > 0 && (
                      <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {rejection.priorArtReferences.map(
                          (priorReference, index) => {
                            return (
                              <div
                                key={index}
                                className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-6 py-4 shadow-lg flex flex-col gap-4 border border-gray-300"
                              >
                                <span className="font-semibold">
                                  Prior Art - {priorReference.citedPubNo}
                                </span>
                                <div className="bg-gray-200 px-4 py-2 rounded-md">
                                  {priorReference.citedPubURL === "#" ? (
                                    <span className="text-[#38b6ff] break-words">
                                      {priorReference.citedPubURL}
                                    </span>
                                  ) : (
                                    <a
                                      href={priorReference.citedPubURL}
                                      target="_blank"
                                      className="text-[#38b6ff] break-words"
                                    >
                                      {priorReference.citedPubURL}
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                    {rejection.examinerReasoning && (
                      <ReasoningSection
                        examinerReasoning={rejection.examinerReasoning}
                      />
                    )}
                    {rejection?.analyseRejection ? (
                      <>
                        {data?.dockets?.some(
                          (docket) => docket.rejectionId === rejection._id
                        ) ? (
                          <div className="w-full flex items-center justify-end">
                            <button
                              type="button"
                              className="h-12 py-2 px-4 rounded-md cursor-pointer bg-[#0284c7] hover:bg-[#026395] font-semibold flex gap-2 justify-center items-center text-white shadow-md"
                              onClick={(e) => {
                                const docket = data.dockets.find(
                                  (d) => d.rejectionId === rejection._id
                                );
                                handleViewAnalysisClick(e, docket);
                              }}
                              disabled={
                                Object.keys(isRejectionLoading).length > 0 ||
                                isClaimsUploading ||
                                isPriorDescriptionFetching ||
                                isSubjectDescriptionFetching
                              }
                            >
                              <span>View Analysis</span>
                              <i className="fa-solid fa-paper-plane"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-end">
                            <button
                              type="button"
                              className="h-12 py-2 px-4 rounded-md cursor-pointer bg-[#0284c7] hover:bg-[#026395] font-semibold flex gap-2 justify-center items-center text-white shadow-md"
                              onClick={(e) =>
                                handleBeginAnalysisClick(
                                  e,
                                  rejection,
                                  data.applicationId,
                                  data.publicationNumber,
                                  data.isFirstRejection
                                )
                              }
                              disabled={
                                Object.keys(isRejectionLoading).length > 0 ||
                                !data.isSubjectDescriptionExists ||
                                !data.isSubjectClaimsExists ||
                                !data.isPriorArtDescriptionExists ||
                                isClaimsUploading ||
                                isPriorDescriptionFetching ||
                                isSubjectDescriptionFetching
                              }
                            >
                              {isRejectionLoading[rejection._id]?.loading ? (
                                <>
                                  <div className="w-6 h-6 border-4 border-t-blue-600 border-gray-50 rounded-full animate-spin"></div>
                                  <span>Analysing...</span>
                                </>
                              ) : (
                                <>
                                  <span>Begin Analysis</span>
                                  <i className="fa-solid fa-paper-plane"></i>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      !(
                        rejection.rejectionType.includes("102") ||
                        rejection.rejectionType.includes("103")
                      ) && (
                        <div className="w-full flex items-center justify-end">
                          <button
                            type="button"
                            className="h-12 py-2 px-4 rounded-md cursor-pointer bg-[#0284c7] hover:bg-[#026395] font-semibold flex gap-2 justify-center items-center text-white shadow-md"
                            onClick={() => handleOtherRejectionClick(rejection)}
                            disabled={
                              !data.isSubjectDescriptionExists ||
                              !data.isSubjectClaimsExists ||
                              !data.isPriorArtDescriptionExists ||
                              isClaimsUploading ||
                              isPriorDescriptionFetching ||
                              isSubjectDescriptionFetching
                            }
                          >
                            <span>Review</span>
                            <i className="fa-solid fa-comment-dots"></i>
                          </button>
                        </div>
                      )
                    )}
                  </section>
                );
              })}
          </>
        )}
        {data && data.rejections?.length > 0 && (
          <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl px-6 py-6 sm:px-8 sm:py-8 h-fit shadow-lg flex flex-col gap-4 max-[425px]:px-2 max-[375px]:px-1 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-xl text-gray-800">
                  Office Action Response
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {finalizationStatus?.allFinalized
                    ? "All rejections have been addressed. Ready to generate response."
                    : `${
                        Object.values(
                          finalizationStatus?.rejections || {}
                        ).filter((r) => r.isFinalized).length
                      } of ${data.rejections.length} rejections finalized`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {data.rejections.map((rejection, idx) => {
                    const status =
                      finalizationStatus?.rejections[rejection._id];
                    return (
                      <div
                        key={idx}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          status?.isFinalized
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                        title={`${rejection.rejectionType} - ${
                          status?.isFinalized ? "Finalized" : "Pending"
                        }`}
                      >
                        {status?.isFinalized ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          idx + 1
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className={`px-6 py-3 rounded-lg font-semibold flex gap-2 items-center shadow-md transition-all duration-200 ${
                  canGenerateDraft
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                onClick={handleShowDraftPreview}
                disabled={
                  !canGenerateDraft ||
                  draftState.isGenerating ||
                  !data.isSubjectDescriptionExists ||
                  !data.isSubjectClaimsExists ||
                  !data.isPriorArtDescriptionExists ||
                  isClaimsUploading ||
                  isPriorDescriptionFetching ||
                  isSubjectDescriptionFetching
                }
              >
                {draftState.isGenerating ? (
                  <>
                    <div className="w-6 h-6 border-4 border-t-green-800 border-white rounded-full animate-spin"></div>
                    <span>Generating Draft...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={20} />
                    <span>Generate Draft Response</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      <ClaimStatusModal claimStatus={data?.claimStatus} />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmation}
        title="Are you sure?"
        message="Uploading a new claim file will regenerate the office action analysis including the suggested claim amendment."
        confirmButtonText="Ok"
        cancelButtonText="Cancel"
      />
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
    </>
  );
};

export default Application;
