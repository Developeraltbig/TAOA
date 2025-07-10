import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { post } from "../services/ApiEndpoint";
import ConfirmationModal from "./ConfirmationModal";
import { clearUserSlice } from "../store/slices/authUserSlice";
import { useEffect, useRef, useState, useCallback } from "react";
import { X, FileText, CheckCircle, Info, Loader2 } from "lucide-react";
import { clearShowState } from "../store/slices/applicationDocketsSlice";
import { updateApplication } from "../store/slices/latestApplicationsSlice";

import "../styles/LatestClaimModal.css";

const LatestClaimsModal = ({
  token,
  isOpen,
  onClose,
  claims = [],
  applicationId,
  finalizationStatus,
}) => {
  const dispatch = useDispatch();
  const textareaRefs = useRef({});
  const enviroment = import.meta.env.VITE_ENV;
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [currentClaims, setCurrentClaims] = useState([]);
  const [originalClaims, setOriginalClaims] = useState([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);

  const handleOpenConfirmationModal = () => setIsConfirmationModalOpen(true);
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  const handleCloseConfirmationModalOpen = () =>
    setIsCloseConfirmationOpen(true);
  const handleCloseConfirmationModalClose = () => {
    setIsCloseConfirmationOpen(false);
  };

  const adjustTextareaHeights = useCallback(() => {
    Object.keys(textareaRefs.current).forEach((key) => {
      const textarea = textareaRefs.current[key];
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + 10 + "px";
      }
    });
  }, []);

  useEffect(() => {
    const claimsContent = claims.map((claim) => {
      const parts = claim.split(". ");
      return parts.slice(1).join(". ");
    });
    setCurrentClaims(claimsContent);
    setOriginalClaims(claimsContent);
  }, [claims]);

  useEffect(() => {
    const hasAnyChanges = currentClaims.some(
      (claim, index) => claim !== originalClaims[index]
    );
    setHasChanges(hasAnyChanges);
  }, [currentClaims, originalClaims]);

  useEffect(() => {
    if (isVisible && currentClaims.length > 0) {
      setTimeout(adjustTextareaHeights, 50);
    }
  }, [currentClaims, isVisible, adjustTextareaHeights]);

  const handleConfirmation = async () => {
    handleCloseConfirmationModal();
    await saveChanges();
  };

  const handleCloseConfirmation = async () => {
    handleCloseConfirmationModalClose();
    onClose();
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);
      const fullClaims = currentClaims.map((content, index) => {
        const originalClaim = claims[index];
        const claimNumber = originalClaim.split(". ")[0];
        return `${claimNumber}. ${content}`;
      });

      const response = await post("/application/updateClaims", {
        token,
        applicationId,
        claims: fullClaims,
      });
      dispatch(updateApplication(response.data.data));
      toast.success("Claims updated successfully");
      onClose();
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = async () => {
    if (
      finalizationStatus &&
      Object.keys(finalizationStatus.rejections).length
    ) {
      handleOpenConfirmationModal();
    } else {
      await saveChanges();
    }
  };

  const handleClaimContentChange = (index, value) => {
    const updatedClaims = [...currentClaims];
    updatedClaims[index] = value;
    setCurrentClaims(updatedClaims);

    const textarea = textareaRefs.current[index];
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + 10 + "px";
    }
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    if (hasChanges) {
      handleCloseConfirmationModalOpen();
      return;
    }

    onClose();
  };

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
      setTimeout(() => {
        setIsRendering(false);
        setHasChanges(false);
      }, 300);
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

  if (!isRendering) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onClick={handleClose}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex-shrink-0">
            <div className="flex justify-between items-center p-6 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Latest Claims
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {claims.length} claim{claims.length !== 1 ? "s" : ""}
                  {claims.length ? " • Edit any claim below" : ""}
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
                onClick={handleClose}
                aria-label="Close"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Banner */}
            {hasChanges && (
              <div className="mx-6 mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 animate-fade-in-down">
                <Info className="text-blue-600 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    You have unsaved changes. Click the save button to update
                    your claims.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Content with scrolling */}
          <div
            className="flex-1 min-h-0 px-6 py-2 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
            }}
          >
            {claims.length > 0 ? (
              <div className="space-y-4">
                {claims.map((claim, index) => {
                  const claimNumber = claim.split(". ")[0];
                  const isChanged =
                    currentClaims[index] !== originalClaims[index];

                  return (
                    <div
                      key={index}
                      className={`group relative transition-all duration-200 ${
                        isChanged
                          ? "ring-2 ring-blue-400 ring-offset-2 rounded-xl animate-ring-pulse"
                          : ""
                      }`}
                    >
                      <div
                        className={`relative p-5 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 ${
                          !isChanged ? "hover:shadow-md" : "shadow-md"
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Claim Number Badge */}
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${
                              isChanged
                                ? "bg-blue-500 text-white"
                                : "bg-white text-blue-700 border border-blue-200"
                            }`}
                          >
                            {claimNumber}
                          </div>

                          {/* Editable Content */}
                          <div className="flex-1">
                            <textarea
                              ref={(el) => {
                                textareaRefs.current[index] = el;
                                if (el && currentClaims[index]) {
                                  setTimeout(() => {
                                    el.style.height = "auto";
                                    el.style.height =
                                      el.scrollHeight + 10 + "px";
                                  }, 0);
                                }
                              }}
                              className={`w-full bg-white/80 backdrop-blur-sm p-4 border rounded-lg text-sm leading-relaxed resize-none transition-all duration-200 
                                  ${
                                    isChanged
                                      ? "border-blue-400 shadow-sm"
                                      : "border-gray-200 hover:border-gray-300 focus:border-blue-400"
                                  } focus:outline-none focus:ring-2 focus:ring-blue-400/20`}
                              value={currentClaims[index] || ""}
                              onChange={(e) =>
                                handleClaimContentChange(index, e.target.value)
                              }
                              placeholder="Enter claim content..."
                              disabled={isSaving}
                            />

                            {/* Status Badges */}
                            <div className="flex items-center gap-2 mt-3">
                              {isChanged && (
                                <span className="inline-block text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full animate-slide-in-left">
                                  Modified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-center text-lg">
                  No claims available.
                </p>
              </div>
            )}
          </div>

          {/* Footer with Save Button - Enhanced visibility */}
          <div
            className={`flex-shrink-0 flex justify-between items-center p-6 pt-4 border-t border-gray-100 rounded-b-2xl ${
              hasChanges
                ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                : "bg-gray-50/50"
            }`}
          >
            <div className="text-sm text-gray-600">
              {hasChanges && (
                <div className="flex items-center gap-2 animate-fade-in-down">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-blue-600">
                    {
                      currentClaims.filter(
                        (claim, index) => claim !== originalClaims[index]
                      ).length
                    }{" "}
                    claim(s) modified
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-white text-gray-700 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
                disabled={isSaving}
              >
                Close
              </button>
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className={`relative inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium shadow-lg transition-all duration-200 animate-scale-in
                      ${
                        isSaving
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transform hover:scale-105 cursor-pointer"
                      }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isLatestOpen={isVisible}
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleConfirmation}
        title="Are you sure?"
        message="Uploading a new claim file will regenerate the office action analysis including the suggested claim amendment."
        confirmButtonText="Ok"
        cancelButtonText="Cancel"
      />

      <ConfirmationModal
        isLatestOpen={isVisible}
        isOpen={isCloseConfirmationOpen}
        onClose={handleCloseConfirmationModalClose}
        onConfirm={handleCloseConfirmation}
        title="Are you sure?"
        message="You have unsaved changes. Are you sure you want to close?"
        confirmButtonText="Close"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default LatestClaimsModal;
