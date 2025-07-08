import { forwardRef } from "react";
import FileUpload from "./FileUpload";
import DocumentStatus from "./DocumentStatus";
import { Info, FileText, CheckCircle, ChevronDown } from "lucide-react";

const DocumentCollection = forwardRef(
  (
    {
      data,
      handleFile,
      isDragging,
      fileInputRef,
      setIsDragging,
      expandedSection,
      allDocumentsReady,
      setExpandedSection,
      finalizationStatus,
      isLatestClaimFailed,
      isLatestClaimLoading,
      fetchUploadAllDocuments,
      handleViewDocumentClick,
      currentApplicationDocuments,
    },
    ref
  ) => {
    const isExpanded = expandedSection === "documents";
    const isFirstRejection = data?.isFirstRejection;

    const documents = [
      {
        key: "claims",
        label: "Latest Claims",
        status: currentApplicationDocuments?.isSubjectClaimsUploading
          ? "loading"
          : currentApplicationDocuments?.subjectClaimsFailed
          ? "failed"
          : currentApplicationDocuments?.subjectClaimsUploaded ||
            data?.isSubjectClaimsExists
          ? "complete"
          : "pending",
        loading: currentApplicationDocuments?.isSubjectClaimsUploading,
        failed: currentApplicationDocuments?.subjectClaimsFailed,
        exists: data?.isSubjectClaimsExists,
        canView: true,
        onView: handleViewDocumentClick,
        onRetry: () => fetchUploadAllDocuments({ fetchSubjectDesc: true }),
      },
      {
        key: "appDesc",
        label: "Application Description",
        status: currentApplicationDocuments?.isSubjectDescriptionFetching
          ? "loading"
          : currentApplicationDocuments?.subjectDescriptionFailed
          ? "failed"
          : currentApplicationDocuments?.subjectDescriptionFetched ||
            data?.isSubjectDescriptionExists
          ? "complete"
          : "pending",
        loading: currentApplicationDocuments?.isSubjectDescriptionFetching,
        failed: currentApplicationDocuments?.subjectDescriptionFailed,
        exists: data?.isSubjectDescriptionExists,
        onRetry: () => fetchUploadAllDocuments({ fetchSubjectDesc: true }),
      },
      {
        key: "priorArt",
        label: "Prior Art Description",
        status: currentApplicationDocuments?.isPriorArtDescriptionFetching
          ? "loading"
          : currentApplicationDocuments?.priorArtDescriptionFailed
          ? "failed"
          : currentApplicationDocuments?.priorArtDescriptionFetched ||
            data?.isPriorArtDescriptionExists
          ? "complete"
          : "pending",
        loading: currentApplicationDocuments?.isPriorArtDescriptionFetching,
        failed: currentApplicationDocuments?.priorArtDescriptionFailed,
        exists: data?.isPriorArtDescriptionExists,
        onRetry: () => fetchUploadAllDocuments({ fetchPriorArt: true }),
      },
    ];

    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl shadow-lg transition-all duration-500 document-collection-section border border-blue-100 ${
          isExpanded ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <button
          onClick={() => setExpandedSection(isExpanded ? null : "documents")}
          className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
            isExpanded ? "rounded-t-2xl" : "rounded-2xl"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                allDocumentsReady
                  ? "bg-green-100 text-green-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {allDocumentsReady ? (
                <CheckCircle size={24} />
              ) : (
                <FileText size={24} />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">
                Step 1: Document Collection
              </h3>
              <p className="text-sm text-gray-500">
                {allDocumentsReady
                  ? "All documents successfully collected and ready for analysis"
                  : isFirstRejection
                  ? "Auto-fetching documents..."
                  : "Upload your latest claims to begin"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            size={20}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            isExpanded ? "max-h-fit" : "max-h-0"
          }`}
        >
          <div className="px-6 pb-6 border-t border-gray-100">
            {isFirstRejection ? (
              <div className="mt-6 space-y-4">
                {!allDocumentsReady && (
                  <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
                    <Info className="text-blue-600 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        First-time rejection detected
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        We're automatically fetching all required documents.
                        This usually takes 1 minute.
                      </p>
                    </div>
                  </div>
                )}

                {allDocumentsReady && (
                  <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
                    <CheckCircle className="text-green-600 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        All documents ready!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Documents have been successfully fetched. You can now
                        proceed to analyze the rejections.
                      </p>
                    </div>
                  </div>
                )}

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
              </div>
            ) : (
              <FileUpload
                documents={documents}
                isDragging={isDragging}
                handleFile={handleFile}
                fileInputRef={fileInputRef}
                setIsDragging={setIsDragging}
                isFirstRejection={isFirstRejection}
                allDocumentsReady={allDocumentsReady}
                finalizationStatus={finalizationStatus}
                isLatestClaimFailed={isLatestClaimFailed}
                isLatestClaimLoading={isLatestClaimLoading}
                currentApplicationDocuments={currentApplicationDocuments}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

DocumentCollection.displayName = "DocumentCollection";

export default DocumentCollection;
