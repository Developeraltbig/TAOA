import { X, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setIsClaimStatusModalOpen } from "../store/slices/modalsSlice";

const ClaimStatusModal = ({ claimStatus }) => {
  const dispatch = useDispatch();
  const isClaimStatusModalOpen = useSelector(
    (state) => state.modals.isClaimStatusModalOpen
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      dispatch(setIsClaimStatusModalOpen(false));
    }
  };

  useEffect(() => {
    if (isClaimStatusModalOpen) {
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
  }, [isClaimStatusModalOpen]);

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

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (
      normalizedStatus?.includes("allowed") ||
      normalizedStatus?.includes("approved")
    ) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (
      normalizedStatus?.includes("rejected") ||
      normalizedStatus?.includes("objected")
    ) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (
      normalizedStatus?.includes("allowed") ||
      normalizedStatus?.includes("approved")
    ) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (
      normalizedStatus?.includes("rejected") ||
      normalizedStatus?.includes("objected")
    ) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-status-modal"
    >
      <section
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col
          transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }
        `}
        aria-labelledby="claim-status-modal"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Claim Status Overview
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Review the status of all claims
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch(setIsClaimStatusModalOpen(false))}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <th className="py-4 px-6 text-left text-sm font-semibold text-white">
                    Claim Number
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-white">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-white">
                    Issue Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {claimStatus.map((claim, index) => (
                  <tr
                    key={index}
                    className={`
                      border-b border-gray-100 transition-colors duration-150
                      ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      hover:bg-blue-50
                    `}
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">
                        {claim.claimNumbers}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(claim.status)}
                        <span
                          className={`
                          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                          ${getStatusColor(claim.status)}
                        `}
                        >
                          {claim.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
                          {claim.type.split(",")[0] || "N/A"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClaimStatusModal;
