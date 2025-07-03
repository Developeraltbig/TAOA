import { useEffect, useState } from "react";
import { X, FileText, CheckCircle } from "lucide-react";

const AmendedClaimModal = ({
  isOpen,
  onClose,
  heading,
  amendedClaim,
  amendmentStrategy,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const allElements = [
    ...(amendedClaim?.elements || []),
    ...(amendedClaim?.additionalElements || []),
  ];

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
    }
  }, [isVisible]);

  if (!isRendering) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col transform transition-all duration-300 ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-16 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{heading}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Finalized amendment with strategy
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content with scrolling */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 #f1f1f1",
          }}
        >
          {amendedClaim ? (
            <div className="space-y-6">
              {/* Complete Amended Claim */}
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    Complete Claim
                  </h4>
                </div>

                {/* Preamble */}
                <p className="text-gray-800 leading-relaxed font-medium mb-3">
                  {amendedClaim.preamble}
                </p>

                {/* Elements as list items */}
                {allElements.length > 0 && (
                  <ul className="space-y-2 ml-4">
                    {allElements.map((element, index) => (
                      <li
                        key={index}
                        className="text-gray-800 leading-relaxed text-sm"
                      >
                        <span className="text-gray-600">•</span>{" "}
                        {element.text || element}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Amendment Strategy Section */}
              {amendmentStrategy && (
                <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Amendment Strategy
                    </h4>
                  </div>
                  <p className="text-gray-800 leading-relaxed text-sm">
                    {amendmentStrategy}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-center">
                No amended claim data available.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmendedClaimModal;
