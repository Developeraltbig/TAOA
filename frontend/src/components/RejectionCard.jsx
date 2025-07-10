import {
  Zap,
  Gavel,
  Loader2,
  FileSearch,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

const RejectionCard = ({
  data,
  index,
  rejection,
  setReasoningModal,
  finalizationStatus,
  isRejectionLoading,
  handleViewAnalysisClick,
  handleBeginAnalysisClick,
  handleOtherRejectionClick,
  currentApplicationDocuments,
}) => {
  const isFinalized =
    finalizationStatus?.rejections?.[rejection._id]?.isFinalized;
  const isLoading = isRejectionLoading[rejection._id]?.loading;
  const isAnalysisRejection =
    rejection.rejectionType.includes("102") ||
    rejection.rejectionType.includes("103");
  const docket = data?.dockets?.find((d) => d.rejectionId === rejection._id);

  const isDisabled =
    Object.keys(isRejectionLoading).length > 0 ||
    !data.isSubjectDescriptionExists ||
    !data.isSubjectClaimsExists ||
    !data.isPriorArtDescriptionExists ||
    currentApplicationDocuments?.isSubjectClaimsUploading ||
    currentApplicationDocuments?.isPriorArtDescriptionFetching ||
    currentApplicationDocuments?.isSubjectDescriptionFetching;

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="bg-gray-50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all flex-shrink-0 ${
                isFinalized
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {isFinalized ? <CheckCircle size={18} /> : index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                <h4 className="font-semibold text-gray-900 truncate">
                  {rejection.rejectionType.split(",")[0].split("and")[0]}
                </h4>
                <span className="relative inline-flex p-[2px] rounded-full bg-white">
                  {/* Gradient border */}
                  <span
                    className={`absolute inset-0 rounded-full ${
                      isFinalized
                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                        : "bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse"
                    }`}
                  />
                  {/* Inner content */}
                  <span
                    className={`relative inline-flex items-center px-4 py-1.5 text-xs font-bold bg-white rounded-full ${
                      isFinalized ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    <div className="relative flex items-center justify-center mr-2">
                      <span
                        className={`relative z-10 block w-2 h-2 rounded-full ${
                          isFinalized
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : "bg-gradient-to-r from-amber-400 to-orange-500"
                        }`}
                      />
                      {!isFinalized && (
                        <>
                          <span className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-ping" />
                          <span
                            className="absolute w-3 h-3 rounded-full bg-orange-400 animate-ping opacity-40"
                            style={{ animationDelay: "200ms" }}
                          />
                        </>
                      )}
                    </div>
                    {isFinalized ? "Finalized" : "Not Finalized"}
                  </span>
                </span>
              </div>
              <p className="text-sm text-gray-500 break-words">
                Affects {rejection.claimsRejected?.length || 0} claims
                {rejection.priorArtReferences?.length > 0 &&
                  ` • ${
                    rejection.priorArtReferences.length
                  } prior art reference${
                    rejection.priorArtReferences.length > 1 ? "s" : ""
                  }`}
              </p>
            </div>
          </div>

          {isAnalysisRejection ? (
            rejection.analyseRejection &&
            (docket ? (
              <button
                onClick={(e) => handleViewAnalysisClick(e, docket)}
                disabled={isDisabled}
                className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  isDisabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 cursor-pointer"
                }`}
              >
                <span className="whitespace-nowrap">View Analysis</span>
                <i className="fa-solid fa-paper-plane text-xs sm:text-sm"></i>
              </button>
            ) : (
              <button
                onClick={(e) =>
                  handleBeginAnalysisClick(
                    e,
                    rejection,
                    data.applicationId,
                    data.publicationNumber
                  )
                }
                disabled={isDisabled}
                className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  isDisabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="whitespace-nowrap">Analysing...</span>
                  </>
                ) : (
                  <>
                    <span className="whitespace-nowrap">Begin Analysis</span>
                    <i className="fa-solid fa-bolt text-xs sm:text-sm"></i>
                  </>
                )}
              </button>
            ))
          ) : (
            <button
              onClick={() => handleOtherRejectionClick(rejection)}
              disabled={isDisabled}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base ${
                isDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105"
              }`}
            >
              <span className="whitespace-nowrap">Review</span>
              <i className="fa-solid fa-comment-dots text-xs sm:text-sm"></i>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Claims */}
        {rejection.claimsRejected?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gavel className="text-gray-500" size={16} />
              <span className="text-sm font-medium text-gray-700">
                Claims Rejected:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rejection.claimsRejected.slice(0, 10).map((claim) => (
                <span
                  key={claim}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {claim}
                </span>
              ))}
              {rejection.claimsRejected.length > 10 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                  +{rejection.claimsRejected.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Prior Art References */}
        {rejection.priorArtReferences?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSearch className="text-gray-500" size={16} />
              <span className="text-sm font-medium text-gray-700">
                Prior Art References:
              </span>
            </div>
            <div className="space-y-2">
              {rejection.priorArtReferences.map((art, idx) => (
                <div key={idx} className="bg-blue-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-blue-900">
                      {art.citedPubNo}
                    </span>
                    <div className="ml-2 -mt-1">
                      {art.citedPubURL && art.citedPubURL !== "#" && (
                        <a
                          href={art.citedPubURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink size={14} className="inline" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examiner Reasoning */}
        {rejection.examinerReasoning && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="text-gray-500" size={16} />
              <span className="text-sm font-medium text-gray-700">
                Examiner Reasoning:
              </span>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-900 leading-relaxed">
                {truncateText(rejection.examinerReasoning)}
              </p>
              <button
                onClick={() =>
                  setReasoningModal({
                    isOpen: true,
                    content: rejection.examinerReasoning,
                    rejectionType: rejection.rejectionType,
                  })
                }
                className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Show more
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RejectionCard;
