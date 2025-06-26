import { X } from "lucide-react";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-status-modal"
    >
      <section
        className={`
      relative bg-slate-50 rounded-lg shadow-xl p-10 w-full max-w-3xl max-h-3/4 overflow-y-auto
      transform transition-all duration-300
      ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-16 scale-95"
      }
    `}
        aria-labelledby="claim-status-modal"
      >
        <button
          onClick={() => dispatch(setIsClaimStatusModalOpen(false))}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <X />
        </button>

        <h2 className="font-bold text-3xl mb-6 text-center">Claim Status</h2>

        <table className="w-full border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="border-b border-gray-300 bg-[#0284c7]">
              <th className="py-2 px-4 w-1/3 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                Claim Number
              </th>
              <th className="py-2 px-4 w-1/3 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                Status
              </th>
              <th className="py-2 px-4 w-1/3 text-md font-bold text-white max-[425px]:px-2">
                Issue Type
              </th>
            </tr>
          </thead>
          <tbody>
            {claimStatus.map((claim, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-gray-200" : "bg-white"
                } hover:bg-gray-200/50`}
              >
                <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300">
                  {claim.claimNumbers}
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300">
                  <span>{claim.status}</span>
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2">
                  {claim.type.split(",")[0] || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ClaimStatusModal;
