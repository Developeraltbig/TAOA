import {
  setIsLoginModalOpen,
  setResetPasswordToken,
  setIsForgotPasswordModalOpen,
} from "../store/slices/modalsSlice";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { useSelector, useDispatch } from "react-redux";
import { X, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

const ForgotPasswordModal = () => {
  const dispatch = useDispatch();

  const isForgotPasswordModalOpen = useSelector(
    (state) => state.modals.isForgotPasswordModalOpen
  );

  const enviroment = import.meta.env.VITE_ENV;

  const [errors, setErrors] = useState({});
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = useSelector((state) => state.modals.resetPasswordToken);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      dispatch(setIsForgotPasswordModalOpen(false));
      dispatch(setResetPasswordToken(null));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm() || loading) {
      return;
    }

    try {
      setLoading(true);
      await post("/auth/resetpassword", {
        token,
        newPassword: password,
      });

      toast.success("Password has been reset successfully!");
      dispatch(setIsForgotPasswordModalOpen(false));
      dispatch(setResetPasswordToken(null));
      dispatch(setIsLoginModalOpen(true));
    } catch (error) {
      if (enviroment === "development") {
        console.error("Password reset error:", error);
      }
      if (error?.response?.data?.message.includes("Please request a new one")) {
        toast.error(
          "Password reset token is invalid or has expired. Please request a new one."
        );
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isForgotPasswordModalOpen) {
      setIsRendering(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setIsRendering(false);
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
      }, 100);
    }
  }, [isForgotPasswordModalOpen]);

  useEffect(() => {
    if (isVisible) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isVisible]);

  useEffect(() => {
    if (!token) {
      dispatch(setIsForgotPasswordModalOpen(false));
    }
  }, [token]);

  if (!isRendering) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-modal"
    >
      <section
        className={`
          relative bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md
          transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }
        `}
        aria-labelledby="reset-password-heading"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            dispatch(setIsForgotPasswordModalOpen(false));
            dispatch(setResetPasswordToken(null));
          }}
          disabled={loading}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-2 hover:bg-gray-100 cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
            <KeyRound size={28} className="text-white" />
          </div>
          <h2
            id="reset-password-heading"
            className="font-bold text-3xl text-gray-800 mb-2"
          >
            Reset Your Password
          </h2>
          <p className="text-gray-500">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password
            </label>
            <div
              className={`
                relative border-2 rounded-xl
                ${
                  passwordFocused
                    ? "border-blue-500 shadow-md"
                    : errors.password
                    ? "border-red-400"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock
                  size={20}
                  className={`
                    ${
                      passwordFocused
                        ? "text-blue-500"
                        : errors.password
                        ? "text-red-400"
                        : "text-gray-400"
                    }
                  `}
                />
              </div>
              <input
                id="resetpassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none bg-transparent text-gray-700 placeholder-gray-400"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <div
              className={`
                relative border-2 rounded-xl
                ${
                  confirmPasswordFocused
                    ? "border-blue-500 shadow-md"
                    : errors.confirmPassword
                    ? "border-red-400"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock
                  size={20}
                  className={`
                    ${
                      confirmPasswordFocused
                        ? "text-blue-500"
                        : errors.confirmPassword
                        ? "text-red-400"
                        : "text-gray-400"
                    }
                  `}
                />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none bg-transparent text-gray-700 placeholder-gray-400"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.confirmPassword}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1.5 ml-1 transition-all duration-200">
              <i className="fa-solid fa-info-circle mr-1"></i>
              Password must be at least 8 characters long
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`
              w-full py-3.5 rounded-xl font-semibold flex gap-2 justify-center items-center cursor-pointer
              transition-all duration-200 transform
              ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }
            `}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-t-gray-500 border-gray-300 rounded-full animate-spin"></div>
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <KeyRound size={20} />
              </>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600">
              Remember your password?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors cursor-pointer"
                onClick={() => {
                  dispatch(setIsForgotPasswordModalOpen(false));
                  dispatch(setResetPasswordToken(null));
                  dispatch(setIsLoginModalOpen(true));
                }}
              >
                Back to Login
              </button>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ForgotPasswordModal;
