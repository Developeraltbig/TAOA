import { Maximize } from "lucide-react";

const DocketsActionButtons = ({ onDownload, onRegenerate, onFullScreen }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={onDownload}
        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200 shadow-sm cursor-pointer transition-colors bg-white"
      >
        Download Now
      </button>
      <button
        onClick={onRegenerate}
        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200 shadow-sm cursor-pointer transition-colors bg-white"
      >
        Regenerate
      </button>
      {onFullScreen && (
        <button
          onClick={onFullScreen}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-200 shadow-sm cursor-pointer transition-colors bg-white flex items-center gap-2"
        >
          <Maximize size={16} />
          Full Screen
        </button>
      )}
    </div>
  );
};

export default DocketsActionButtons;
