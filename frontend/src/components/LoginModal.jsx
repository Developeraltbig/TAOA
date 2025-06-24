import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser } from "../store/slices/authUserSlice";
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
  const isUserLoggingIn = useSelector((state) => state.loading.isUserLoggingIn);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isUserLoggingIn) {
      dispatch(setIsLoginModalOpen(false));
    }
  };

  const handleAccountLoginClick = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error("Please fill all the fields");
    } else if (formData.password.length < 8) {
      return toast.error("Invalid credentials");
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
      toast.error(error?.response?.data?.message);
    } finally {
      dispatch(setIsUserLoggingIn(false));
    }
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
      setTimeout(() => setIsRendering(false), 300);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal"
    >
      <section
        className={`
          relative bg-slate-50 rounded-lg shadow-xl p-10 w-full max-w-3xl
          transform transition-all duration-300
          ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-16 scale-95"
          }
        `}
        aria-labelledby="login-heading"
      >
        <button
          aria-label="Close login modal"
          className="absolute top-2.5 right-4 px-2 py-1 rounded-md border-3 border-transparent focus:border-[#38b6ff] cursor-pointer"
          onClick={() => dispatch(setIsLoginModalOpen(false))}
          disabled={isUserLoggingIn}
        >
          <i className="fa-solid fa-x"></i>
        </button>

        <h2 id="login-heading" className="font-bold text-3xl mb-6 text-center">
          Login
        </h2>

        <form onSubmit={handleAccountLoginClick}>
          <div className="border border-black flex gap-2 items-center p-3 rounded-xl mb-4">
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email"
              className="flex-grow outline-none"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <i className="fa-solid fa-envelope"></i>
          </div>

          <div className="border border-black flex gap-2 items-center p-3 rounded-xl mb-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="flex-grow outline-none bg-transparent"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye" : "fa-eye-slash"
                }`}
              ></i>
            </button>
          </div>

          <div className="mb-4 text-right">
            <a href="#" className="text-blue-600 hover:underline">
              Forgot your password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full p-2 rounded-xl bg-[#38b6ff] hover:bg-blue-400 font-semibold flex gap-2 justify-center items-center cursor-pointer text-gray-950"
            disabled={isUserLoggingIn}
          >
            {isUserLoggingIn ? (
              <>
                <div className="w-6 h-6 border-4 border-t-blue-900 border-gray-50 rounded-full animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>LOGIN</span>
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
};

export default LoginModal;
