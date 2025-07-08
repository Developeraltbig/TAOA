import React from "react";
import { CheckCircle, Lock, FileText, Target, FileCheck } from "lucide-react";

const StepIndicator = ({
  documentRef,
  responseRef,
  rejectionRef,
  allDocumentsReady,
  setExpandedSection,
  allRejectionsFinalized,
}) => {
  const steps = [
    {
      id: 1,
      title: "Document Collection",
      icon: FileText,
      status: allDocumentsReady ? "complete" : "active",
      description: "Gather all required documents",
      ref: documentRef,
      sectionKey: "documents",
    },
    {
      id: 2,
      title: "Rejection Analysis",
      icon: Target,
      status: allDocumentsReady
        ? allRejectionsFinalized
          ? "complete"
          : "active"
        : "locked",
      description: "Review and analyze each rejection",
      ref: rejectionRef,
      sectionKey: "rejections",
    },
    {
      id: 3,
      title: "Generate Response",
      icon: FileCheck,
      status: allRejectionsFinalized ? "active" : "locked",
      description: "Create your office action response",
      ref: responseRef,
      sectionKey: "response",
    },
  ];

  const scrollToSection = (ref, sectionKey) => {
    setExpandedSection(sectionKey);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ref.current) {
          const navbarHeight = 75;
          const elementRect = ref.current.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const scrollToPosition = absoluteElementTop - navbarHeight;

          window.scrollTo({
            top: scrollToPosition,
            behavior: "smooth",
          });
        }
      });
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 progress-tracker-container border border-blue-100">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`flex flex-col items-center transition-all transform ${
                step.status === "locked"
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:scale-105"
              }`}
              onClick={() => {
                if (step.status !== "locked") {
                  scrollToSection(step.ref, step.sectionKey);
                }
              }}
            >
              <div
                className={`
                w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all
                ${
                  step.status === "complete"
                    ? "bg-green-100 text-green-600"
                    : step.status === "active"
                    ? "bg-blue-100 text-blue-600 ring-4 ring-blue-50"
                    : "bg-gray-100 text-gray-400"
                }
              `}
              >
                {step.status === "complete" ? (
                  <CheckCircle size={28} />
                ) : step.status === "locked" ? (
                  <Lock size={24} />
                ) : (
                  <step.icon size={28} />
                )}
              </div>
              <h4
                className={`font-semibold text-sm mb-1 text-center ${
                  step.status === "active" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step.title}
              </h4>
              <p className="text-xs text-gray-500 text-center max-w-[150px]">
                {step.description}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 -mt-12 mx-4 rounded transition-all duration-500 ${
                  steps[index].status === "complete"
                    ? "bg-green-200"
                    : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
