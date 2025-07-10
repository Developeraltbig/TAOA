import {
  setDocketId,
  clearUserSlice,
  setApplicationId,
} from "../store/slices/authUserSlice";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import DocketsSection from "./DocketsSection";
import { post } from "../services/ApiEndpoint";
import {
  clearShowState,
  clearDocketState,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setIsSidebarMenuVisible } from "../store/slices/modalsSlice";
import { Clock, HelpCircle, Menu, X, Plus, FolderOpen } from "lucide-react";
import { setIsLatestApplicationLoading } from "../store/slices/loadingSlice";
import { setLatestApplication } from "../store/slices/latestApplicationsSlice";
import LatestApplicationSkeleton from "../skeletons/LatestApplicationSkeleton";

import "../styles/Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
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
  const accessingDockets =
    location.pathname.includes("onefeatures") ||
    location.pathname.includes("novelfeatures") ||
    location.pathname.includes("userinteraction") ||
    location.pathname.includes("dependentclaims") ||
    location.pathname.includes("compositeamendments") ||
    location.pathname.includes("technicalcomparison");
  const authUser = useSelector((state) => state.user.authUser);
  const applicationDockets = useSelector((state) => state.applicationDockets);
  const [isSidebarMenuRendering, setIsSidebarMenuRendering] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1024);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth <= 1536);

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
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 1024);
      setIsLargeScreen(window.innerWidth <= 1536);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchApplication();
  }, [loadLatestApplications]);

  useEffect(() => {
    if (isSmallScreen) {
      dispatch(setIsSidebarMenuVisible(false));
      setIsSidebarMenuRendering(false);
    } else if (isLargeScreen && accessingDockets) {
      dispatch(setIsSidebarMenuVisible(false));
      setIsSidebarMenuRendering(false);
    } else {
      dispatch(setIsSidebarMenuVisible(true));
      setIsSidebarMenuRendering(true);
    }
  }, [isSmallScreen, isLargeScreen, accessingDockets]);

  return (
    <>
      {/* Open Sidebar Button */}
      {!isSidebarMenuVisible && (
        <button
          className="fixed left-4 top-4 z-48 bg-white shadow-lg cursor-pointer rounded-xl p-2 hover:shadow-xl transition-all duration-200 group border border-gray-100 sidebar-toggle-btn"
          onClick={handleSidebarMenuToggle}
          aria-expanded={isSidebarMenuVisible}
          aria-controls="sidebar"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          <div
            className="
        absolute left-full ml-2 top-1/2 transform -translate-y-1/2
        sidebar-toggle-hint
        bg-gray-800 text-white text-sm rounded-lg px-3 py-2
        whitespace-nowrap z-50
        before:content-[''] before:absolute before:top-1/2 before:-left-2 before:transform before:-translate-y-1/2
        before:border-4 before:border-transparent before:border-r-gray-800
      "
          >
            Open Sidebar
          </div>
        </button>
      )}

      {/* Sidebar */}
      {isSidebarMenuRendering && (
        <aside
          id="sidebar"
          role="navigation"
          aria-label="Main navigation"
          className={`
            fixed left-0 h-[calc(100vh-64px)] w-70 bg-gradient-to-b from-gray-50 to-white shadow-2xl
            transition-all duration-300 ease-in-out z-40 overflow-hidden
            ${
              isSidebarMenuVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0"
            }
          `}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 px-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Projects
                </h2>
                <button
                  onClick={handleSidebarMenuToggle}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* New TAOA Button */}
              <button
                onClick={handleNewTAOAClick}
                className="w-full bg-gradient-to-r from-teal-500 cursor-pointer to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl py-3 px-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                aria-label="Create new TAOA project"
              >
                <Plus className="w-5 h-5" />
                New TAOA
              </button>
            </header>

            {/* Main Content */}
            <section
              className="flex-1 overflow-y-auto p-4 px-6 shrink-0"
              aria-label="Projects list"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                overflow: "auto",
              }}
            >
              {isLatestApplicationLoading ? (
                <LatestApplicationSkeleton />
              ) : latestApplication.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No projects found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {latestApplication.map((application, index) => (
                    <article
                      key={application.applicationId || index}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <DocketsSection data={application}>
                        {(toggleShowTab) => (
                          <button
                            className={`w-full p-4 transition-all duration-200 flex items-center gap-3 border-b cursor-pointer ${
                              applicationDockets?.showApplication[
                                application.applicationId
                              ]
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
                                : "hover:bg-gray-50 border-transparent"
                            }`}
                            onClick={toggleShowTab}
                            aria-expanded={
                              applicationDockets?.showApplication[
                                application.applicationId
                              ]?.showTab
                            }
                            aria-controls={`project-${application.applicationId}-content`}
                          >
                            <i
                              className={`fa-solid fa-chevron-down w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                applicationDockets?.showApplication[
                                  application.applicationId
                                ]?.showTab
                                  ? "rotate-180"
                                  : ""
                              }`}
                              aria-hidden="true"
                            />
                            <FolderOpen
                              className="w-5 h-5 text-blue-600"
                              aria-hidden="true"
                            />
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-800">
                                Project {application.applicationNumber}
                              </p>
                            </div>
                          </button>
                        )}
                      </DocketsSection>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 p-4 px-6 bg-gradient-to-b from-white to-gray-50">
              <nav aria-label="Secondary navigation">
                <ul className="space-y-2">
                  <li>
                    <button
                      className="w-full text-left px-4 py-3 rounded-lg cursor-pointer hover:bg-white hover:shadow-sm text-gray-700 transition-all duration-200 flex items-center gap-3 group border border-transparent hover:border-gray-200"
                      onClick={handleProjectHistoryClick}
                    >
                      <Clock
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">
                        Project History
                      </span>
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-3 rounded-lg cursor-pointer hover:bg-white hover:shadow-sm text-gray-700 transition-all duration-200 flex items-center gap-3 group border border-transparent hover:border-gray-200">
                      <HelpCircle
                        className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">Contact Us</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </footer>
          </div>
        </aside>
      )}

      {/* Overlay for mobile */}
      {isSmallScreen && isSidebarMenuVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={handleSidebarMenuToggle}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;
