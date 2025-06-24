import {
  setDocketId,
  clearUserSlice,
  setApplicationId,
} from "../store/slices/authUserSlice";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import DocketsSection from "./DocketsSection";
import { useNavigate } from "react-router-dom";
import { post } from "../services/ApiEndpoint";
import {
  clearShowState,
  clearDocketState,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
import { setIsSidebarMenuVisible } from "../store/slices/modalsSlice";
import { setIsLatestApplicationLoading } from "../store/slices/loadingSlice";
import { setLatestApplication } from "../store/slices/latestApplicationsSlice";
import LatestApplicationSkeleton from "../skeletons/LatestApplicationSkeleton";

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const isSidebarMenuVisible = useSelector(
    (state) => state.modals.isSidebarMenuVisible
  );
  const loadLatestApplications = useSelector(
    (state) => state.loading.loadLatestApplications
  );
  const latestApplication = useSelector(
    (state) => state.applications.latestApplication
  );
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const authUser = useSelector((state) => state.user.authUser);
  const applicationDockets = useSelector((state) => state.applicationDockets);
  const [isSidebarMenuRendering, setIsSidebarMenuRendering] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);

  const handleSidebarMenuToggle = () => {
    if (!isSidebarMenuVisible) {
      setIsSidebarMenuRendering(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dispatch(setIsSidebarMenuVisible(true));
        });
      });
    } else {
      dispatch(setIsSidebarMenuVisible(false));
      setTimeout(() => setIsSidebarMenuRendering(false), 150);
    }
  };

  const handleNewTAOAClick = (e) => {
    e.preventDefault();
    dispatch(clearShowState());
    dispatch(setDocketId(null));
    dispatch(setApplicationId(null));
    navigate("/dashboard");
    if (isSmallScreen) {
      dispatch(setIsSidebarMenuVisible(false));
    }
  };

  const fetchApplication = async () => {
    try {
      dispatch(setIsLatestApplicationLoading(true));
      const response = await post("/application/fetchLatestThreeApplication", {
        token: authUser.token,
      });
      dispatch(setLatestApplication(response.data.data));
      if (response.data.data.length === 0) {
        dispatch(setApplicationId(null));
        dispatch(setDocketId(null));
        dispatch(clearShowState());
      }
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        const message = error?.response?.data?.message;
        toast.error(message);
      }
      dispatch(setLatestApplication([]));
      dispatch(setDocketId(null));
      dispatch(setApplicationId(null));
      dispatch(clearShowState());
    } finally {
      dispatch(setIsLatestApplicationLoading(false));
    }
  };

  const handleProjectHistoryClick = (e) => {
    e.preventDefault();
    dispatch(clearShowState());
    navigate("/history");
    if (isSmallScreen) {
      dispatch(setIsSidebarMenuVisible(false));
    }
  };

  useEffect(() => {
    const isMediumScreen = window.matchMedia("(min-width: 1024px)").matches;
    if (isMediumScreen) {
      // For md and above, sidebar should be open initially
      dispatch(setIsSidebarMenuVisible(true));
      setIsSidebarMenuRendering(true);
    } else {
      // For smaller screens, sidebar should be closed initially
      dispatch(setIsSidebarMenuVisible(false));
      setIsSidebarMenuRendering(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchApplication();
  }, [loadLatestApplications]);

  return (
    <>
      {/* Open Sidebar Button */}
      {!isSidebarMenuVisible && (
        <div className="inline-block absolute top-3 left-5 z-40">
          <button
            className="text-xl px-3 py-[6px] bg-white shadow-md rounded-md z-50 cursor-pointer tooltip-trigger"
            onClick={handleSidebarMenuToggle}
            aria-expanded={isSidebarMenuVisible}
            aria-controls="sidebar"
          >
            <i className="fa-solid fa-indent"></i>
          </button>
          <div
            className="
              absolute left-full ml-2 top-1/2 transform -translate-y-1/2
              opacity-0 tooltip-content
              transition-opacity duration-300
              bg-gray-800 text-white text-sm rounded-lg px-3 py-2
              whitespace-nowrap z-50
              before:content-[''] before:absolute before:top-1/2 before:-left-2 before:transform before:-translate-y-1/2
              before:border-4 before:border-transparent before:border-r-gray-800
            "
          >
            Open Sidebar
          </div>
        </div>
      )}

      {/* Sidebar */}
      {isSidebarMenuRendering && (
        <div
          id="sidebar"
          className={`
            fixed left-0 h-full w-70 bg-slate-50 shadow-md px-6 pt-2 pb-3 text-black
            transition-all duration-150 ease-in-out z-40 overflow-y-auto overflow-x-hidden
            ${
              isSidebarMenuVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0"
            }
          `}
        >
          {/* Close Sidebar Button */}
          <div className="inline-block sticky top-3 left-full z-50">
            <button
              className="text-xl px-3 py-[6px] bg-white shadow-md rounded-md z-50 cursor-pointer tooltip-trigger"
              onClick={handleSidebarMenuToggle}
              aria-expanded={isSidebarMenuVisible}
              aria-controls="sidebar"
            >
              <i className="fa-solid fa-outdent"></i>
            </button>
            <div
              className="
                absolute right-full mr-2 top-1/2 transform -translate-y-1/2
                opacity-0 tooltip-content
                transition-opacity duration-300
                bg-gray-800 text-white text-sm rounded-lg px-3 py-2
                whitespace-nowrap z-500
                before:content-[''] before:absolute before:top-1/2 before:-right-2 before:transform before:-translate-y-1/2
                before:border-4 before:border-transparent before:border-l-gray-800
              "
            >
              Close Sidebar
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="w-full mt-7 mb-18 flex flex-col justify-between min-h-[calc(100%-140px)]">
            <div className="flex flex-col gap-4">
              <button
                onClick={handleNewTAOAClick}
                className="py-2 px-6 w-fit rounded-full flex items-center gap-2 font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white cursor-pointer"
              >
                <i className="fa-solid fa-plus"></i>New TAOA
              </button>
              {isLatestApplicationLoading ? (
                <LatestApplicationSkeleton />
              ) : latestApplication.length === 0 ? (
                <span className="py-2 px-4 w-full rounded-lg font-bold text-lg overflow-hidden text-center">
                  No projects found
                </span>
              ) : (
                <>
                  {latestApplication.length > 0 && (
                    <div className="space-y-3">
                      {latestApplication.map((application, index) => (
                        <div key={index} className="space-y-1">
                          <DocketsSection data={application}>
                            {(toggleShowTab) => (
                              <button
                                className={`py-2 px-4 w-full rounded-lg cursor-pointer flex items-center gap-2 font-bold overflow-hidden ${
                                  applicationDockets?.showApplication[
                                    application.applicationId
                                  ]
                                    ? "bg-gradient-to-r from-[#44b9ff] to-[#3586cb] text-white"
                                    : "bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] border border-gray-300"
                                }`}
                                onClick={toggleShowTab}
                              >
                                <span
                                  className={`transition-transform duration-300 ease-in-out ${
                                    applicationDockets?.showApplication[
                                      application.applicationId
                                    ]?.showTab
                                      ? "rotate-180"
                                      : "rotate-0"
                                  }`}
                                >
                                  <i className="fa-solid fa-chevron-down"></i>
                                </span>
                                <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                  Project {application.applicationNumber}
                                </span>
                              </button>
                            )}
                          </DocketsSection>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col gap-3 items-start mt-4">
              <button
                className="cursor-pointer flex items-center gap-2 text-[#504d4d] font-bold"
                onClick={handleProjectHistoryClick}
              >
                <i className="fa-solid fa-code"></i>Project History
              </button>
              <button className="cursor-pointer flex items-center gap-2 text-[#504d4d] font-bold">
                <i className="fa-solid fa-paperclip"></i>Contact Us
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
