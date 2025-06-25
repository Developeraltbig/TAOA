import { useEffect, useRef } from "react";
import { X, Download, Search } from "lucide-react";

const FullScreenTable = ({ isOpen, onClose, tableData, tableHeading }) => {
  const fullScreenRef = useRef(null);

  useEffect(() => {
    const elem = fullScreenRef.current;

    const enterFullScreen = () => {
      if (elem) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
    };

    const exitFullScreen = () => {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };

    const handleFullScreenChange = () => {
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement
      ) {
        if (isOpen) {
          onClose();
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown);

    if (isOpen) {
      const timeoutId = setTimeout(enterFullScreen, 50);
      return () => clearTimeout(timeoutId);
    } else {
      exitFullScreen();
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDownload = (e) => {
    e.preventDefault();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={fullScreenRef}
      className="bg-gradient-to-br from-slate-50 to-blue-50 w-full h-full flex flex-col absolute inset-0 z-[9999]"
    >
      <div className="relative bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="flex justify-between items-center px-8 py-4">
          <h2 className="text-xl font-semibold text-gray-700 tracking-wide">
            {tableHeading}
          </h2>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="p-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 text-gray-600 hover:text-blue-600 cursor-pointer rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 border border-gray-200/50 hover:border-blue-300/50"
              title="Download Table"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-gradient-to-r from-rose-500/10 to-red-500/10 hover:from-rose-500/20 hover:to-red-500/20 text-gray-600 hover:text-red-600 cursor-pointer rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 border border-gray-200/50 hover:border-red-300/50 group"
              title="Close Fullscreen (ESC)"
            >
              <X
                size={18}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
            </button>
          </div>
        </div>

        {/* Subtle decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/40 to-transparent"></div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex justify-center">
        {tableData && tableData.length > 0 ? (
          <div className="w-full max-w-7xl">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0284c7] to-[#0369a1]">
                    <th className="py-4 px-6 text-lg font-bold text-white border-r border-blue-400/30 relative">
                      <div className="flex items-center justify-center space-x-2">
                        <span>Subject Application</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    </th>
                    <th className="py-4 px-6 text-lg font-bold text-white border-r border-blue-400/30 relative">
                      <div className="flex items-center justify-center space-x-2">
                        <span>Prior Art</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    </th>
                    <th className="py-4 px-6 text-lg font-bold text-white relative">
                      <div className="flex items-center justify-center space-x-2">
                        <span>Differentiating Feature</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((comparison, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 transition-all duration-200 hover:bg-blue-50/50 hover:shadow-md group ${
                        index % 2 === 0
                          ? "bg-gradient-to-r from-gray-50/50 to-blue-50/30"
                          : "bg-white"
                      }`}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800 border-r border-gray-100 text-left align-top relative group-hover:text-gray-900">
                        <div className="leading-relaxed">
                          {comparison.subjectApplication}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800 border-r border-gray-100 text-left align-top relative group-hover:text-gray-900">
                        <div className="leading-relaxed">
                          {comparison.priorArt}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800 text-left align-top relative group-hover:text-gray-900">
                        <div className="leading-relaxed">
                          {comparison.differentiatingFeature}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Footer Info */}
            <div className="mt-6 flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-gradient-to-r from-[#0284c7] to-[#0369a1] rounded-full"></div>
              <span>Total Comparisons: {tableData.length}</span>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-center max-w-md h-fit">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-500">
              There are no table comparisons to display at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenTable;
