import { useState } from "react";
import { toast } from "react-toastify";
import { post } from "../services/ApiEndpoint";
import LoginModal from "../components/LoginModal";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "../store/slices/authUserSlice";
import { setIsLoginModalOpen } from "../store/slices/modalsSlice";
import { setIsUserSigningUp } from "../store/slices/loadingSlice";

const Home = () => {
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const [showPassword, setShowPassword] = useState(false);
  const isUserSigningUp = useSelector((state) => state.loading.isUserSigningUp);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordFocus = () => {
    toast.info("Password must be at least 8 characters long", {
      autoClose: 3000,
    });
  };

  const handleAccountRegisterClick = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      return toast.error("Please fill all the fields");
    } else if (formData.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    try {
      dispatch(setIsUserSigningUp(true));
      const response = await post("/auth/register", { ...formData });
      dispatch(setAuthUser(response.data.data));
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      toast.error(error.response.data.message);
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
              className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-12 py-8 w-full max-w-lg h-fit shadow-lg"
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
                  className="cursor-pointer text-blue-600 hover:underline"
                  onClick={() => dispatch(setIsLoginModalOpen(true))}
                >
                  Log In
                </button>
              </div>

              <form onSubmit={handleAccountRegisterClick}>
                <div className="border border-black flex gap-2 items-center p-3 rounded-xl mb-4">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Name"
                    className="flex-grow outline-none"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <i className="fa-solid fa-user"></i>
                </div>

                <div className="border border-black flex gap-2 items-center p-3 rounded-xl mb-4">
                  <input
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

                <div className="border border-black flex gap-2 items-center p-3 rounded-xl mb-6">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    className="flex-grow outline-none bg-transparent"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={handlePasswordFocus}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="cursor-pointer"
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

                <button
                  type="submit"
                  className="w-full p-2 rounded-xl cursor-pointer bg-[#38b6ff] hover:bg-blue-400 font-semibold flex gap-2 justify-center items-center text-gray-950"
                  disabled={isUserSigningUp}
                >
                  {isUserSigningUp ? (
                    <>
                      <div className="w-6 h-6 border-4 border-t-blue-900 border-gray-50 rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>SIGN UP</span>
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
              <a href="#">Privacy policy</a>
              <span>----</span>
              <a href="#">Terms of use</a>
            </div>
            <div className="w-full max-w-lg border border-black hidden md:block md:invisible"></div>
          </div>
        </div>
      </main>

      <LoginModal />
    </>
  );
};

export default Home;
