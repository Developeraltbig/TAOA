import { useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";

const FinalizeConfirmationModal = ({
  title,
  isOpen,
  message,
  onClose,
  onConfirm,
  sourceTabText,
  onViewDetails,
  warningNoteText,
  cancelButtonText,
  confirmButtonText,
  currentFinalizedText,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

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

  if (!isRendering) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 relative flex flex-col items-center text-center transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <X size={24} /> {/* Using Lucide X icon */}
        </button>
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 animate-warningPulse">
          <TriangleAlert size={40} className="text-amber-600" />{" "}
        </div>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
          {title}
        </h2>{" "}
        {onViewDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 w-full">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {currentFinalizedText}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {sourceTabText}
                </p>
              </div>
              <button
                onClick={onViewDetails}
                className="p-2 hover:bg-white rounded-lg transition-colors duration-200 group"
                title="View Amendment"
              >
                <i className="fas fa-eye text-gray-500 group-hover:text-[#3586cb]"></i>{" "}
              </button>
            </div>
          </div>
        )}
        {/* Message */}
        <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
          {message}
        </p>{" "}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 w-full">
          <p className="text-xs text-amber-800 text-center">
            <i className="fas fa-info-circle mr-1"></i> {warningNoteText}
          </p>
        </div>
        <div className="flex gap-3 w-full">
          {" "}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 cursor-pointer bg-[#3586cb] hover:bg-[#2b6faa] text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3586cb]/30"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeConfirmationModal;
