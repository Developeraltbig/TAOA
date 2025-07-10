import { Check } from "lucide-react";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

import "../styles/DocumentAnalysisLoader.css";

const DocumentAnalysisLoader = ({
  isLoading = false,
  onFinalPhaseReached = () => {},
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isApiFinalizing = useSelector((state) => state.loading.isApiFinalizing);

  const phases = [
    { text: "Analyzing Document", icon: "📄" },
    { text: "Isolating Rejections", icon: "🔍" },
    { text: "Classifying Grounds", icon: "📊" },
    { text: "Reviewing Citations", icon: "📚" },
    { text: "Organizing Findings", icon: "📁" },
    { text: "Preparing Summary", icon: "📝" },
  ];

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const intervalDuration = isApiFinalizing ? 1500 : 10000;

    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentPhase((prev) => {
          if (prev < phases.length - 1) {
            return prev + 1;
          }
          return prev;
        });
        setIsTransitioning(false);
      }, 300);
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [isLoading, isApiFinalizing, phases.length]);

  useEffect(() => {
    if (currentPhase === phases.length - 1 && isApiFinalizing) {
      setTimeout(() => {
        onFinalPhaseReached();
      }, 1200);
    }
  }, [currentPhase, isApiFinalizing, onFinalPhaseReached, phases.length]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
      <div className="w-full">
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-12"
          style={{ height: "320px" }}
        >
          {/* Main Content Area */}
          <div className="flex flex-col items-center justify-center h-full">
            {/* Icon and Text Display */}
            <div className="mb-12 text-center">
              <div
                className={`text-5xl mb-4 transition-all duration-300 ${
                  isTransitioning
                    ? "opacity-0 scale-90"
                    : "opacity-100 scale-100"
                }`}
              >
                {phases[currentPhase].icon}
              </div>
              <h2
                className={`text-2xl font-light text-gray-800 transition-all duration-300 ${
                  isTransitioning
                    ? "opacity-0 translate-y-2"
                    : "opacity-100 translate-y-0"
                }`}
              >
                {phases[currentPhase].text}
              </h2>
            </div>

            {/* Modern Progress Indicator */}
            <div className="relative w-full max-w-2xl">
              {/* Background Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />

              {/* Active Progress Line */}
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-1000 ease-out"
                style={{
                  width: `${(currentPhase / (phases.length - 1)) * 100}%`,
                }}
              ></div>

              {/* Phase Dots */}
              <div className="relative flex justify-between">
                {phases.map((phase, index) => (
                  <div key={index} className="relative">
                    {/* Outer Ring */}
                    <div
                      className={`w-12 h-12 rounded-full border-2 transition-all duration-500 ${
                        index === currentPhase
                          ? "border-blue-500 bg-blue-50 scale-110"
                          : index < currentPhase
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {/* Inner Dot */}
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        {index < currentPhase ? (
                          <div className="text-white">
                            <Check size={20} />
                          </div>
                        ) : (
                          <div
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${
                              index === currentPhase
                                ? "bg-blue-500 animate-pulse"
                                : "bg-gray-300"
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Ripple Effect for Active Phase - This is the one we want to keep */}
                    {index === currentPhase && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-400 opacity-20 animate-ping" />
                        <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-400 opacity-10 animate-ping animation-delay-200" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subtle Loading Text */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500">
                {currentPhase === phases.length - 1
                  ? "Finalizing your document analysis..."
                  : "Please wait while we process your application..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisLoader;
