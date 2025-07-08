import { useState } from "react";
import DocumentStatus from "./DocumentStatus";
import ConfirmationModal from "./ConfirmationModal";
import { Upload, CloudUpload, CheckCircle } from "lucide-react";

const FileUpload = ({
  documents,
  handleFile,
  fileInputRef,
  isFirstRejection,
  allDocumentsReady,
  finalizationStatus,
  isLatestClaimFailed,
  isLatestClaimLoading,
  currentApplicationDocuments,
}) => {
  const [newFile, setNewFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const handleOpenConfirmationModal = () => setIsConfirmationModalOpen(true);
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setNewFile(null);
    fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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
    if (
      files?.length > 0 &&
      finalizationStatus &&
      !Object.keys(finalizationStatus.rejections).length
    ) {
      handleFileUpload(files[0]);
    } else if (
      files?.length > 0 &&
      finalizationStatus &&
      Object.keys(finalizationStatus.rejections).length
    ) {
      handleOpenConfirmationModal();
      setNewFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (
      files?.length > 0 &&
      finalizationStatus &&
      !Object.keys(finalizationStatus.rejections).length
    ) {
      handleFileUpload(files[0]);
    } else if (
      files?.length > 0 &&
      finalizationStatus &&
      Object.keys(finalizationStatus.rejections).length
    ) {
      handleOpenConfirmationModal();
      setNewFile(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    await handleFile(file);
  };

  const handleConfirmation = async () => {
    setIsConfirmationModalOpen(false);
    await handleFile(newFile);
    setNewFile(null);
  };

  return (
    <>
      <div className="mt-6 space-y-6">
        <div
          className={`
          border-2 border-dashed rounded-xl p-8 text-center bg-gray-50 transition-all duration-300
          ${
            isDragging
              ? "border-blue-500 bg-blue-100"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"
          }
          cursor-pointer
        `}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />

          <CloudUpload
            className={`
            mx-auto mb-4 transition-all duration-300
            ${isDragging ? "text-blue-500 scale-110" : "text-gray-400"}
          `}
            size={48}
          />

          <h4 className="font-semibold text-gray-700 mb-2">
            {isDragging
              ? "Drop your file here"
              : "Drop your updated claims file here"}
          </h4>

          <p className="text-sm text-gray-500 mb-4">or click to browse</p>

          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload size={18} />
            Select Claims File
          </button>

          <p className="text-xs text-gray-400 mt-2">
            PDF, DOC, or DOCX (max 10MB)
          </p>
        </div>

        {allDocumentsReady && (
          <div className="space-y-3 animate-fadeIn">
            <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Documents Ready
                </p>
                <p className="text-sm text-green-700 mt-1">
                  All required documents have been collected. You can proceed or
                  upload new claims.
                </p>
              </div>
            </div>
          </div>
        )}

        {(currentApplicationDocuments?.showApplicationDocumentsLoading ||
          allDocumentsReady) && (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentStatus
                key={doc.key}
                document={doc}
                isFirstRejection={isFirstRejection}
                isLatestClaimFailed={isLatestClaimFailed}
                isLatestClaimLoading={isLatestClaimLoading}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmationModal
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

export default FileUpload;
