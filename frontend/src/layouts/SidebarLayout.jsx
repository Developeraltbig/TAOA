import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import { Navigate, Outlet } from "react-router-dom";

const SidebarLayout = () => {
  const authUser = useSelector((state) => state.user.authUser);
  const isSidebarMenuVisible = useSelector(
    (state) => state.modals.isSidebarMenuVisible
  );

  if (!authUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <main className="flex-grow w-full flex relative min-h-[calc(100%-64px)] mt-[64px]">
        <div className={`${isSidebarMenuVisible ? "lg:w-70 lg:shrink-0" : ""}`}>
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
