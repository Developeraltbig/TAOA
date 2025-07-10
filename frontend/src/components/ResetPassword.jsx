import {
  setResetPasswordToken,
  setIsForgotPasswordModalOpen,
} from "../store/slices/modalsSlice";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { get } from "../services/ApiEndpoint";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isTokenValid, setIsTokenValid] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await get(`/auth/verify-reset-token/${token}`);
        setIsTokenValid(true);
      } catch (error) {
        setIsTokenValid(false);
        let errorMessage =
          "Invalid or password reset link expired. Please request a new one.";
        toast.error(errorMessage);
        navigate("/");
      } finally {
        setInitialLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      navigate("/");
      setInitialLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (isTokenValid) {
      navigate("/");
      dispatch(setResetPasswordToken(token));
      dispatch(setIsForgotPasswordModalOpen(true));
    }
  }, [isTokenValid]);

  return (
    <>
      {initialLoading && (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
};

export default ResetPassword;
