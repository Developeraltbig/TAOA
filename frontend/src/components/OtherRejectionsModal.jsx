import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { setFlag } from "../store/slices/draftSlice";
import { useSelector, useDispatch } from "react-redux";
import { X, Save, AlertCircle, RefreshCw } from "lucide-react";
import OtherRejectionReasoningSection from "./OtherRejectionReasoningSection";

const OtherRejectionsModal = ({
  isOpen,
  onClose,
  rejection,
  applicationId,
}) => {
  const dispatch = useDispatch();
  const [data, setData] = useState({});
  const enviroment = import.meta.env.VITE_ENV;
  const [response, setResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isFinalising, setIsFinalising] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const authUser = useSelector((state) => state.user.authUser);

  const rejectionGuidance = {
    101: {
      title: "§101 - Patent Eligibility",
      guidance:
        "Address abstract ideas, natural phenomena, or laws of nature. Focus on:",
      points: [
        "Technical improvement to computer functionality",
        "Practical application of the abstract idea",
        "Inventive concept beyond the abstract idea",
        "Specific technological solution to technological problem",
      ],
    },
    112: {
      title: "§112 - Specification",
      guidance:
        "Address written description, enablement, or definiteness issues:",
      points: [
        "Point to specific support in the specification",
        "Clarify claim language if indefinite",
        "Show possession of claimed invention",
        "Demonstrate enablement without undue experimentation",
      ],
    },
    121: {
      title: "§121 - Restriction Requirement",
      guidance: "Respond to restriction/election requirement:",
      points: [
        "Elect claims for examination",
        "Traverse the restriction if appropriate",
        "Reserve right to file divisional applications",
        "Identify any linking claims",
      ],
    },
    double_patenting: {
      title: "Double Patenting",
      guidance: "Address double patenting rejection:",
      points: [
        "File terminal disclaimer if appropriate",
        "Argue patentable distinction",
        "Show different inventive entities",
        "Demonstrate no common ownership",
      ],
    },
  };

  const getRejectionType = () => {
    if (!rejection) return null;
    if (rejection.rejectionType.includes("101")) return "101";
    if (rejection.rejectionType.includes("112")) return "112";
    if (rejection.rejectionType.includes("121")) return "121";
    if (rejection.rejectionType.toLowerCase().includes("double patenting"))
      return "double_patenting";
    return "other";
  };

  const currentGuidance = rejectionGuidance[getRejectionType()] || {
    title: "Other Rejection",
    guidance: "Address the specific issues raised by the examiner:",
    points: [
      "Carefully review the examiner's reasoning",
      "Provide clear arguments addressing each point",
      "Cite relevant case law or MPEP sections",
      "Consider claim amendments if necessary",
    ],
  };

  const handleBackdropClick = (e) => {
    if (
      e.target === e.currentTarget &&
      !isSaving &&
      !isFetching &&
      !isGenerating
    ) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!response.trim()) {
      return toast.error("Please provide at least a response");
    }

    try {
      setIsSaving(true);
      const result = await post("/rejection/other/save", {
        token: authUser.token,
        rejectionId: rejection._id,
        applicationId,
        response,
      });
      setData(result.data.data);
      setResponse(result.data.data.response);
      toast.success("Response saved successfully");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to save response");
      }
    } finally {
      setIsSaving(false);
      dispatch(setFlag());
    }
  };

  const fetchResponse = async () => {
    try {
      setIsFetching(true);
      const result = await post(`/rejection/other/fetch`, {
        token: authUser.token,
        rejectionId: rejection._id,
        applicationId,
      });
      if (result.data.data) {
        setData(result.data.data);
        setResponse(result.data.data.response);
      }
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to fetch response! Please try again.");
      }
    } finally {
      setIsFetching(false);
      setIsFetched(true);
    }
  };

  const generateResponse = async () => {
    try {
      setIsGenerating(true);
      const result = await post("/rejection/other/generate", {
        token: authUser.token,
        rejectionId: rejection._id,
        applicationId,
        rejection,
      });
      setData(result.data.data);
      setResponse(result.data.data.response);
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to generate response! Please try again.");
      }
    } finally {
      setIsGenerating(false);
      dispatch(setFlag());
    }
  };

  const handleFinalize = async () => {
    try {
      setIsFinalising(true);
      const result = await post(`/rejection/other/finalize`, {
        token: authUser.token,
        rejectionId: rejection._id,
        applicationId,
      });
      setData(result.data.data);
      setResponse(result.data.data.response);
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to finalize response! Please try again.");
      }
    } finally {
      setIsFinalising(false);
      dispatch(setFlag());
    }
  };

  useEffect(() => {
    if (isFetched && !response) {
      generateResponse();
    }
  }, [isFetched]);

  useEffect(() => {
    if (isOpen) {
      fetchResponse();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsRendering(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      setTimeout(() => setIsRendering(false), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isVisible) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isVisible]);

  useEffect(() => {
    let toastId = null;

    if (isGenerating) {
      toastId = toast.info(
        "Generating response. This process may take sometime...",
        {
          autoClose: false,
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: false,
          theme: "light",
        }
      );
    }

    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [isGenerating]);

  if (!isRendering || !rejection) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <section
        className={`
          relative bg-white shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto
          transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-bold text-2xl text-gray-800 mb-2">
              {currentGuidance.title}
            </h2>
            <p className="text-gray-600 text-sm">
              Claims Rejected: {rejection.claimsRejected.join(", ")}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving || isFetching || isFinalising || isGenerating}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Guidance Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-blue-900 font-medium mb-2">
                {currentGuidance.guidance}
              </p>
              <ul className="list-disc list-inside space-y-1">
                {currentGuidance.points.map((point, index) => (
                  <li key={index} className="text-blue-800 text-sm">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Examiner Reasoning */}
        {rejection.examinerReasoning && (
          <OtherRejectionReasoningSection
            examinerReasoning={rejection.examinerReasoning}
          />
        )}

        {/* Response Section */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center pb-2">
              <label className="block text-gray-700 font-semibold">
                AI Generated Response
              </label>
              <button
                onClick={generateResponse}
                disabled={isSaving || isFetching || isGenerating}
                className="px-4 py-2 text-blue-600 bg-blue-50 cursor-pointer hover:bg-blue-100 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Generate new response"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RefreshCw size={20} />
                )}
                <span>{isGenerating ? "Generating..." : "Generate"}</span>
              </button>
            </div>
            {isGenerating ? (
              <div className="w-full h-32 px-4 py-3 border flex items-center justify-center border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3586cb] focus:border-transparent resize-none break-words">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3586cb] focus:border-transparent resize-none break-words"
                disabled={isSaving || isFetching || isFinalising}
                placeholder={isFetching ? "Fetching Response" : ""}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isSaving || isFetching || isFinalising || isGenerating}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              isSaving ||
              !response.trim() ||
              response.trim() === data?.response ||
              isFetching ||
              isFinalising ||
              isGenerating
            }
            className="px-6 py-2.5 bg-[#3586cb] hover:bg-[#2b6faa] text-white cursor-pointer rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Response</span>
              </>
            )}
          </button>
          <button
            onClick={handleFinalize}
            disabled={
              isSaving ||
              isFetching ||
              isFinalising ||
              data?.status === "finalized" ||
              isGenerating
            }
            className="px-6 py-2.5 bg-[#3586cb] hover:bg-[#2b6faa] text-white cursor-pointer rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFinalising ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Finalizing...</span>
              </>
            ) : data?.status === "finalized" ? (
              <>
                <span>Finalized</span>
              </>
            ) : (
              <>
                <span>Finalize</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default OtherRejectionsModal;
