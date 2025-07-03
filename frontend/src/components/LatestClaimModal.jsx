import { X, FileText } from "lucide-react";
import { useEffect, useState } from "react";

const LatestClaimsModal = ({ isOpen, onClose, claims = [] }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const formatClaim = (claim) => {
    const isCancelled = claim.toLowerCase().includes("(cancelled");
    const parts = claim.split(". ");
    const claimNumber = parts[0];
    const claimContent = parts.slice(1).join(". ");
    return { claimNumber, claimContent, isCancelled };
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
            <h3 className="text-2xl font-bold text-gray-900">Latest Claims</h3>
            <p className="text-sm text-gray-500 mt-1">
              {claims.length} claim{claims.length !== 1 ? "s" : ""} total
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
          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.map((claim, index) => {
                const { claimNumber, claimContent, isCancelled } =
                  formatClaim(claim);

                return (
                  <div
                    key={index}
                    className={`group relative p-4 rounded-lg transition-all duration-200 ${
                      isCancelled
                        ? "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                        : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isCancelled
                            ? "bg-gray-200 text-gray-600"
                            : "bg-blue-200 text-blue-700"
                        }`}
                      >
                        {claimNumber}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm leading-relaxed ${
                            isCancelled ? "text-gray-600" : "text-gray-800"
                          }`}
                        >
                          {claimContent}
                        </p>
                        {isCancelled && (
                          <span className="inline-block mt-2 text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-center">
                No latest claims available.
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

export default LatestClaimsModal;
