import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { formatTextToParagraphs } from "../helpers/formatText";

const ExaminerReasoningModal = ({
  isOpen,
  onClose,
  content,
  rejectionType,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="examiner-reasoning-modal"
    >
      <div
        className={`
          bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden
          transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Examiner Reasoning
              </h3>
              <p className="text-sm text-gray-500 mt-1">{rejectionType}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div
          className="p-6 overflow-y-auto max-h-[60vh]"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 #f1f1f1",
          }}
        >
          <div className="prose prose-sm max-w-none">
            <p
              className="text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: formatTextToParagraphs(content),
              }}
            ></p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExaminerReasoningModal;
