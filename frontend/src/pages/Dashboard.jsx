import { useEffect } from "react";
import {
  setIsApiFinalizing,
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
import ApplicationHeader from "../components/ApplicationHeader";
import DocumentAnalysisLoader from "../loaders/DocumentAnalysisLoader";
import { clearShowState } from "../store/slices/applicationDocketsSlice";
import { addOrUpdateApplication } from "../store/slices/latestApplicationsSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const enviroment = import.meta.env.VITE_ENV;
  const [response, setResponse] = useState({});
  const isApplicationAnalysing = useSelector(
    (state) => state.loading.isApplicationAnalysing
  );
  const isApplicationUploading = useSelector(
    (state) => state.loading.isApplicationUploading
  );
  const authUser = useSelector((state) => state.user.authUser);
  const [applicationNumber, setApplicationNumber] = useState("");

  const handleFinalizeAnalysis = () => {
    dispatch(addOrUpdateApplication(response));
    dispatch(setApplicationId(response.applicationId));
    dispatch(setIsApplicationAnalysing(false));
    dispatch(setIsApplicationUploading(false));
    dispatch(setIsApiFinalizing(false));
    navigate("/application");
  };

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
      setResponse(response.data.data);
      dispatch(setIsApiFinalizing(true));
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
      dispatch(setIsApplicationAnalysing(false));
      dispatch(setIsApiFinalizing(false));
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
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResponse(response.data.data);
      dispatch(setIsApiFinalizing(true));
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
      dispatch(setIsApplicationUploading(false));
      dispatch(setIsApiFinalizing(false));
    } finally {
      e.target.value = "";
    }
  };

  useEffect(() => {
    dispatch(clearShowState());
  }, []);

  return (
    <div className="h-full bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationHeader userName={authUser.name} />

        <section className="bg-white rounded-xl px-6 py-6 sm:px-8 sm:py-8 h-fit shadow-lg max-[425px]:px-2 max-[375px]:px-1 mb-6 border border-blue-100">
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
                  disabled={isApplicationAnalysing || isApplicationUploading}
                />
                <button
                  type="submit"
                  className="min-w-[100px] w-fit h-full py-2 px-4 sm:px-6 rounded-r-md cursor-pointer bg-[#0d9488] hover:bg-[#0f766e] font-semibold flex gap-2 justify-center items-center text-white shadow-md hover:shadow-xl"
                  disabled={isApplicationAnalysing || isApplicationUploading}
                >
                  {isApplicationAnalysing ? (
                    <div className="w-6 h-6 border-4 border-t-gray-600 border-gray-50 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Fetch</span>
                      <i className="fa-solid fa-link"></i>
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
                  className="w-full md:w-fit min-w-[150px] max-w-[300px] h-12 py-2 px-4 sm:px-6 rounded-md cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-semibold flex gap-2 justify-center items-center shadow-md hover:shadow-xl"
                  onClick={handleUploadClick}
                  disabled={isApplicationAnalysing || isApplicationUploading}
                >
                  {isApplicationUploading ? (
                    <div className="w-6 h-6 border-4 border-t-gray-600 border-gray-50 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Upload OA</span>
                      <i className="fa-solid fa-upload"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {(isApplicationAnalysing || isApplicationUploading) && (
          <DocumentAnalysisLoader
            isLoading={isApplicationAnalysing || isApplicationUploading}
            onFinalPhaseReached={handleFinalizeAnalysis}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
