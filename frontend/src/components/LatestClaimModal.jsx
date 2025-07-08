import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { post } from "../services/ApiEndpoint";
import { useEffect, useRef, useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import { formatTextToDelimiter } from "../helpers/formatText";
import { clearUserSlice } from "../store/slices/authUserSlice";
import { X, FileText, Edit, Save, XCircle } from "lucide-react";
import { clearShowState } from "../store/slices/applicationDocketsSlice";
import { updateApplication } from "../store/slices/latestApplicationsSlice";

const LatestClaimsModal = ({
  token,
  isOpen,
  onClose,
  claims = [],
  applicationId,
  finalizationStatus,
}) => {
  const dispatch = useDispatch();
  const textareaRef = useRef(null);
  const enviroment = import.meta.env.VITE_ENV;
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [currentClaims, setCurrentClaims] = useState(claims);
  const [editingClaimIndex, setEditingClaimIndex] = useState(null);
  const [editedClaimContent, setEditedClaimContent] = useState("");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const handleOpenConfirmationModal = () => setIsConfirmationModalOpen(true);
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  useEffect(() => {
    setCurrentClaims(claims);
  }, [claims]);

  const handleConfirmation = async () => {
    setIsConfirmationModalOpen(false);
    try {
      setIsSaving(true);
      const response = await post("/application/updateClaims", {
        token,
        applicationId,
        claims: currentClaims,
      });
      dispatch(updateApplication(response.data.data));
      setEditingClaimIndex(null);
      setEditedClaimContent("");
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

  const formatClaim = (claim) => {
    const isCancelled = claim.toLowerCase().includes("(cancelled");
    const parts = claim.split(". ");
    const claimNumber = parts[0];
    const claimContent = parts.slice(1).join(". ");
    return { claimNumber, claimContent, isCancelled };
  };

  const getClaim = (text) => {
    const parts = text.split(". ");
    return parts.length > 1 ? parts.slice(1).join(". ") : "";
  };

  const handleEditClick = (index, currentContent) => {
    setEditingClaimIndex(index);
    setEditedClaimContent(currentContent);
  };

  const handleClaimContentChange = (e) => {
    setEditedClaimContent(e.target.value);
  };

  const handleSaveClick = async (claimNumber) => {
    try {
      const updatedClaimString = `${claimNumber}. ${editedClaimContent}`;
      const updatedClaimsArray = [...currentClaims];
      updatedClaimsArray[editingClaimIndex] = updatedClaimString;

      setCurrentClaims(updatedClaimsArray);

      if (
        finalizationStatus &&
        !Object.keys(finalizationStatus.rejections).length
      ) {
        setIsSaving(true);
        const response = await post("/application/updateClaims", {
          token,
          claims: updatedClaimsArray,
          applicationId,
        });
        dispatch(updateApplication(response.data.data));
        setEditingClaimIndex(null);
        setEditedClaimContent("");
      } else if (
        finalizationStatus &&
        Object.keys(finalizationStatus.rejections).length
      ) {
        handleOpenConfirmationModal();
      }
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
      if (!isConfirmationModalOpen) {
        setIsSaving(false);
      }
    }
  };

  const handleCancelClick = () => {
    setEditingClaimIndex(null);
    setEditedClaimContent("");
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 10 + "px";
    }
  }, [editedClaimContent, editingClaimIndex]);

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
      setEditingClaimIndex(null);
      setEditedClaimContent("");
      setCurrentClaims(claims);
    }
  }, [isOpen, claims]);

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
          className={`bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col transform transition-all duration-300 ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Latest Claims
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {currentClaims.length} claim
                {currentClaims.length !== 1 ? "s" : ""} total
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

          {/* Content with scrolling */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f1f1",
            }}
          >
            {currentClaims.length > 0 ? (
              <div className="space-y-3">
                {currentClaims.map((claim, index) => {
                  const { claimNumber, claimContent, isCancelled } =
                    formatClaim(claim);

                  const isEditing = editingClaimIndex === index;

                  return (
                    <div
                      key={index}
                      className={`relative p-4 rounded-lg transition-all duration-200 ${
                        isCancelled
                          ? "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                          : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isCancelled
                              ? "bg-gray-200 text-gray-600"
                              : "bg-blue-200 text-blue-700"
                          }`}
                        >
                          {claimNumber}
                        </div>
                        <div className="flex-1">
                          {isEditing ? (
                            <>
                              <textarea
                                ref={textareaRef}
                                className="w-full bg-white p-2 border border-gray-300 rounded-md text-sm leading-relaxed overflow-hidden resize-none"
                                value={editedClaimContent}
                                onChange={handleClaimContentChange}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={handleCancelClick}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                  disabled={isSaving}
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveClick(claimNumber)}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                  disabled={
                                    getClaim(
                                      currentClaims[editingClaimIndex]
                                    ) === editedClaimContent || isSaving
                                  }
                                >
                                  <Save className="h-4 w-4 mr-2" />{" "}
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-start">
                              <p
                                className={`flex-1 text-sm leading-relaxed ${
                                  isCancelled
                                    ? "text-gray-600"
                                    : "text-gray-800"
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: formatTextToDelimiter(claimContent),
                                }}
                              ></p>
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditClick(index, claimContent)
                                }
                                className="ml-4 flex-shrink-0 p-1.5 rounded-md bg-white text-black border border-gray-300 shadow-sm
                                             hover:text-blue-600 hover:border-blue-300 cursor-pointer"
                                aria-label="Edit claim"
                                title="Edit Claim"
                                disabled={isSaving}
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          )}

                          {isCancelled && !isEditing && (
                            <span className="inline-block mt-2 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-center">
                  No latest claims available.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-100">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              disabled={isSaving}
            >
              Close
            </button>
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
    </>
  );
};

export default LatestClaimsModal;
