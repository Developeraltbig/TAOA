import { toast } from "react-toastify";
import {
  setDocketId,
  clearUserSlice,
  setApplicationId,
  setApplicationRejections,
} from "../store/slices/authUserSlice";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import {
  clearShowState,
  clearDocketState,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
import { ChevronsRight, ChevronsDown } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import OrbitingRingsLoader from "../loaders/OrbitingRingsLoader";
import DocketsContentPanel from "../components/DocketsContentPanel";
import DocketsHeaderSection from "../components/DocketsHeaderSection";
import DocketsToggleButtons from "../components/DocketsToggleButtons";
import { updateDocketData } from "../store/slices/latestApplicationsSlice";

const TechnicalComparison = () => {
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const isSidebarMenuVisible = useSelector(
    (state) => state.modals.isSidebarMenuVisible
  );
  const [docketData, setDocketData] = useState({});
  const latestApplications = useSelector(
    (state) => state.applications.latestApplication
  );
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leftViewMode, setLeftViewMode] = useState("Table");
  const authUser = useSelector((state) => state.user.authUser);
  const [isExtraLargeScreen, setIsExtraLargeScreen] = useState(
    window.innerWidth >= 1280
  );
  const activeDocketId = useSelector((state) => state.user.docketId);
  const activeApplicationId = useSelector((state) => state.user.applicationId);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  const currentApplicationRejections = useSelector(
    (state) => state.user.applicationRejections[activeDocketId]
  );
  const isTechnicalClaimsLoading =
    currentApplicationRejections?.isTechnicalComparisonLoading;
  const isTechnicalClaimsAmended =
    currentApplicationRejections?.isTechnicalComparisonClaimsAmended;

  const patentData = [
    {
      number: docketData?.subjectPublicationNumber,
      label: "Subject Application",
    },
    ...(docketData?.priorArtReferences?.map((prior, index) => ({
      number: prior.citedPubNo,
      label: `Cited Art ${index + 1}`,
    })) || []),
  ];

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleConfirmation = () => {
    analyseTechnicalComparison(activeApplicationId, activeDocketId);
    handleCloseModal();
  };

  const handleRegenerate = () => {
    handleOpenModal();
  };

  const fetchDocketData = () => {
    if (
      !isLatestApplicationLoading &&
      latestApplications.length > 0 &&
      activeApplicationId &&
      activeDocketId
    ) {
      const newData = latestApplications.find(
        (application) => application.applicationId === activeApplicationId
      );
      if (newData) {
        const data = newData.dockets.find(
          (docket) => docket._id === activeDocketId
        );
        if (data) {
          setDocketData(data);
        } else {
          setDocketData(null);
          dispatch(setDocketId(null));
          dispatch(clearDocketState());
        }
      } else {
        dispatch(setApplicationId(null));
        dispatch(setDocketId(null));
        dispatch(clearShowState());
      }
    }
  };

  const handleAmendClaimsClick = (e) => {
    e.preventDefault();
    if (isTechnicalClaimsLoading || !docketData?.technicalData?.amendedClaim) {
      return;
    }
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isTechnicalComparisonClaimsAmended",
        value: true,
      })
    );
  };

  const analyseTechnicalComparison = async (applicationId, docketId) => {
    try {
      if (isTechnicalClaimsLoading) {
        return toast.info("Claims are already being generated!");
      }
      let response;
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isTechnicalComparisonLoading",
          value: true,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isTechnicalComparisonClaimsAmended",
          value: false,
        })
      );
      if (docketData.rejectionType === "102") {
        response = await post("/tabs/102/technicalcomparison", {
          token: authUser.token,
          data: docketData,
        });
      }
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "technicalData",
          value: response.data.data,
        })
      );
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
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isTechnicalComparisonLoading",
          value: false,
        })
      );
    }
  };

  const handleDownload = (panel) => {
    console.log(`Download clicked for ${panel}`);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
      setIsExtraLargeScreen(window.innerWidth >= 1280);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      (docketData &&
        Object.keys(docketData).length &&
        docketData?.technicalData &&
        !Object.keys(docketData?.technicalData).length) ||
      (docketData &&
        Object.keys(docketData).length &&
        docketData.technicalData === undefined)
    ) {
      analyseTechnicalComparison(activeApplicationId, activeDocketId);
    }
  }, [docketData]);

  useEffect(() => {
    if (activeDocketId && activeApplicationId) {
      fetchDocketData();
    }
  }, [latestApplications, activeDocketId, activeApplicationId]);

  if ((!isLatestApplicationLoading && docketData === null) || !activeDocketId) {
    return <Navigate to="/application" />;
  } else if (!activeApplicationId && !activeDocketId) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <div className="min-h-full px-4 sm:px-8 md:px-12 lg:px-16 pt-16 pb-18">
        <DocketsHeaderSection
          title="Technical Comparison"
          subtitle="Key differences between the subject application and cited art."
          patents={patentData}
          loading={isLatestApplicationLoading && docketData !== null}
        />

        <div
          className={`flex flex-col xl:flex-row gap-4 space-y-6 xl:space-y-0 xl:h-[600px] p-3 sm:p-0 ${
            isSidebarMenuVisible
              ? "lg:flex-col"
              : "lg:flex-row lg:space-y-0 lg:h-[600px]"
          }`}
        >
          {/* Left Panel */}
          <div
            className={`h-[600px] xl:flex-1 ${
              isSidebarMenuVisible ? "" : "lg:flex-1"
            }`}
          >
            <DocketsContentPanel
              headerContent={
                <DocketsToggleButtons
                  options={["Table", "Paragraph"]}
                  defaultSelected={leftViewMode}
                  onSelectionChange={setLeftViewMode}
                />
              }
              onDownload={() => handleDownload("left")}
              onRegenerate={() => handleRegenerate()}
            >
              <div className="h-full bg-gray-50 rounded border border-gray-200 py-3 px-5 overflow-y-auto overflow-x-hidden relative">
                {isTechnicalClaimsLoading ? (
                  <OrbitingRingsLoader />
                ) : !docketData?.technicalData?.comparisonTable ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      {leftViewMode} view content would appear here
                    </p>
                  </div>
                ) : leftViewMode === "Table" ? (
                  <table className="w-full border-collapse border border-gray-300 border-t-0 text-center">
                    <thead>
                      <tr className="border-b border-gray-300 bg-[#0284c7] sticky -top-3 z-10">
                        <th className="py-2 px-4 w-1/3 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                          Subject Application
                        </th>
                        <th className="py-2 px-4 w-1/3 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                          Prior Art
                        </th>
                        <th className="py-2 px-4 w-1/3 text-md font-bold text-white max-[425px]:px-2">
                          Differentiating Feature
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {docketData.technicalData.comparisonTable.map(
                        (comparison, index) => (
                          <tr
                            key={index}
                            className={`border-b border-gray-200 ${
                              index % 2 === 0 ? "bg-gray-200" : "bg-white"
                            } hover:bg-gray-200/50`}
                          >
                            <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300 text-left align-top">
                              {comparison.subjectApplication}
                            </td>
                            <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300 text-left align-top">
                              <span>{comparison.priorArt}</span>
                            </td>
                            <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2 text-left align-top">
                              {comparison.differentiatingFeature}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <ul className="list-none">
                    {docketData.technicalData.comparisonTable.map(
                      (comparison, index) => {
                        return (
                          <li key={index} className="flex items-start mb-2">
                            {/* Display elementId explicitly */}
                            <span className="text-[0.95rem] font-semibold text-gray-700 mr-2 min-w-[20px]">
                              {index + 1}.
                            </span>
                            <p className="text-[0.95rem] text-justify flex-1 leading-relaxed">
                              {comparison.differentiatingFeature}
                            </p>
                          </li>
                        );
                      }
                    )}
                  </ul>
                )}
              </div>
            </DocketsContentPanel>
          </div>

          {/* Resize Handle */}
          <div
            className={`flex items-center justify-center w-full xl:w-8 h-full ${
              isSidebarMenuVisible ? "" : "lg:w-8"
            }`}
          >
            <div className="inline-block relative">
              <button
                className={`h-10 w-10 rounded-full bg-[#3586cb] flex items-center justify-center shadow-sm cursor-pointer text-white tooltip-trigger ${
                  isTechnicalClaimsLoading
                    ? ""
                    : isTechnicalClaimsAmended
                    ? ""
                    : "animate-pulse"
                }`}
                onClick={handleAmendClaimsClick}
                disabled={isTechnicalClaimsLoading}
              >
                {isLargeScreen ? (
                  isExtraLargeScreen ? (
                    <ChevronsRight />
                  ) : isSidebarMenuVisible ? (
                    <ChevronsDown />
                  ) : (
                    <ChevronsRight />
                  )
                ) : (
                  <ChevronsDown />
                )}
              </button>
              <div
                className="
                absolute top-full mt-2 left-1/2 transform -translate-x-1/2
                opacity-0 tooltip-content
                transition-opacity duration-300
                bg-gray-800 text-white text-sm rounded-lg px-3 py-2
                whitespace-nowrap z-50
                before:content-[''] before:absolute before:bottom-full before:left-1/2 before:transform before:-translate-x-1/2
                before:border-4 before:border-transparent before:border-b-gray-800
              "
              >
                Click to amend claims
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div
            className={`h-[600px] xl:flex-1 ${
              isSidebarMenuVisible ? "" : "lg:flex-1"
            }`}
          >
            <DocketsContentPanel
              title="Suggested Claim Amendment"
              onDownload={() => handleDownload("right")}
              onRegenerate={() => handleRegenerate()}
            >
              <div className="h-full bg-gray-50 rounded border border-gray-200 py-3 px-5 overflow-y-auto">
                {!docketData?.technicalData?.amendedClaim ||
                !isTechnicalClaimsAmended ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      Suggested claim amendment content would appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[1.05rem] text-justify leading-relaxed">
                      <span className="font-semibold text-gray-800">
                        {docketData.rejectedClaims?.[0]}.
                      </span>{" "}
                      {docketData.technicalData.amendedClaim.preamble}
                    </p>
                    <ul className="list-disc pl-5">
                      {docketData.technicalData.amendedClaim.elements.map(
                        (element, index) => {
                          return (
                            <li key={index} className="mb-2">
                              <p className="text-[0.95rem] text-justify flex-1 leading-relaxed">
                                {element.text}
                              </p>
                            </li>
                          );
                        }
                      )}
                      {docketData.technicalData.amendedClaim.additionalElements.map(
                        (element, index) => {
                          return (
                            <li key={index} className="mb-2">
                              <p className="text-[0.95rem] text-justify flex-1 leading-relaxed">
                                {element.text}
                              </p>
                            </li>
                          );
                        }
                      )}
                    </ul>
                    {/* Amendment Strategy */}
                    {docketData.technicalData.amendmentStrategy && (
                      <div className="pt-4 border-t border-gray-200 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Amendment Strategy:
                        </h3>
                        <p className="text-sm text-gray-700 text-justify leading-relaxed">
                          {docketData.technicalData.amendmentStrategy}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DocketsContentPanel>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmation}
        title="Are you sure?"
        message="This will regenerate the technical comparison and amendment claims suggestion."
        confirmButtonText="Regenerate"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default TechnicalComparison;
