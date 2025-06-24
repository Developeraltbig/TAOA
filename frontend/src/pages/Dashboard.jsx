import { useEffect } from "react";
import {
  setIsApplicationAnalysing,
  setIsApplicationUploading,
} from "../store/slices/loadingSlice";
import {
  clearUserSlice,
  setApplicationId,
} from "../store/slices/authUserSlice";
import { toast } from "react-toastify";
import { useRef, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearShowState } from "../store/slices/applicationDocketsSlice";
import { addOrUpdateApplication } from "../store/slices/latestApplicationsSlice";
import ApplicationAnalyseSkeleton from "../skeletons/ApplicationAnalyseSkeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const enviroment = import.meta.env.VITE_ENV;
  const isApplicationAnalysing = useSelector(
    (state) => state.loading.isApplicationAnalysing
  );
  const isApplicationUploading = useSelector(
    (state) => state.loading.isApplicationUploading
  );
  const authUser = useSelector((state) => state.user.authUser);
  const [applicationNumber, setApplicationNumber] = useState("");

  const handleFetchClick = async (e) => {
    e.preventDefault();
    if (!applicationNumber) {
      return toast.error("Please enter application number");
    } else if (isApplicationAnalysing || isApplicationUploading) {
      return toast.info("Please wait, another analysis is in progress");
    }

    try {
      dispatch(setIsApplicationAnalysing(true));
      const response = await post("/application/analyse", {
        token: authUser.token,
        appNumber: applicationNumber,
      });
      dispatch(addOrUpdateApplication(response.data.data));
      dispatch(setApplicationId(response.data.data.applicationId));
      navigate("/application");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      } else if (error.status === 400) {
        const message = error?.response?.data?.message;
        toast.error(message);
      } else {
        toast.error("Internal server error! Please try again.");
      }
    } finally {
      dispatch(setIsApplicationAnalysing(false));
    }
  };

  const handleUploadClick = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files.length === 0) {
      return toast.error("No files selected");
    } else if (files.length > 1) {
      return toast.error("Please select only one file");
    }

    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("token", authUser.token);

    try {
      dispatch(setIsApplicationUploading(true));
      const response = await post("/application/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      dispatch(addOrUpdateApplication(response.data.data));
      dispatch(setApplicationId(response.data.data.applicationId));
      navigate("/application");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      } else if (error.status === 400) {
        const message = error?.response?.data?.message;
        toast.error(message);
      } else {
        toast.error("Internal server error! Please try again.");
      }
    } finally {
      dispatch(setIsApplicationUploading(false));
      e.target.value = "";
    }
  };

  useEffect(() => {
    let toastId = null;

    if (isApplicationAnalysing || isApplicationUploading) {
      toastId = toast.info(
        "Generating response. This process may take sometime...",
        {
          autoClose: false,
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: false,
          theme: "light",
        }
      );
    }

    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [isApplicationAnalysing, isApplicationUploading]);

  useEffect(() => {
    dispatch(clearShowState());
  }, []);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-8 md:px-12 lg:px-16 pt-16 pb-10 transition-all duration-300 ease-in min-w-0">
      <header className="text-[calc(1rem+0.9vw)] font-[700]">
        <h2>
          Hello,{" "}
          <span className="text-[#38b6ff] font-bold">
            {authUser.name.split(" ")[0]}
          </span>
        </h2>
        <h5>Thinking about analyzing Office Actions</h5>
        <h5>(Examination Reports/Search Report) today?</h5>
      </header>

      <section className="bg-gradient-to-l from-[#e6eefa] to-[#f0faf4] rounded-xl px-6 py-6 sm:px-8 sm:py-8 h-fit shadow-lg max-[425px]:px-2 max-[375px]:px-1">
        <h2 id="form-heading" className="font-[500] text-[1.25rem] mb-4">
          Subject Patent Application
        </h2>

        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <form className="flex-grow min-w-0" onSubmit={handleFetchClick}>
            <div className="h-12 border border-gray-400 flex items-center rounded-lg min-w-[300px]">
              <input
                type="number"
                name="applicationNumber"
                placeholder="Type Application Number"
                className="flex-grow outline-none no-spinner p-3 min-w-0"
                value={applicationNumber}
                onChange={(e) => setApplicationNumber(e.target.value)}
                required
              />
              <button
                type="submit"
                className="min-w-[100px] w-fit h-full py-2 px-4 sm:px-6 rounded-r-md cursor-pointer bg-[#0d9488] hover:bg-[#0f766e] font-semibold flex gap-2 justify-center items-center text-white shadow-md"
                disabled={isApplicationAnalysing || isApplicationUploading}
              >
                {isApplicationAnalysing ? (
                  <>
                    <div className="w-6 h-6 border-4 border-t-gray-600 border-gray-50 rounded-full animate-spin"></div>
                    <span>Analysing...</span>
                  </>
                ) : (
                  <>
                    <>
                      <span>Fetch</span>
                      <i className="fa-solid fa-link"></i>
                    </>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="flex flex-col md:flex-row items-center justify-center md:items-stretch gap-3">
            <div className="flex items-center justify-center h-10 md:h-auto px-3 border-l border-r border-gray-400">
              <div className="border border-gray-400 rounded-lg px-3 py-2 bg-gray-100">
                <span className="text-black font-medium">OR</span>
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".doc,.docx,.pdf"
                className="hidden"
              />
              <button
                type="button"
                className="w-full md:w-fit min-w-[150px] max-w-[300px] h-12 py-2 px-4 sm:px-6 rounded-md cursor-pointer bg-[#0284c7] hover:bg-[#026395] font-semibold flex gap-2 justify-center items-center text-white shadow-md"
                onClick={handleUploadClick}
                disabled={isApplicationAnalysing || isApplicationUploading}
              >
                {isApplicationUploading ? (
                  <>
                    <div className="w-6 h-6 border-4 border-t-blue-600 border-gray-50 rounded-full animate-spin"></div>
                    <span>Analysing...</span>
                  </>
                ) : (
                  <>
                    <>
                      <span>Upload OA</span>
                      <i className="fa-solid fa-upload"></i>
                    </>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {(isApplicationAnalysing || isApplicationUploading) && (
        <ApplicationAnalyseSkeleton />
      )}
    </div>
  );
};

export default Dashboard;
