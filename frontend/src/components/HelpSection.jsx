import { Info } from "lucide-react";

const HelpSection = ({ onTutorialClick }) => {
  return (
    <div className="mt-8 bg-blue-100 rounded-xl p-6 animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Info className="text-blue-600" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-800 mb-3">
            Our workflow guides you through each step of responding to an office
            action. Documents are fetched automatically for first-time
            rejections, while subsequent rejections require manual claim
            uploads.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onTutorialClick}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View Tutorial
            </button>
            <span className="text-blue-300">•</span>
            <button className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors cursor-pointer">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
