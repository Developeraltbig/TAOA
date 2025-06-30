import { useState, useEffect, useRef } from "react";

const OtherRejectionReasoningSection = ({ examinerReasoning }) => {
  const textRef = useRef(null);
  const [showMore, setShowMore] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight } = textRef.current;
        setIsOverflowing(scrollHeight > clientHeight);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => window.removeEventListener("resize", checkOverflow);
  }, [examinerReasoning]);

  return (
    <>
      {examinerReasoning && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">
            Examiner's Reasoning
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p
              ref={textRef}
              className={`text-gray-700 text-sm whitespace-pre-wrap ${
                showMore ? "" : "line-clamp-2"
              }`}
            >
              {examinerReasoning}
            </p>
            {isOverflowing && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-[#38b6ff] text-sm hover:underline font-semibold focus:outline-none cursor-pointer"
              >
                {showMore ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default OtherRejectionReasoningSection;
