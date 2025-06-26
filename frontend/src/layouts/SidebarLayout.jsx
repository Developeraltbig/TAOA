import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const SidebarLayout = () => {
  const location = useLocation();
  const isSidebarMenuVisible = useSelector(
    (state) => state.modals.isSidebarMenuVisible
  );
  const authUser = useSelector((state) => state.user.authUser);
  const accessingDockets =
    location.pathname.includes("technicalcomparison") ||
    location.pathname.includes("novelfeatures") ||
    location.pathname.includes("compositeamendments") ||
    location.pathname.includes("onefeatures") ||
    location.pathname.includes("userinteraction") ||
    location.pathname.includes("dependentclaims");

  if (!authUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <main className="flex-grow w-full flex relative min-h-[calc(100%-64px)] mt-[64px]">
        <div
          className={`${
            isSidebarMenuVisible
              ? !accessingDockets
                ? "w-0 lg:w-70 lg:shrink-0"
                : "w-0 2xl:w-70 2xl:shrink-0"
              : "w-0"
          }`}
        >
          <Sidebar />
        </div>
        <div className="flex-grow">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
