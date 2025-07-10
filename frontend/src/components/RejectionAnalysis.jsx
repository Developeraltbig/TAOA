import { forwardRef } from "react";
import RejectionCard from "./RejectionCard";
import { Info, Lock, Target, CheckCircle, ChevronDown } from "lucide-react";

const RejectionAnalysis = forwardRef(
  (
    {
      data,
      showTutorial,
      expandedSection,
      setReasoningModal,
      allDocumentsReady,
      setExpandedSection,
      finalizationStatus,
      isRejectionLoading,
      handleViewAnalysisClick,
      handleBeginAnalysisClick,
      handleOtherRejectionClick,
      currentApplicationDocuments,
    },
    ref
  ) => {
    const isExpanded = expandedSection === "rejections";
    const rejections = data?.rejections || [];
    const finalizedCount = rejections.filter(
      (r) => finalizationStatus?.rejections?.[r._id]?.isFinalized
    ).length;

    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl shadow-lg transition-all duration-500 rejection-analysis-section border border-blue-100 ${
          isExpanded ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <button
          onClick={() => {
            if (allDocumentsReady && !showTutorial) {
              setExpandedSection(isExpanded ? null : "rejections");
            }
          }}
          className={`w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
            isExpanded ? "rounded-t-2xl" : "rounded-2xl"
          }`}
          disabled={!allDocumentsReady}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                !allDocumentsReady
                  ? "bg-gray-100 text-gray-400"
                  : finalizationStatus?.allFinalized
                  ? "bg-green-100 text-green-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {!allDocumentsReady ? (
                <Lock size={24} />
              ) : finalizationStatus?.allFinalized ? (
                <CheckCircle size={24} />
              ) : (
                <Target size={24} />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">
                Step 2: Rejection Analysis
              </h3>
              <p className="text-sm text-gray-500">
                {!allDocumentsReady
                  ? "Complete document collection first"
                  : `${finalizedCount} of ${rejections.length} rejections analyzed`}
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
            isExpanded && allDocumentsReady ? "max-h-fit" : "max-h-0"
          }`}
        >
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="mt-6 space-y-4">
              {rejections.map((rejection, idx) => (
                <RejectionCard
                  index={idx}
                  data={data}
                  key={rejection._id}
                  rejection={rejection}
                  setReasoningModal={setReasoningModal}
                  finalizationStatus={finalizationStatus}
                  isRejectionLoading={isRejectionLoading}
                  handleViewAnalysisClick={handleViewAnalysisClick}
                  handleBeginAnalysisClick={handleBeginAnalysisClick}
                  handleOtherRejectionClick={handleOtherRejectionClick}
                  currentApplicationDocuments={currentApplicationDocuments}
                />
              ))}
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info
                  className="text-blue-600 mt-0.5 flex-shrink-0"
                  size={20}
                />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Analysis Tip
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Each rejection must be thoroughly analyzed before generating
                    your response. Review the examiner's reasoning and prior art
                    references to develop strong arguments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RejectionAnalysis.displayName = "RejectionAnalysis";

export default RejectionAnalysis;
