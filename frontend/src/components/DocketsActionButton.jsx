const DocketsActionButtons = ({ onDownload, onRegenerate }) => {
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
    </div>
  );
};

export default DocketsActionButtons;
