import { Sparkle } from "lucide-react";
import DocketsActionButtons from "./DocketsActionButton";

const DocketsContentPanel = ({
  title,
  children,
  onDownload,
  onFinalize,
  onRegenerate,
  onFullScreen,
  headerContent,
  isClaimsLoading,
  isClaimsFinalized,
}) => {
  return (
    <div className="border-2 border-gray-400 rounded-lg bg-gray-50 h-full flex flex-col relative p-4">
      <div className="w-fit absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 bg-gray-50 p-2">
        <span className="text-gray-400">
          <Sparkle size={35} />
        </span>
      </div>

      <div className="w-fit absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-gray-50 p-2">
        <span className="text-gray-400">
          <Sparkle size={35} />
        </span>
      </div>

      {(title || headerContent) && (
        <div className="absolute top-0 right-5 sm:right-15 -translate-y-1/2">
          {headerContent && (
            <div className="flex items-center gap-3">{headerContent}</div>
          )}
          {title && (
            <div className="h-[2.35rem] flex items-center justify-center px-4 rounded-md border border-gray-300 bg-gray-100">
              <h3 className="font-medium text-gray-700">{title}</h3>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 p-4 h-full">{children}</div>

      <div className="absolute bottom-0 left-5 sm:left-15 translate-y-1/2">
        <DocketsActionButtons
          onDownload={onDownload}
          onFinalize={onFinalize}
          onRegenerate={onRegenerate}
          onFullScreen={onFullScreen}
          isClaimsLoading={isClaimsLoading}
          isClaimsFinalized={isClaimsFinalized}
        />
      </div>
    </div>
  );
};

export default DocketsContentPanel;
