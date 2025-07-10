import {
  Gem,
  Goal,
  Scale,
  Network,
  Combine,
  MessagesSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setDocketId } from "../store/slices/authUserSlice";
import { setIsSidebarMenuVisible } from "../store/slices/modalsSlice";
import { setShowDocket } from "../store/slices/applicationDocketsSlice";

const TabsSection = ({ data, children }) => {
  const classStyle = "w-5 h-5";
  const tabs = [
    {
      href: "/technicalcomparison",
      tabName: "Technical Comparison",
      icon: <Scale className={classStyle} />,
    },
    {
      href: "/novelfeatures",
      tabName: "Novel Features",
      icon: <Gem className={classStyle} />,
    },
    {
      href: "/dependentclaims",
      tabName: "Dependent Claims",
      icon: <Network className={classStyle} />,
    },
    {
      href: "/onefeatures",
      tabName: "One Features",
      icon: <Goal className={classStyle} />,
    },
    {
      href: "/compositeamendments",
      tabName: "Composite Amendments",
      icon: <Combine className={classStyle} />,
    },
    {
      href: "/userinteraction",
      tabName: "User Interaction",
      icon: <MessagesSquare className={classStyle} />,
    },
  ];

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const showDocket = useSelector(
    (state) => state.applicationDockets?.showDocket[data._id]
  );
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1536);

  const currentApplicationDocuments = useSelector(
    (state) => state.user.applicationDocuments[data.applicationId]
  );
  const isClaimsUploading =
    currentApplicationDocuments?.isSubjectClaimsUploading;
  const isSubjectDescriptionFetching =
    currentApplicationDocuments?.isSubjectDescriptionFetching;
  const isPriorDescriptionFetching =
    currentApplicationDocuments?.isPriorArtDescriptionFetching;

  const toggleShowDocketTab = () => {
    dispatch(
      setShowDocket({
        docketId: data._id,
        showTab: showDocket?.showTab !== undefined ? !showDocket.showTab : true,
      })
    );
    dispatch(setDocketId(data._id));
    if (location.pathname.includes("application")) {
      navigate("/technicalcomparison");
    }
    if (isSmallScreen) {
      dispatch(setIsSidebarMenuVisible(false));
    }
  };

  const handleTabClick = (e, path) => {
    e.preventDefault();
    navigate(path);
    if (isSmallScreen) {
      dispatch(setIsSidebarMenuVisible(false));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 1536);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {children && children(toggleShowDocketTab)}
      {showDocket?.showTab && (
        <nav
          id={`docket-${data._id}-tabs`}
          className="ml-4 mt-1 space-y-0.5"
          role="navigation"
          aria-label={`Navigation tabs for claim ${data.rejectionType}`}
        >
          <ul className="space-y-0.5">
            {tabs.map((tab, index) => {
              const isActive = location.pathname.includes(tab.href);
              const tabId = `${data._id}-${tab.href.substring(1)}`;

              return (
                <li key={tabId}>
                  <button
                    onClick={(e) => handleTabClick(e, tab.href)}
                    className={`w-full rounded-lg px-3 py-2 text-xs transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
                      isActive
                        ? "bg-[#3586cb] text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                    disabled={
                      isClaimsUploading ||
                      isPriorDescriptionFetching ||
                      isSubjectDescriptionFetching
                    }
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`${tab.tabName} ${isActive ? "(current)" : ""}`}
                  >
                    <span
                      className={isActive ? "text-gray-100" : "text-gray-500"}
                      aria-hidden="true"
                    >
                      {tab.icon}
                    </span>
                    <span className="text-left font-medium">{tab.tabName}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
};

export default TabsSection;
