import TabsSection from "./TabsSection";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearDocketState,
  setShowApplication,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
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
      {showApplication?.showTab && (
        <aside className="space-y-1 pl-2">
          {data?.dockets?.map((docket, index) => {
            return (
              <div key={index} className="space-y-1">
                <TabsSection data={docket}>
                  {(toggleShowDocketTab) => (
                    <button
                      key={index}
                      className={`py-1 px-4 w-full rounded-lg cursor-pointer flex items-center gap-2 font-bold overflow-hidden ${
                        applicationDockets?.showDocket[docket._id]
                          ? "bg-[#0d9488] text-white"
                          : "bg-gradient-to-r from-[#eef7ff] to-[#f3fff3] border border-gray-300"
                      }`}
                      onClick={toggleShowDocketTab}
                      disabled={
                        isClaimsUploading ||
                        isPriorDescriptionFetching ||
                        isSubjectDescriptionFetching
                      }
                    >
                      <span
                        className={`transition-transform duration-300 ease-in-out ${
                          applicationDockets?.showDocket[docket._id]?.showTab
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      >
                        <i className="fa-solid fa-chevron-down"></i>
                      </span>
                      <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                        § {docket.rejectionType} - CLM(
                        {formatClaims(docket.rejectedClaims)})
                      </span>
                    </button>
                  )}
                </TabsSection>
              </div>
            );
          })}
        </aside>
      )}
    </>
  );
};

export default DocketsSection;
