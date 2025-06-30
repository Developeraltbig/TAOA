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
import { setFlag } from "../store/slices/draftSlice";
import { useDispatch, useSelector } from "react-redux";
import { ChevronsRight, ChevronsDown } from "lucide-react";
import FullScreenTable from "../components/FullScreenTable";
import { formatTextByDelimiter } from "../helpers/formatText";
import ConfirmationModal from "../components/ConfirmationModal";
import OrbitingRingsLoader from "../loaders/OrbitingRingsLoader";
import DocketsContentPanel from "../components/DocketsContentPanel";
import DocketsHeaderSection from "../components/DocketsHeaderSection";
import DocketsToggleButtons from "../components/DocketsToggleButtons";
import { updateDocketData } from "../store/slices/latestApplicationsSlice";
import FinalizeConfirmationModal from "../components/FinalizeConfirmationModal";

const CompositeAmendments = () => {
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const [docketData, setDocketData] = useState({});
  const latestApplications = useSelector(
    (state) => state.applications.latestApplication
  );
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const [leftViewMode, setLeftViewMode] = useState("Table");
  const authUser = useSelector((state) => state.user.authUser);
  const [isExtraLargeScreen, setIsExtraLargeScreen] = useState(
    window.innerWidth >= 1280
  );
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const activeDocketId = useSelector((state) => state.user.docketId);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [rightViewMode, setRightViewMode] = useState("Suggested Amendment");
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const activeApplicationId = useSelector((state) => state.user.applicationId);

  const currentApplicationRejections = useSelector(
    (state) => state.user.applicationRejections[activeDocketId]
  );
  const isCompositeClaimsLoading =
    currentApplicationRejections?.isCompositeAmendmentLoading;
  const isCompositeClaimsAmended =
    currentApplicationRejections?.isCompositeAmendmentClaimsAmended;
  const isCompositeClaimsFinalized =
    currentApplicationRejections?.isCompositeAmendmentFinalized;
  const isCompositeAmendmentClaimsLoading =
    currentApplicationRejections?.isCompositeAmendmentClaimsLoading;

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

  const handleRegenerateOpenModal = () => setIsRegenerateModalOpen(true);
  const handleRegenerateCloseModal = () => setIsRegenerateModalOpen(false);
  const handleRegenerateConfirmation = () => {
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isCompositeAmendmentFinalized",
        value: false,
      })
    );
    analyseCompositeComparison(activeApplicationId, activeDocketId);
    handleRegenerateCloseModal();
  };
  const handleRegenerate = () => {
    if (isCompositeAmendmentClaimsLoading) {
      return;
    }
    handleRegenerateOpenModal();
  };

  const handleFinalizeOpenModal = () => setIsFinalizeModalOpen(true);
  const handleFinalizeCloseModal = () => setIsFinalizeModalOpen(false);
  const handleFinalizeConfirmation = async () => {
    handleFinalizeCloseModal();
    if (!docketData?.compositeData?.amendedClaim || !isCompositeClaimsAmended) {
      return toast.error("Please amend the claims first");
    } else if (isCompositeClaimsFinalized) {
      return;
    }

    try {
      await post("/rejection/finalize", {
        token: authUser.token,
        rejectionId: docketData.rejectionId,
        applicationId: activeApplicationId,
        type: "compositeAmendment",
        amendedClaim: docketData.technicalData.amendedClaim,
        comparisonTable: docketData.technicalData.comparisonTable,
        amendmentStrategy: docketData.technicalData.amendmentStrategy,
      });

      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isTechnicalComparisonFinalized",
          value: false,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isNovelFeaturesFinalized",
          value: false,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isDependentClaimsFinalized",
          value: false,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isCompositeAmendmentFinalized",
          value: true,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isOneFeaturesFinalized",
          value: false,
        })
      );
      dispatch(setFlag());
      dispatch(
        updateDocketData({
          applicationId: activeApplicationId,
          docketId: activeDocketId,
          name: "finalizedType",
          value: "compositeAmendment",
        })
      );
      toast.success("Amendment finalized successfully");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      toast.error("Failed to finalize amendment");
    }
  };
  const handleFinalizeClick = async (e) => {
    e.preventDefault();
    if (isCompositeClaimsFinalized) {
      return;
    }
    handleFinalizeOpenModal();
  };

  const openFullScreen = () => setIsFullScreenOpen(true);
  const closeFullScreen = () => setIsFullScreenOpen(false);

  const fetchDocketData = () => {
    if (
      !isLatestApplicationLoading &&
      latestApplications.length > 0 &&
      activeApplicationId &&
      activeDocketId
    ) {
      const newData = latestApplications?.find(
        (application) => application.applicationId === activeApplicationId
      );
      if (newData) {
        const data = newData.dockets?.find(
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

  const handleAmendClaimsClick = async (e) => {
    e.preventDefault();
    if (isCompositeClaimsLoading || !docketData?.compositeData?.amendedClaim) {
      return;
    }
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isCompositeAmendmentClaimsLoading",
        value: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isCompositeAmendmentClaimsLoading",
        value: false,
      })
    );
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isCompositeAmendmentClaimsAmended",
        value: true,
      })
    );
  };

  const analyseCompositeComparison = async (applicationId, docketId) => {
    try {
      if (isCompositeClaimsLoading) {
        return toast.info("Claims are already being generated!");
      }
      let response;
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isCompositeAmendmentLoading",
          value: true,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isCompositeAmendmentClaimsAmended",
          value: false,
        })
      );
      if (docketData.rejectionType === "102") {
        response = await post("/tabs/102/compositeamendments", {
          token: authUser.token,
          data: docketData,
        });
      } else if (docketData.rejectionType === "103") {
        response = await post("/tabs/103/compositeamendments", {
          token: authUser.token,
          data: docketData,
        });
      }
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "compositeData",
          value: response.data.data,
        })
      );
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "showFinalizedType",
          value: false,
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
          name: "isCompositeAmendmentLoading",
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
      setIsExtraLargeScreen(window.innerWidth >= 1280);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      (docketData &&
        Object.keys(docketData).length &&
        docketData?.compositeData &&
        !Object.keys(docketData?.compositeData).length &&
        !isCompositeClaimsLoading) ||
      (docketData &&
        Object.keys(docketData).length &&
        docketData.compositeData === undefined &&
        !isCompositeClaimsLoading)
    ) {
      analyseCompositeComparison(activeApplicationId, activeDocketId);
    }
  }, [docketData]);

  useEffect(() => {
    if (docketData.finalizedType && docketData.showFinalizedType) {
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name:
            docketData.finalizedType === "technicalComparison"
              ? "isTechnicalComparisonFinalized"
              : docketData.finalizedType === "novelFeatures"
              ? "isNovelFeaturesFinalized"
              : docketData.finalizedType === "dependentClaims"
              ? "isDependentClaimsFinalized"
              : docketData.finalizedType === "compositeAmendment"
              ? "isCompositeAmendmentFinalized"
              : "isOneFeaturesFinalized",
          value: true,
        })
      );
    }
  }, [docketData.finalizedType, docketData.showFinalizedType]);

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
          title="Composite Claim Amendments"
          subtitle="Suggestions based on overall consideration of subject application and cited arts."
          patents={patentData}
          loading={isLatestApplicationLoading && docketData !== null}
        />

        <div className="flex flex-col xl:flex-row gap-4 space-y-6 xl:space-y-0 xl:h-[600px] p-3 sm:p-0">
          {/* Left Panel */}
          <div className="h-[600px] xl:w-[calc(50%-24px)]">
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
              isClaimsLoading={isCompositeAmendmentClaimsLoading}
              onFullScreen={
                leftViewMode === "Table" &&
                !isCompositeClaimsLoading &&
                docketData?.compositeData?.comparisonTable
                  ? openFullScreen
                  : null
              }
            >
              <div className="h-full bg-gray-50 rounded border border-gray-200 py-3 px-5 overflow-y-auto overflow-x-hidden relative">
                {isCompositeClaimsLoading ? (
                  <OrbitingRingsLoader />
                ) : !docketData?.compositeData?.comparisonTable ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      {leftViewMode} view content would appear here
                    </p>
                  </div>
                ) : leftViewMode === "Table" ? (
                  <table className="w-full border-collapse border border-gray-300 border-t-0 text-center">
                    <thead>
                      <tr className="border-b border-gray-300 bg-[#0284c7] sticky -top-3 z-10">
                        <th className="py-3 px-6 w-1/2 text-md font-bold text-white border-r border-gray-300">
                          Subject Application
                        </th>
                        <th className="py-3 px-6 w-1/2 text-md font-bold text-white">
                          Prior Art
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {docketData.compositeData.comparisonTable.map(
                        (comparison, index) => (
                          <tr
                            key={index}
                            className={`border-b border-gray-200 ${
                              index % 2 === 0 ? "bg-gray-200" : "bg-white"
                            } hover:bg-gray-200/50`}
                          >
                            <td className="py-3 px-6 text-sm font-medium text-gray-800 border-r border-gray-300 text-left align-top">
                              {comparison.subjectApplication}
                            </td>
                            <td className="py-3 px-6 text-sm font-medium text-gray-800 text-left align-top">
                              <span>{comparison.priorArt}</span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <ul className="list-none">
                    {docketData.compositeData.comparisonTable.map(
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
          <div className="flex items-center justify-center w-full xl:w-8 h-full">
            <div className="inline-block relative">
              <button
                className={`h-10 w-10 rounded-full bg-[#3586cb] flex items-center justify-center shadow-sm cursor-pointer text-white tooltip-trigger ${
                  isCompositeClaimsLoading || isCompositeAmendmentClaimsLoading
                    ? ""
                    : isCompositeClaimsAmended
                    ? ""
                    : "animate-pulse"
                }`}
                onClick={handleAmendClaimsClick}
                disabled={
                  isCompositeClaimsLoading ||
                  isCompositeClaimsAmended ||
                  isCompositeAmendmentClaimsLoading
                }
              >
                {isExtraLargeScreen ? <ChevronsRight /> : <ChevronsDown />}
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
                {isCompositeClaimsAmended
                  ? "Claims amended"
                  : "Click to amend claims"}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="h-[600px] xl:w-[calc(50%-24px)]">
            <DocketsContentPanel
              headerContent={
                <DocketsToggleButtons
                  options={["Rejected Claim", "Suggested Amendment"]}
                  defaultSelected={rightViewMode}
                  onSelectionChange={setRightViewMode}
                />
              }
              onDownload={() => handleDownload("right")}
              onFinalize={
                isCompositeClaimsAmended &&
                !isCompositeClaimsLoading &&
                rightViewMode === "Suggested Amendment"
                  ? handleFinalizeClick
                  : null
              }
              isClaimsFinalized={isCompositeClaimsFinalized}
            >
              <div className="h-full bg-gray-50 rounded border border-gray-200 py-3 px-5 overflow-y-auto">
                {isCompositeAmendmentClaimsLoading ? (
                  <OrbitingRingsLoader />
                ) : !isCompositeClaimsAmended || isCompositeClaimsLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      {rightViewMode === "Suggested Amendment"
                        ? "Suggested Claim Amendment would appear here"
                        : "Rejected Claim would appear here"}
                    </p>
                  </div>
                ) : rightViewMode === "Suggested Amendment" &&
                  docketData?.compositeData?.amendedClaim ? (
                  <div className="space-y-4">
                    <p className="text-[1rem] text-justify leading-relaxed">
                      <span className="font-semibold text-gray-800">
                        {docketData.rejectedClaims?.[0]}.
                      </span>{" "}
                      {docketData.compositeData.amendedClaim.preamble}
                    </p>
                    <ul className="list-disc pl-5">
                      {docketData.compositeData.amendedClaim.elements.map(
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
                      {docketData.compositeData.amendedClaim.additionalElements.map(
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
                    {docketData.compositeData.amendmentStrategy && (
                      <div className="pt-4 border-t border-gray-200 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Amendment Strategy:
                        </h3>
                        <p className="text-sm text-gray-700 text-justify leading-relaxed">
                          {docketData.compositeData.amendmentStrategy}
                        </p>
                      </div>
                    )}
                  </div>
                ) : rightViewMode === "Rejected Claim" &&
                  docketData?.compositeData?.rejectedClaim ? (
                  <div className="flex justify-center space-x-2">
                    <span className="font-semibold text-gray-800 pt-[1px]">
                      {docketData.rejectedClaims?.[0]}.
                    </span>{" "}
                    <p
                      className="text-[1rem] text-justify leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: formatTextByDelimiter(
                          docketData.compositeData.rejectedClaim
                        ),
                      }}
                    ></p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      {rightViewMode === "Suggested Amendment"
                        ? "Suggested Claim Amendment would appear here"
                        : "Rejected Claim would appear here"}
                    </p>
                  </div>
                )}
              </div>
            </DocketsContentPanel>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isRegenerateModalOpen}
        onClose={handleRegenerateCloseModal}
        onConfirm={handleRegenerateConfirmation}
        title="Are you sure?"
        message="This will regenerate the composite amendments and amendment claims suggestion."
        confirmButtonText="Regenerate"
        cancelButtonText="Cancel"
      />
      <FinalizeConfirmationModal
        isOpen={isFinalizeModalOpen}
        onClose={handleFinalizeCloseModal}
        onConfirm={handleFinalizeConfirmation}
        // onViewDetails={handleViewCurrentDetails}
        title="Replace Existing Amendment?"
        message="Do you want to finalize this claim amendment for response generation?"
        confirmButtonText="Replace"
        cancelButtonText="Cancel"
        currentFinalizedText="CURRENTLY FINALIZED"
        sourceTabText='From "Technical Comparison" Tab'
        warningNoteText="This will replace the existing finalized amendment"
      />
      <FullScreenTable
        isOpen={isFullScreenOpen}
        onClose={closeFullScreen}
        tableData={docketData?.compositeData?.comparisonTable}
        tableHeading="Composite Amendments Table"
      />
    </>
  );
};

export default CompositeAmendments;
