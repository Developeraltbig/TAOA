import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser } from "../store/slices/authUserSlice";
import { X, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { setIsUserLoggingIn } from "../store/slices/loadingSlice";
import { setIsLoginModalOpen } from "../store/slices/modalsSlice";

const LoginModal = () => {
  const dispatch = useDispatch();
  const isLoginModalOpen = useSelector(
    (state) => state.modals.isLoginModalOpen
  );
  const enviroment = import.meta.env.VITE_ENV;
  const [isVisible, setIsVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const isUserLoggingIn = useSelector((state) => state.loading.isUserLoggingIn);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isUserLoggingIn) {
      dispatch(setIsLoginModalOpen(false));
    }
  };

  const handleAccountLoginClick = async (e) => {
    e.preventDefault();

    if (!validateForm() || isUserLoggingIn) {
      return;
    }

    try {
      dispatch(setIsUserLoggingIn(true));
      const response = await post("/auth/login", { ...formData });
      dispatch(setAuthUser(response.data.data));
      dispatch(setIsLoginModalOpen(false));
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      toast.error(error?.response?.data?.message || "Invalid credentials");
    } finally {
      dispatch(setIsUserLoggingIn(false));
    }
  };

  const validateEmail = () => {
    let isValid = true;
    const newErrors = { ...errors, email: "" };

    if (!formData.email) {
      newErrors.email = "Please enter your email to reset password.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleForgotPasswordClick = async (e) => {
    e.preventDefault();
    if (!validateEmail()) {
      return;
    }
    post("/auth/forgotpassword", {
      email: formData.email,
    });

    setTimeout(() => {
      toast.success(
        "If an account with that email exists, a password reset link has been sent."
      );
    }, 50);
  };

  useEffect(() => {
    if (isLoginModalOpen) {
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
        setFormData({ email: "", password: "" });
        setErrors({ email: "", password: "" });
        setShowPassword(false);
      }, 300);
    }
  }, [isLoginModalOpen]);

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

  if (!isRendering) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal"
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
        aria-labelledby="login-heading"
      >
        {/* Close Button */}
        <button
          onClick={() => dispatch(setIsLoginModalOpen(false))}
          disabled={isUserLoggingIn}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-2 hover:bg-gray-100 cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-lg">
            <LogIn size={28} className="text-white" />
          </div>
          <h2
            id="login-heading"
            className="font-bold text-3xl text-gray-800 mb-2"
          >
            Welcome Back
          </h2>
          <p className="text-gray-500">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleAccountLoginClick} className="space-y-5">
          {/* Email Field */}
          <div>
            <div
              className={`
              relative border-2 rounded-xl
              ${
                emailFocused
                  ? "border-blue-500 shadow-md"
                  : errors.email
                  ? "border-red-400"
                  : "border-gray-200 hover:border-gray-300"
              }
              
            `}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail
                  size={20}
                  className={`
                  ${
                    emailFocused
                      ? "text-blue-500"
                      : errors.email
                      ? "text-red-400"
                      : "text-gray-400"
                  }
                `}
                />
              </div>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none bg-transparent text-gray-700 placeholder-gray-400"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div
              className={`
              relative border-2 rounded-xl
              ${
                passwordFocused
                  ? "border-blue-500 shadow-md"
                  : errors.password
                  ? "border-red-400"
                  : "border-gray-200  hover:border-gray-300"
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
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none bg-transparent text-gray-700 placeholder-gray-400"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1.5 ml-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
            >
              Forgot your password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`
              w-full py-3.5 rounded-xl font-semibold flex gap-2 justify-center items-center cursor-pointer
              transition-all duration-200 transform
              ${
                isUserLoggingIn
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }
            `}
            disabled={isUserLoggingIn}
          >
            {isUserLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-t-gray-500 border-gray-300 rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={20} />
              </>
            )}
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors cursor-pointer"
                onClick={() => dispatch(setIsLoginModalOpen(false))}
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};

export default LoginModal;
