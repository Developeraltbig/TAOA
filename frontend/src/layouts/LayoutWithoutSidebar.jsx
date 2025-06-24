import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const LayoutWithoutSidebar = () => {
  const authUser = useSelector((state) => state.user.authUser);

  if (authUser) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <main className="flex-grow w-full min-h-[calc(100%-64px)] mt-[64px]">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutWithoutSidebar;
