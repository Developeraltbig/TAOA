import { useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";

const ConfirmationModal = ({
  title,
  isOpen,
  onClose,
  message,
  onConfirm,
  isLatestOpen,
  cancelButtonText,
  confirmButtonText,
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
    } else if (isLatestOpen !== true) {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      if (isLatestOpen !== true) {
        document.body.classList.remove("overflow-hidden");
      }
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <X />
        </button>

        {/* Exclamation Icon (retained as a warning for overwrite) */}
        <div className="bg-red-100 rounded-full p-3 mb-6">
          <TriangleAlert color="red" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>

        {/* Message */}
        <p className="text-gray-600 mb-8">{message}</p>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 w-full">
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors duration-200 cursor-pointer"
          >
            {confirmButtonText}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-colors duration-200 cursor-pointer"
          >
            {cancelButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
