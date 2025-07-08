import introJs from "intro.js";
import { useEffect, useRef } from "react";

import "intro.js/introjs.css";

const TutorialOverlay = ({
  onClose,
  showTutorial,
  tutorialStep,
  setTutorialStep,
}) => {
  const introRef = useRef(null);

  useEffect(() => {
    if (showTutorial) {
      if (introRef.current) {
        introRef.current.exit();
      }

      setTimeout(() => {
        const intro = introJs();
        introRef.current = intro;

        const steps = [
          {
            element: ".application-details-section",
            intro: `
              <div style="max-width: 400px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">Application Details</h3>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">This section displays crucial information about your patent application, including the filing date and current claim status.</p>
              </div>
            `,
            position: "bottom",
          },
          {
            element: ".progress-tracker-container",
            intro: `
              <div style="max-width: 400px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">Workflow Progress Tracker</h3>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">This intuitive progress bar visually represents your current stage in the office action response workflow.</p>
              </div>
            `,
            position: "bottom",
          },
          {
            element: ".document-collection-section",
            intro: `
              <div style="max-width: 400px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">Document Collection</h3>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">For your first office action, all necessary documents are automatically gathered.</p>
              </div>
            `,
            position: "top",
          },
          {
            element: ".rejection-analysis-section",
            intro: `
              <div style="max-width: 400px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">Rejection Analysis</h3>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">Dive deep into each rejection here. Carefully review the examiner's reasoning.</p>
              </div>
            `,
            position: "top",
          },
          {
            element: ".generate-response-section",
            intro: `
              <div style="max-width: 400px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">Generate Response</h3>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">Once you've analyzed all rejections, generate your office action response.</p>
              </div>
            `,
            position: "top",
          },
        ];

        const validSteps = steps.filter((step, index) => {
          const element = document.querySelector(step.element);
          return !!element || index === 1;
        });

        if (validSteps.length === 0) {
          onClose();
          return;
        }

        intro.setOptions({
          steps: validSteps,
          showStepNumbers: false,
          showBullets: true,
          showProgress: false,
          exitOnOverlayClick: false,
          exitOnEsc: true,
          nextLabel: "Next",
          prevLabel: "Back",
          doneLabel: "Finish",
          tooltipClass: "custom-introjs-tooltip",
          scrollToElement: true,
          scrollPadding: 30,
          overlayOpacity: 0.6,
          keyboardNavigation: true,
          disableInteraction: false,
          helperElementPadding: 10,
          hidePrev: true,
        });

        intro.onbeforechange(function (targetElement) {
          if (!targetElement) {
            const currentStepObj = this._introItems[this._currentStep];
            if (currentStepObj) {
              const element = document.querySelector(currentStepObj.element);
              if (element) {
                currentStepObj.element = element;
                return true;
              }
            }
            return false;
          }
          return true;
        });

        intro.onchange(function (targetElement) {
          const currentIndex = this._currentStep;

          setTutorialStep(currentIndex);

          if (currentIndex === 0) {
            intro._options.hidePrev = true;
          } else {
            intro._options.hidePrev = false;
          }

          setTimeout(() => {
            if (this.refresh) {
              this.refresh();
            }
          }, 100);
        });

        intro.oncomplete(() => {
          onClose();
        });

        intro.onexit(() => {
          onClose();
        });

        try {
          intro.start();
          if (tutorialStep > 0) {
            setTimeout(() => {
              intro.goToStep(tutorialStep);
            }, 100);
          }
        } catch (error) {
          onClose();
        }
      }, 100);
    }

    return () => {
      if (introRef.current) {
        introRef.current.exit();
        introRef.current = null;
      }
    };
  }, [showTutorial]);

  useEffect(() => {
    if (showTutorial) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showTutorial]);

  return (
    <>
      <style>{`
        .introjs-tooltip {
          background: white !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          max-width: 450px !important;
        }

        .introjs-helperLayer {
          background-color: transparent !important;
          border-radius: 8px !important;
        }

        .introjs-showElement {
          z-index: 9999999 !important;
          position: relative !important;
          background-color: transparent !important;
        }

        .introjs-relativePosition {
          background-color: transparent !important;
        }

        .introjs-arrow {
          border: 8px solid transparent !important;
        }

        .introjs-arrow.top {
          border-bottom-color: white !important;
        }

        .introjs-arrow.bottom {
          border-top-color: white !important;
        }

        .introjs-arrow.left {
          border-right-color: white !important;
        }

        .introjs-arrow.right {
          border-left-color: white !important;
        }

        .introjs-button {
          text-shadow: none !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .introjs-nextbutton {
          background-color: #2563eb !important;
          color: white !important;
          border: none !important;
          outline: none !important;
        }

        .introjs-nextbutton:hover {
          background-color: #1d4ed8 !important;
        }

        .introjs-prevbutton {
          background-color: #e5e7eb !important;
          color: #374151 !important;
          margin-right: 8px !important;
        }

        .introjs-prevbutton:hover {
          background-color: #d1d5db !important;
        }

        .introjs-skipbutton {
          color: #6b7280 !important;
          background: transparent !important;
        }

        .introjs-skipbutton:hover {
          color: #374151 !important;
        }

        .introjs-bullets {
          text-align: center !important;
          margin-top: 12px !important;
        }

        .introjs-bullets ul {
          display: inline-flex !important;
          gap: 8px !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .introjs-bullets ul li {
          list-style: none !important;
        }

        .introjs-bullets ul li a {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background-color: #d1d5db !important;
          display: block !important;
          padding: 0 !important;
          transition: all 0.2s !important;
        }

        .introjs-bullets ul li a.active {
          background-color: #2563eb !important;
          width: 24px !important;
          border-radius: 4px !important;
        }

        .introjs-tooltiptext {
          padding: 24px !important;
          color: #1f2937 !important;
        }

        .introjs-helperLayer:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: transparent !important;
        }
      `}</style>
    </>
  );
};

export default TutorialOverlay;
