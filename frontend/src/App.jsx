import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OneFeatures from "./pages/OneFeatures";
import Application from "./pages/Application";
import { ToastContainer } from "react-toastify";
import NovelFeatures from "./pages/NovelFeatures";
import SidebarLayout from "./layouts/SidebarLayout";
import DependentClaims from "./pages/DependentClaims";
import UserInteraction from "./pages/UserInteraction";
import ProtectedRoutes from "./layouts/ProtectedRoutes";
import CompositeAmendments from "./pages/CompositeAmendments";
import TechnicalComparison from "./pages/TechnicalComparison";
import ApplicationsHistory from "./pages/ApplicationsHistory";
import LayoutWithoutSidebar from "./layouts/LayoutWithoutSidebar";

import "./App.css";
import ResetPassword from "./components/ResetPassword";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LayoutWithoutSidebar />}>
          <Route index element={<Home />} />
        </Route>

        <Route element={<SidebarLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="history" element={<ApplicationsHistory />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="application" element={<Application />} />
            <Route
              path="technicalcomparison"
              element={<TechnicalComparison />}
            />
            <Route path="novelfeatures" element={<NovelFeatures />} />
            <Route path="dependentclaims" element={<DependentClaims />} />
            <Route
              path="compositeamendments"
              element={<CompositeAmendments />}
            />
            <Route path="onefeatures" element={<OneFeatures />} />
            <Route path="userinteraction" element={<UserInteraction />} />
          </Route>
        </Route>

        <Route path="/resetpassword/:token" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        draggable={false}
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;
