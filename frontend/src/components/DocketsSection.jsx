import TabsSection from "./TabsSection";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearDocketState,
  setShowApplication,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardX, ChevronRight } from "lucide-react";
import { setIsSidebarMenuVisible } from "../store/slices/modalsSlice";
import { setDocketId, setApplicationId } from "../store/slices/authUserSlice";

const formatClaims = (claims = []) => {
  if (!Array.isArray(claims) || claims.length === 0) {
    return "";
  }

  return claims
    .reduce((result, num, index, arr) => {
      const isFirst = index === 0 || num - arr[index - 1] > 1;
      const isLast = index === arr.length - 1 || arr[index + 1] - num > 1;

      if (isFirst && isLast) {
        result.push(num.toString());
      } else if (isFirst) {
        result.push(num.toString());
      } else if (isLast) {
        const lastRangeStart = result[result.length - 1];
        if (!lastRangeStart.includes("-")) {
          result[result.length - 1] = `${lastRangeStart}-${num}`;
        }
      }
      return result;
    }, [])
    .join(", ");
};

const DocketsSection = ({ data, children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const showApplication = useSelector(
    (state) => state.applicationDockets?.showApplication[data.applicationId]
  );
  const applicationDockets = useSelector((state) => state.applicationDockets);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

  const currentApplicationDocuments = useSelector(
    (state) => state.user.applicationDocuments[data.applicationId]
  );
  const isClaimsUploading =
    currentApplicationDocuments?.isSubjectClaimsUploading;
  const isSubjectDescriptionFetching =
    currentApplicationDocuments?.isSubjectDescriptionFetching;
  const isPriorDescriptionFetching =
    currentApplicationDocuments?.isPriorArtDescriptionFetching;

  const toggleShowTab = () => {
    dispatch(
      setShowApplication({
        applicationId: data.applicationId,
        showTab:
          showApplication?.showTab !== undefined
            ? !showApplication.showTab
            : true,
      })
    );
    dispatch(clearDocketState());
    dispatch(setApplicationId(data.applicationId));
    dispatch(setDocketId(null));
    navigate("/application");
    if (isSmallScreen) {
      dispatch(setIsSidebarMenuVisible(false));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {children && children(toggleShowTab)}
      {showApplication?.showTab && data.dockets && (
        <div
          id={`project-${data.applicationId}-content`}
          className="p-2"
          role="region"
          aria-label={`Claims for project ${data.applicationNumber}`}
        >
          {data?.dockets?.map((docket, index) => {
            const docketId = docket._id;
            const isLastDocket = index === data.dockets.length - 1;

            return (
              <section
                key={docketId}
                className={`${!isLastDocket ? "mb-2" : ""}`}
                aria-label={`Claim ${docket.rejectionType}`}
              >
                <TabsSection data={docket}>
                  {(toggleShowDocketTab) => (
                    <button
                      className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                        applicationDockets?.showDocket[docketId]
                          ? "bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={toggleShowDocketTab}
                      disabled={
                        isClaimsUploading ||
                        isPriorDescriptionFetching ||
                        isSubjectDescriptionFetching
                      }
                      aria-expanded={
                        applicationDockets?.showDocket[docketId]?.showTab
                      }
                      aria-controls={`docket-${docketId}-tabs`}
                      aria-label={`Toggle tabs for claim ${docket.rejectionType}`}
                    >
                      <ChevronRight
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          applicationDockets?.showDocket[docketId]?.showTab
                            ? "rotate-90"
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                      <div className="flex-1 text-left min-w-0 flex items-center gap-2 text-gray-700">
                        <ClipboardX className="w-4.5 h-4.5 shrink-0" />
                        <p className="text-sm font-medium truncate">
                          § {docket.rejectionType} - CLM(
                          {formatClaims(docket.rejectedClaims)})
                        </p>
                      </div>
                    </button>
                  )}
                </TabsSection>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
};

export default DocketsSection;
