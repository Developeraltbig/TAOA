import {
  setDocketId,
  clearUserSlice,
  setApplicationId,
} from "../store/slices/authUserSlice";
import { useNavigate } from "react-router-dom";
import { post } from "../services/ApiEndpoint";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIsLoginModalOpen } from "../store/slices/modalsSlice";
import { setIsUserLoggingOut } from "../store/slices/loadingSlice";
import { clearShowState } from "../store/slices/applicationDocketsSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const isUserLoggingOut = useSelector(
    (state) => state.loading.isUserLoggingOut
  );
  const enviroment = import.meta.env.VITE_ENV;
  const authUser = useSelector((state) => state.user.authUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);
  const [isMobileMenuRendering, setIsMobileMenuRendering] = useState(false);

  const handleSignOutClick = async (e) => {
    e.preventDefault();
    try {
      dispatch(setIsUserLoggingOut(true));
      await post("/auth/logout", {
        token: authUser.token,
      });
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
    } finally {
      dispatch(setIsUserLoggingOut(false));
      dispatch(clearShowState());
      dispatch(clearUserSlice());
    }
  };

  const handleMobileMenuToggle = () => {
    if (!isMobileMenuVisible) {
      setIsMobileMenuRendering(true);
      // Double rAF ensures DOM is painted before class transition begins
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsMobileMenuVisible(true);
        });
      });
    } else {
      setIsMobileMenuVisible(false);
      setTimeout(() => setIsMobileMenuRendering(false), 150);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    dispatch(clearShowState());
    dispatch(setDocketId(null));
    dispatch(setApplicationId(null));
    if (authUser) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        mobileMenuButtonRef.current &&
        mobileMenuButtonRef.current.contains(event.target)
      ) {
        return;
      }

      if (
        isMobileMenuVisible &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuVisible(false);
        setTimeout(() => setIsMobileMenuRendering(false), 300);
      }

      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMobileMenuVisible, isProfileMenuOpen]);

  return (
    <nav className="bg-white shadow-sm fixed top-0 z-50 w-full">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {!authUser && (
            <div className="absolute inset-y-0 right-0 flex items-center sm:hidden">
              <button
                type="button"
                ref={mobileMenuButtonRef}
                className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-700 text-lg cursor-pointer"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={handleMobileMenuToggle}
              >
                <span className="absolute -inset-0.5"></span>
                <span className="sr-only">Open main menu</span>
                <i
                  className={`fa-solid ${
                    isMobileMenuVisible ? "fa-x rotate-180" : "fa-bars"
                  } transform transition-transform duration-300 ease-in-out`}
                />
              </button>
            </div>
          )}
          <div className="flex flex-1 items-center sm:justify-between">
            <div
              className="flex shrink-0 items-center cursor-pointer"
              onClick={handleLogoClick}
            >
              <img
                className="h-8 w-auto"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                alt="TAOA.AI"
              />
              TAOA.AI
            </div>
            {!authUser && (
              <div className="hidden sm:ml-6 sm:block text-[#3586cb]">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className="bg-gradient-to-r from-[#e6f2ff] to-[#c5e7ff] flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border border-solid border-[#c5e7ff] font-[600] hover:-translate-y-[2px] hover:shadow-md transition-all duration-150 ease-in"
                    onClick={() => dispatch(setIsLoginModalOpen(true))}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    Login
                  </button>
                  <button
                    type="button"
                    className="bg-gradient-to-r from-[#e6f2ff] to-[#c5e7ff] flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border border-solid border-[#c5e7ff] font-[600] hover:-translate-y-[2px] hover:shadow-md transition-all duration-150 ease-in"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            )}
          </div>

          {authUser && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <div className="relative ml-3" ref={profileMenuRef}>
                <button
                  type="button"
                  className="relative rounded-full text-md cursor-pointer size-11 hover:-translate-y-[2px] border-3 border-gray-200 hover:shadow-md bg-gradient-to-r from-[#44b9ff] to-[#3586cb] font-bold text-white transition-all duration-150 ease-in"
                  id="user-menu-button"
                  aria-controls="profile-menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <span className="absolute -inset-1.5"></span>
                  <span className="sr-only">Open user menu</span>
                  {authUser.name.charAt(0).toUpperCase()}
                </button>

                {isProfileMenuOpen && (
                  <div
                    id="profile-menu"
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="w-full flex justify-center">
                      <button
                        type="button"
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer w-[90%] text-left mt-2 rounded-md ${
                          isUserLoggingOut
                            ? "bg-gray-200 flex items-center justify-between"
                            : ""
                        }`}
                        role="menuitem"
                        id="user-menu-item-1"
                        onClick={handleSignOutClick}
                        disabled={isUserLoggingOut}
                      >
                        Sign out
                        {isUserLoggingOut ? (
                          <div className="w-5 h-5 border-4 border-t-gray-600 border-gray-50 rounded-full animate-spin"></div>
                        ) : (
                          ""
                        )}
                      </button>
                    </div>
                    <div className="border-t border-solid border-gray-200 my-2"></div>
                    <div className="w-full flex justify-center">
                      <a
                        // href="dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer w-[90%] text-left mb-2 rounded-md"
                        role="menuitem"
                        id="user-menu-item-2"
                      >
                        Contact Us
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuRendering && (
        <div
          className={`
            sm:hidden absolute bg-white w-full shadow-md px-4 pt-2 pb-3 text-[#3586cb]
            transition-all duration-150 ease-in-out overflow-hidden z-50
            ${
              isMobileMenuVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }
          `}
          ref={mobileMenuRef}
          id="mobile-menu"
        >
          {!authUser && (
            <div className="space-y-2 px-4 pt-2 pb-3 text-[#3586cb]">
              <button
                type="button"
                className="bg-gradient-to-r from-[#e6f2ff] to-[#c5e7ff] flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border border-solid border-[#c5e7ff] font-[600] hover:-translate-y-[2px] hover:shadow-md transition-all duration-150 ease-in"
                onClick={() => dispatch(setIsLoginModalOpen(true))}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                Login
              </button>
              <button
                type="button"
                className="bg-gradient-to-r from-[#e6f2ff] to-[#c5e7ff] flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border border-solid border-[#c5e7ff] font-[600] hover:-translate-y-[2px] hover:shadow-md transition-all duration-150 ease-in"
              >
                Contact Us
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
