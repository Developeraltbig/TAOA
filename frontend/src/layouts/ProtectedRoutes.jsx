import { useEffect } from "react";
import {
  setShowDocket,
  setShowApplication,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
import { setDocketId } from "../store/slices/authUserSlice";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoutes = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const docketId = useSelector((state) => state.user.docketId);
  const accessingApplication = location.pathname.includes("application");
  const applicationId = useSelector((state) => state.user.applicationId);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (applicationId) {
        dispatch(
          setShowApplication({ applicationId: applicationId, showTab: true })
        );
        if (!accessingApplication && docketId) {
          dispatch(setShowDocket({ docketId: docketId, showTab: true }));
        }
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [accessingApplication, applicationId, docketId, dispatch]);

  useEffect(() => {
    if (accessingApplication && !applicationId) {
      dispatch(setDocketId(null));
    }
  }, [accessingApplication, applicationId, dispatch]);

  if (accessingApplication && !applicationId) {
    return <Navigate to="/dashboard" />;
  } else if (!accessingApplication && !docketId) {
    return <Navigate to="/application" />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
