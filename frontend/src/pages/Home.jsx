import { useState } from "react";
import { toast } from "react-toastify";
import { post } from "../services/ApiEndpoint";
import LoginModal from "../components/LoginModal";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "../store/slices/authUserSlice";
import { setIsLoginModalOpen } from "../store/slices/modalsSlice";
import { setIsUserSigningUp } from "../store/slices/loadingSlice";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

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
      <main className="min-h-full w-full p-3 content-center">
        <div className="w-full">
          <div className="flex flex-col gap-6 items-center shrink-0 md:items-start md:flex-row md:justify-around">
            <div className="w-full h-fit max-w-lg">
              <h1 className="font-bold text-5xl md:text-6xl mb-3">TAOA.ai</h1>
              <p className="text-[#504d4d] max-w-sm text-lg">
                An AI-powered, one-stop app providing novelty assessments,
                provisional and non-provisional application drafting,
                ready-to-file USPTO forms, and Information Disclosure Statements
                (IDS).
              </p>
            </div>

            <section
              aria-labelledby="form-heading"
              className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-12 py-8 w-full max-w-lg h-fit shadow-2xl border border-blue-50"
            >
              <h2
                id="form-heading"
                className="font-bold text-2xl mb-1 text-center"
              >
                Create new Account
              </h2>

              <div className="flex gap-2 text-md justify-center mb-4">
                <h6>Already registered? </h6>
                <button
                  type="button"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={() => dispatch(setIsLoginModalOpen(true))}
                >
                  Log In
                </button>
              </div>

              <form onSubmit={handleAccountRegisterClick} className="space-y-4">
                {/* Name Field */}
                <div>
                  <div
                    className={`
                    border-2 flex gap-2 items-center p-3 rounded-xl
                    ${
                      nameFocused
                        ? "border-blue-500 shadow-md"
                        : errors.fullName
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                  >
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Name"
                      className="flex-grow outline-none bg-transparent"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      required
                    />
                    <i
                      className={`
                      fa-solid fa-user
                      ${
                        nameFocused
                          ? "text-blue-500"
                          : errors.fullName
                          ? "text-red-400"
                          : "text-gray-400"
                      }
                    `}
                    ></i>
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1.5 ml-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <div
                    className={`
                    border-2 flex gap-2 items-center p-3 rounded-xl
                    ${
                      emailFocused
                        ? "border-blue-500 shadow-md"
                        : errors.email
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    }
                    
                  `}
                  >
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      className="flex-grow outline-none bg-transparent"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                    />
                    <i
                      className={`
                      fa-solid fa-envelope
                      ${
                        emailFocused
                          ? "text-blue-500"
                          : errors.email
                          ? "text-red-400"
                          : "text-gray-400"
                      }
                    `}
                    ></i>
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1.5 ml-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div
                    className={`
                    border-2 flex gap-2 items-center p-3 rounded-xl
                    ${
                      passwordFocused
                        ? "border-blue-500 shadow-md"
                        : errors.password
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                  >
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="flex-grow outline-none bg-transparent"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <i
                        className={`fa-solid ${
                          showPassword ? "fa-eye" : "fa-eye-slash"
                        }`}
                      ></i>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1.5 ml-1">
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

                <button
                  type="submit"
                  className={`
                    w-full py-3.5 rounded-xl font-semibold flex gap-2 justify-center items-center cursor-pointer
                    transition-all duration-200 transform mt-6
                    ${
                      isUserSigningUp
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    }
                  `}
                  disabled={isUserSigningUp}
                >
                  {isUserSigningUp ? (
                    <>
                      <div className="w-6 h-6 border-4 border-t-blue-900 border-gray-50 rounded-full animate-spin"></div>
                      <span>Signing Up...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          <div className="flex justify-center md:justify-around mt-2">
            <div className="flex items-center gap-2 w-full max-w-lg font-semibold text-[#504d4d] pb-4">
              <span>----</span>
              <a href="#" className="hover:underline">
                Privacy policy
              </a>
              <span>----</span>
              <a href="#" className="hover:underline">
                Terms of use
              </a>
            </div>
            <div className="w-full max-w-lg hidden md:block md:invisible"></div>
          </div>
        </div>
      </main>

      <LoginModal />
      <ForgotPasswordModal />
    </>
  );
};

export default Home;
