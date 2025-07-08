import { Eye, FilePenIcon, FileText, Loader2, RotateCcw } from "lucide-react";

const DocumentStatus = ({
  document,
  isFirstRejection,
  isLatestClaimFailed,
  isLatestClaimLoading,
}) => {
  const Icon = FileText;

  const getStatusText = (document, isFirstRejection) => {
    const isUpload = document.label === "Latest Claims" && !isFirstRejection;

    const statusMessages = {
      complete: isUpload ? "Successfully uploaded" : "Successfully fetched",
      loading: isUpload ? "Uploading..." : "Fetching...",
      failed: isUpload ? "Error while uploading" : "Error while fetching",
    };

    return statusMessages[document.status] || "Waiting to fetch";
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {document.status === "loading" ? (
            <Loader2 className="text-blue-600 animate-spin" size={20} />
          ) : (
            <Icon
              className={
                document.status === "complete"
                  ? "text-green-600"
                  : document.status === "loading"
                  ? "text-blue-600 animate-pulse"
                  : document.status === "failed"
                  ? "text-red-600"
                  : "text-gray-400"
              }
              size={20}
            />
          )}
          <div>
            <h4 className="font-medium text-gray-900">{document.label}</h4>
            <p className="text-xs text-gray-500">
              {getStatusText(document, isFirstRejection)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {document.status === "complete" && (
            <>
              {document.canView && (
                <button
                  onClick={document.onView}
                  style={{
                    cursor: isLatestClaimLoading ? "progress" : "pointer",
                  }}
                  disabled={isLatestClaimFailed}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="View document"
                >
                  <Eye size={20} />
                </button>
              )}
            </>
          )}
          {document.status === "failed" && document?.canView !== true && (
            <button
              onClick={document.onRetry}
              className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              title="Retry"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentStatus;
