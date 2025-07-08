import {
  Lock,
  Download,
  FileCheck,
  CheckCircle,
  ChevronDown,
  CheckSquare,
} from "lucide-react";
import { forwardRef } from "react";

const ResponseGeneration = forwardRef(
  (
    {
      data,
      draftState,
      expandedSection,
      rejections = [],
      setExpandedSection,
      finalizationStatus,
      allRejectionsFinalized,
      handleShowDraftPreview,
    },
    ref
  ) => {
    const isExpanded = expandedSection === "response";

    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl shadow-sm transition-all duration-500 generate-response-section border border-blue-100 ${
          isExpanded ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <button
          onClick={() => {
            if (allRejectionsFinalized) {
              setExpandedSection(isExpanded ? null : "response");
            }
          }}
          className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
            isExpanded ? "rounded-t-2xl" : "rounded-2xl"
          }`}
          disabled={!allRejectionsFinalized}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                !allRejectionsFinalized
                  ? "bg-gray-100 text-gray-400"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {!allRejectionsFinalized ? (
                <Lock size={24} />
              ) : (
                <FileCheck size={24} />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">
                Step 3: Generate Response
              </h3>
              <p className="text-sm text-gray-500">
                {!allRejectionsFinalized
                  ? "Complete all rejection analyses first"
                  : "Ready to generate your office action response"}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            size={20}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            isExpanded && allRejectionsFinalized ? "max-h-fit" : "max-h-0"
          }`}
        >
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="mt-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="text-white" size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      All Set!
                    </h4>
                    <p className="text-sm text-gray-600">
                      Your response is ready to be generated
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center transform transition-all hover:scale-105">
                    <div className="text-2xl font-bold text-gray-900">
                      {rejections.length}
                    </div>
                    <p className="text-sm text-gray-500">
                      Rejections Addressed
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center transform transition-all hover:scale-105">
                    <div className="text-2xl font-bold text-green-600">
                      100%
                    </div>
                    <p className="text-sm text-gray-500">Ready</p>
                  </div>
                </div>

                <button
                  onClick={handleShowDraftPreview}
                  disabled={draftState.isGenerating}
                  className="flex-1 px-6 py-3 w-full bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-all transform hover:scale-102 flex items-center justify-center gap-2 font-medium cursor-pointer"
                >
                  {draftState.isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Generate Final Draft
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  What's included:
                </h4>
                <ul className="space-y-2">
                  {[
                    "Complete response to office action",
                    "Amended claims with tracked changes",
                    "Arguments addressing each rejection",
                    "Remarks section with detailed explanations",
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckSquare
                        className="text-green-600 mt-0.5 flex-shrink-0"
                        size={16}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ResponseGeneration.displayName = "ResponseGeneration";

export default ResponseGeneration;
