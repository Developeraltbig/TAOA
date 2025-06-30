import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { X, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";

const DraftPreviewModal = ({ isOpen, onClose, applicationId, onGenerate }) => {
  const enviroment = import.meta.env.VITE_ENV;
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const authUser = useSelector((state) => state.user.authUser);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const loadPreview = async () => {
    try {
      setIsLoading(true);
      const response = await post("/draft/preview", {
        token: authUser.token,
        applicationId,
      });
      setPreviewData(response.data.data);
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      } else {
        const message = error?.response?.data?.message;
        toast.error(message);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsRendering(true);
      loadPreview();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setIsRendering(false);
        setPreviewData(null);
      }, 300);
    }
  }, [isOpen, applicationId]);

  if (!isRendering) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <section
        className={`
          relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto
          transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-2xl text-gray-800">
                Draft Response Preview
              </h2>
              <p className="text-gray-600 text-sm">
                Review before generating the final document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : previewData ? (
          <div className="space-y-6">
            {/* Status Overview */}
            <div
              className={`p-4 rounded-lg border-2 ${
                previewData.readyForGeneration
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {previewData.readyForGeneration ? (
                  <CheckCircle className="text-green-600 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      previewData.readyForGeneration
                        ? "text-green-900"
                        : "text-amber-900"
                    }`}
                  >
                    {previewData.readyForGeneration
                      ? "All rejections have been addressed"
                      : "Some items need attention"}
                  </p>
                  {!previewData.readyForGeneration && (
                    <ul className="mt-2 space-y-1">
                      {previewData.missingItems.map((item, index) => (
                        <li key={index} className="text-sm text-amber-800">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Document Contents */}
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-3">
                Document will include:
              </h3>
              <div className="space-y-3">
                {previewData.rejectionTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{type} Response</span>
                    </div>
                    <CheckCircle className="text-green-500" size={20} />
                  </div>
                ))}
              </div>
            </div>

            {/* Document Structure */}
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-3">
                Document structure:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Title page with application details
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Summary of all rejections
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Detailed response to each rejection
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Amended claims with comparison tables
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Conclusion and signature block
                </li>
              </ul>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onGenerate();
            }}
            disabled={true || !previewData?.readyForGeneration}
            className="px-6 py-2.5 bg-[#3586cb] hover:bg-[#2b6faa] text-white rounded-lg cursor-pointer font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {/* <span>Generate Document</span> */}
            <span>Coming Soon</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default DraftPreviewModal;
