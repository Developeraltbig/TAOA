import { useState, useEffect, useRef } from "react";

const ReasoningSection = ({ examinerReasoning }) => {
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
        <div className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-6 py-4 shadow-lg w-full border border-gray-300">
          <span className="font-bold text-lg">Examiner Reasoning: </span>
          <div>
            <p
              ref={textRef}
              className={`text-base text-justify ${
                showMore ? "" : "line-clamp-2"
              }`}
            >
              {examinerReasoning}
            </p>
            {isOverflowing && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="text-[#38b6ff] hover:underline font-semibold focus:outline-none cursor-pointer"
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

export default ReasoningSection;
