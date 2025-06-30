import { Maximize } from "lucide-react";

const DocketsActionButtons = ({
  onDownload,
  onFinalize,
  onRegenerate,
  onFullScreen,
  isClaimsLoading,
  isClaimsFinalized,
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      {onDownload && (
        <button
          onClick={onDownload}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200 shadow-sm cursor-pointer transition-colors bg-white"
        >
          Download
        </button>
      )}

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className={`px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200 shadow-sm  transition-colors bg-white ${
            isClaimsLoading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Regenerate
        </button>
      )}
      {onFullScreen && (
        <button
          onClick={onFullScreen}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200 shadow-sm cursor-pointer transition-colors bg-white flex items-center gap-2"
        >
          <Maximize size={16} />
          Full Screen
        </button>
      )}
      {onFinalize && (
        <div className="inline-block relative">
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-md ${
              isClaimsFinalized
                ? "bg-green-700 hover:bg-green-600 cursor-not-allowed"
                : "bg-amber-700 hover:bg-amber-600 cursor-pointer"
            } shadow-sm text-white tooltip-trigger transition-all duration-300`}
            onClick={onFinalize}
          >
            {isClaimsFinalized ? (
              <>
                <span className="text-sm font-medium">Finalized</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">Finalize</span>
              </>
            )}
          </button>
          <div
            className="
              absolute left-full ml-2 top-1/2 transform -translate-y-1/2
              opacity-0 tooltip-content
              transition-opacity duration-300
              bg-gray-800 text-white text-sm rounded-lg px-3 py-2
              whitespace-nowrap z-50
              before:content-[''] before:absolute before:top-1/2 before:-left-2 before:transform before:-translate-y-1/2
              before:border-4 before:border-transparent before:border-r-gray-800
            "
          >
            {isClaimsFinalized
              ? "Amendment finalized"
              : "Click to finalize amendment"}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocketsActionButtons;
