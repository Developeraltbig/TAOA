import { useState } from "react";
import { toast } from "react-toastify";
import { post } from "../services/ApiEndpoint";
import LoginModal from "../components/LoginModal";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "../store/slices/authUserSlice";
import { setIsLoginModalOpen } from "../store/slices/modalsSlice";
import { setIsUserSigningUp } from "../store/slices/loadingSlice";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

import "../styles/Home.css";

const Home = () => {
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const isUserSigningUp = useSelector((state) => state.loading.isUserSigningUp);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
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
    const newErrors = { fullName: "", email: "", password: "" };

    if (!formData.fullName) {
      newErrors.fullName = "Name is required";
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
      isValid = false;
    }

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

  const handleAccountRegisterClick = async (e) => {
    e.preventDefault();

    if (!validateForm() || isUserSigningUp) {
      return;
    }

    try {
      dispatch(setIsUserSigningUp(true));
      const response = await post("/auth/register", { ...formData });
      dispatch(setAuthUser(response.data.data));
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      dispatch(setIsUserSigningUp(false));
    }
  };

  return (
    <>
      <main className="min-h-full w-full bg-gray-50 relative overflow-hidden content-center">
        <div className="relative z-10 min-h-full w-full p-4 md:p-6 flex items-center">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-8 items-center min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between">
              {/* Hero Section */}
              <div className="w-full min-[900px]:w-1/2 max-w-lg">
                <div className="mb-4">
                  <h1 className="font-black text-6xl md:text-7xl mb-4 text-gray-900 relative">
                    <span className="relative z-10">TAOA</span>
                    <span className="relative z-10">.ai</span>
                  </h1>
                </div>

                <p className="text-gray-700 text-lg leading-relaxed mb-10">
                  An AI-powered, one-stop app providing novelty assessments,
                  provisional and non-provisional application drafting,
                  ready-to-file USPTO forms, and Information Disclosure
                  Statements (IDS).
                </p>

                {/* Feature cards */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <i className="fa-solid fa-brain text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        AI-Powered Analysis
                      </h3>
                      <p className="text-sm text-gray-600">
                        Smart patent assessment technology
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <i className="fa-solid fa-file-contract text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        USPTO Ready
                      </h3>
                      <p className="text-sm text-gray-600">
                        Professional documentation instantly
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <i className="fa-solid fa-shield-halved text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        IP-Grade Security
                      </h3>
                      <p className="text-sm text-gray-600">
                        Your ideas stay confidential
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="w-full min-[900px]:w-1/2 max-w-lg">
                <div className="relative">
                  <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
                    {/* Form header */}
                    <div className="text-center mb-1">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
                        <i className="fa-solid fa-user-plus text-white text-2xl"></i>
                      </div>
                      <h2 className="font-bold text-3xl text-gray-900 mb-2">
                        Get Started
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                          onClick={() => dispatch(setIsLoginModalOpen(true))}
                        >
                          Sign in
                        </button>
                      </p>
                    </div>

                    <form
                      onSubmit={handleAccountRegisterClick}
                      className="space-y-5"
                    >
                      {/* Name Field */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div
                          className={`
                          relative rounded-xl border-2 transition-all duration-300
                          ${
                            nameFocused
                              ? "border-blue-500 shadow-lg shadow-blue-100"
                              : errors.fullName
                              ? "border-red-400 shadow-lg shadow-red-100"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                        >
                          <input
                            type="text"
                            name="fullName"
                            className="w-full px-4 py-3.5 rounded-xl outline-none bg-transparent placeholder-gray-400"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                            required
                          />
                          <i
                            className={`
                            absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300
                            fa-solid fa-user text-sm
                            ${
                              nameFocused
                                ? "text-blue-500 scale-110"
                                : errors.fullName
                                ? "text-red-400"
                                : "text-gray-400"
                            }
                          `}
                          ></i>
                        </div>
                        {errors.fullName && (
                          <p className="text-red-500 text-sm mt-2 ml-1 flex items-center gap-1 animate-fade-in">
                            <i className="fa-solid fa-circle-exclamation text-xs"></i>
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div
                          className={`
                          relative rounded-xl border-2 transition-all duration-300
                          ${
                            emailFocused
                              ? "border-indigo-500 shadow-lg shadow-indigo-100"
                              : errors.email
                              ? "border-red-400 shadow-lg shadow-red-100"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                        >
                          <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-3.5 rounded-xl outline-none bg-transparent placeholder-gray-400"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            required
                          />
                          <i
                            className={`
                            absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300
                            fa-solid fa-envelope text-sm
                            ${
                              emailFocused
                                ? "text-indigo-500 scale-110"
                                : errors.email
                                ? "text-red-400"
                                : "text-gray-400"
                            }
                          `}
                          ></i>
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-2 ml-1 flex items-center gap-1 animate-fade-in">
                            <i className="fa-solid fa-circle-exclamation text-xs"></i>
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Password Field */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password
                        </label>
                        <div
                          className={`
                          relative rounded-xl border-2 transition-all duration-300
                          ${
                            passwordFocused
                              ? "border-purple-500 shadow-lg shadow-purple-100"
                              : errors.password
                              ? "border-red-400 shadow-lg shadow-red-100"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                        >
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="w-full px-4 py-3.5 pr-12 rounded-xl outline-none bg-transparent placeholder-gray-400"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            <i
                              className={`fa-solid text-sm ${
                                showPassword ? "fa-eye" : "fa-eye-slash"
                              }`}
                            ></i>
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-red-500 text-sm mt-2 ml-1 flex items-center gap-1 animate-fade-in">
                            <i className="fa-solid fa-circle-exclamation text-xs"></i>
                            {errors.password}
                          </p>
                        )}
                        {passwordFocused && !errors.password && (
                          <p className="text-sm text-gray-600 mt-1.5 ml-1 transition-all duration-200">
                            <i className="fa-solid fa-info-circle mr-1"></i>
                            Password must be at least 8 characters long
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className={`
                          w-full py-3.5 rounded-xl font-semibold flex gap-2 justify-center items-center cursor-pointer
                          transition-all duration-200 transform
                          ${
                            isUserSigningUp
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                          }
                        `}
                        disabled={isUserSigningUp}
                      >
                        {isUserSigningUp ? (
                          <span className="relative flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-t-gray-500 border-gray-300 rounded-full animate-spin"></div>
                            Creating your account...
                          </span>
                        ) : (
                          <span className="relative flex items-center justify-center gap-2">
                            Create Free Account
                            <i className="fa-solid fa-arrow-right text-sm group-hover:translate-x-1 transition-transform duration-300"></i>
                          </span>
                        )}
                      </button>
                    </form>

                    {/* Terms */}
                    <p className="text-xs text-gray-500 text-center mt-6">
                      By continuing, you agree to our{" "}
                      <a
                        href="#"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        Terms
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LoginModal />
      <ForgotPasswordModal />
    </>
  );
};

export default Home;
