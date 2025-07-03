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
import { getAmendmentTitle } from "../helpers/amendmentTitle";
import { formatTextByDelimiter } from "../helpers/formatText";
import ConfirmationModal from "../components/ConfirmationModal";
import AmendedClaimModal from "../components/AmendedClaimModal";
import OrbitingRingsLoader from "../loaders/OrbitingRingsLoader";
import DocketsContentPanel from "../components/DocketsContentPanel";
import DocketsHeaderSection from "../components/DocketsHeaderSection";
import DocketsToggleButtons from "../components/DocketsToggleButtons";
import { updateDocketData } from "../store/slices/latestApplicationsSlice";
import FinalizeConfirmationModal from "../components/FinalizeConfirmationModal";

const NovelFeatures = () => {
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const [docketData, setDocketData] = useState({});
  const latestApplications = useSelector(
    (state) => state.applications.latestApplication
  );
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const [amendedClaim, setAmendedClaim] = useState({});
  const [leftViewMode, setLeftViewMode] = useState("Table");
  const authUser = useSelector((state) => state.user.authUser);
  const [isExtraLargeScreen, setIsExtraLargeScreen] = useState(
    window.innerWidth >= 1280
  );
  const [showAmendedModal, setShowAmendedModal] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const activeDocketId = useSelector((state) => state.user.docketId);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isAmendedClaimFailed, setIsAmendedClaimFailed] = useState(false);
  const [isAmendedClaimLoading, setIsAmendedClaimLoading] = useState(false);
  const [rightViewMode, setRightViewMode] = useState("Suggested Amendment");
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const activeApplicationId = useSelector((state) => state.user.applicationId);

  const currentApplicationRejections = useSelector(
    (state) => state.user.applicationRejections[activeDocketId]
  );
  const isNovelClaimsLoading =
    currentApplicationRejections?.isNovelFeaturesLoading;
  const isNovelClaimsAmended =
    currentApplicationRejections?.isNovelFeaturesClaimsAmended;
  const isNovelClaimsFinalized =
    currentApplicationRejections?.isNovelFeaturesFinalized;
  const isNovelAmendmentClaimsLoading =
    currentApplicationRejections?.isNovelFeaturesAmendmentClaimsLoading;

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
        name: "isNovelFeaturesFinalized",
        value: false,
      })
    );
    analyseNovelFeatures(activeApplicationId, activeDocketId);
    handleRegenerateCloseModal();
  };
  const handleRegenerate = () => {
    if (isNovelAmendmentClaimsLoading) {
      return;
    }
    handleRegenerateOpenModal();
  };

  const handleFinalizeOpenModal = () => setIsFinalizeModalOpen(true);
  const handleFinalizeCloseModal = () => setIsFinalizeModalOpen(false);
  const handleFinalizeConfirmation = async () => {
    handleFinalizeCloseModal();
    if (!docketData?.novelData?.amendedClaim || !isNovelClaimsAmended) {
      return toast.error("Please amend the claims first");
    } else if (isNovelClaimsFinalized) {
      return;
    }

    try {
      await post("/rejection/finalize", {
        token: authUser.token,
        rejectionId: docketData.rejectionId,
        applicationId: activeApplicationId,
        type: "novelFeatures",
        amendedClaim: docketData.novelData.amendedClaim,
        comparisonTable: docketData.novelData.comparisonTable,
        amendmentStrategy: docketData.novelData.amendmentStrategy,
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
          value: true,
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
          value: false,
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
          value: "novelFeatures",
        })
      );
      toast.success("Amendment finalized successfully");
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.status === 401 || error.status === 404) {
        dispatch(clearShowState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to finalize amendment");
      }
    }
  };
  const handleFinalizeClick = async (e) => {
    e.preventDefault();
    if (isNovelClaimsFinalized) {
      return;
    }
    handleFinalizeOpenModal();
  };

  const openFullScreen = () => setIsFullScreenOpen(true);
  const closeFullScreen = () => setIsFullScreenOpen(false);

  const handleAmendedClaimOpenModal = () => setShowAmendedModal(true);
  const handleAmendedClaimCloseModal = () => setShowAmendedModal(false);

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
    if (
      isNovelClaimsLoading ||
      !docketData?.novelData?.amendedClaim ||
      isNovelAmendmentClaimsLoading
    ) {
      return;
    }
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isNovelFeaturesAmendmentClaimsLoading",
        value: true,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isNovelFeaturesAmendmentClaimsLoading",
        value: false,
      })
    );
    dispatch(
      setApplicationRejections({
        rejectionId: activeDocketId,
        name: "isNovelFeaturesClaimsAmended",
        value: true,
      })
    );
  };

  const analyseNovelFeatures = async (applicationId, docketId) => {
    try {
      if (isNovelClaimsLoading) {
        return toast.info("Claims are already being generated!");
      }
      let response;
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isNovelFeaturesLoading",
          value: true,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isNovelFeaturesClaimsAmended",
          value: false,
        })
      );
      if (docketData.rejectionType === "102") {
        response = await post("/tabs/102/novelfeatures", {
          token: authUser.token,
          data: docketData,
        });
      } else if (docketData.rejectionType === "103") {
        response = await post("/tabs/103/novelfeatures", {
          token: authUser.token,
          data: docketData,
        });
      }
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "novelData",
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
          name: "isNovelFeaturesLoading",
          value: false,
        })
      );
    }
  };

  const handleDownload = (panel) => {
    console.log(`Download clicked for ${panel}`);
  };

  const fetchAmendedClaim = async () => {
    try {
      setIsAmendedClaimLoading(true);
      setIsAmendedClaimFailed(false);
      const response = await post("/application/fetchLatestAmendedClaim", {
        token: authUser.token,
        applicationId: activeApplicationId,
        rejectionId: docketData.rejectionId,
      });
      setAmendedClaim(response.data.data);
    } catch (error) {
      if (enviroment === "development") {
        console.log(error);
      }
      if (error.response?.status === 401 || error.response?.status === 404) {
        dispatch(clearDocketState());
        dispatch(clearUserSlice());
      } else {
        toast.error("Failed to fetch amended claim");
      }
      setIsAmendedClaimFailed(true);
    } finally {
      setIsAmendedClaimLoading(false);
    }
  };

  const handleViewCurrentDetails = () => {
    if (isAmendedClaimFailed || isAmendedClaimLoading) {
      return;
    }
    handleAmendedClaimOpenModal();
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
        docketData?.novelData &&
        !Object.keys(docketData?.novelData).length &&
        !isNovelClaimsLoading) ||
      (docketData &&
        Object.keys(docketData).length &&
        docketData.novelData === undefined &&
        !isNovelClaimsLoading)
    ) {
      analyseNovelFeatures(activeApplicationId, activeDocketId);
    }
  }, [docketData]);

  useEffect(() => {
    if (docketData && docketData.finalizedType) {
      fetchAmendedClaim();
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
          title="Novel Features"
          subtitle="Unique features absent in the cited art."
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
              isClaimsLoading={isNovelAmendmentClaimsLoading}
              onFullScreen={
                leftViewMode === "Table" &&
                !isNovelClaimsLoading &&
                docketData?.novelData?.comparisonTable
                  ? openFullScreen
                  : null
              }
            >
              <div className="h-full bg-gray-50 rounded border border-gray-200 py-3 px-5 overflow-y-auto overflow-x-hidden relative">
                {isNovelClaimsLoading ? (
                  <OrbitingRingsLoader />
                ) : !docketData?.novelData?.comparisonTable ? (
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
                      {docketData.novelData.comparisonTable.map(
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
                    {docketData.novelData.comparisonTable.map(
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
                  isNovelClaimsLoading || isNovelAmendmentClaimsLoading
                    ? ""
                    : isNovelClaimsAmended
                    ? ""
                    : "animate-pulse"
                }`}
                onClick={handleAmendClaimsClick}
                disabled={
                  isNovelClaimsLoading ||
                  isNovelClaimsAmended ||
                  isNovelAmendmentClaimsLoading
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
                {isNovelClaimsAmended
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
                isNovelClaimsAmended &&
                !isNovelClaimsLoading &&
                rightViewMode === "Suggested Amendment"
                  ? handleFinalizeClick
                  : null
              }
              isClaimsFinalized={isNovelClaimsFinalized}
            >
              <div className="h-full bg-gray-50 rounded border border-gray-200 py-3 px-5 overflow-y-auto">
                {isNovelAmendmentClaimsLoading ? (
                  <OrbitingRingsLoader />
                ) : !isNovelClaimsAmended || isNovelClaimsLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">
                      {rightViewMode === "Suggested Amendment"
                        ? "Suggested Claim Amendment would appear here"
                        : "Rejected Claim would appear here"}
                    </p>
                  </div>
                ) : rightViewMode === "Suggested Amendment" &&
                  docketData?.novelData?.amendedClaim ? (
                  <div className="space-y-4">
                    <p className="text-[1rem] text-justify leading-relaxed">
                      <span className="font-semibold text-gray-800">
                        {docketData.rejectedClaims?.[0]}.
                      </span>{" "}
                      {docketData.novelData.amendedClaim.preamble}
                    </p>
                    <ul className="list-disc pl-5">
                      {docketData.novelData.amendedClaim.elements.map(
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
                      {docketData.novelData.amendedClaim.additionalElements.map(
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
                    {docketData.novelData.amendmentStrategy && (
                      <div className="pt-4 border-t border-gray-200 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Amendment Strategy:
                        </h3>
                        <p className="text-sm text-gray-700 text-justify leading-relaxed">
                          {docketData.novelData.amendmentStrategy}
                        </p>
                      </div>
                    )}
                  </div>
                ) : rightViewMode === "Rejected Claim" &&
                  docketData?.novelData?.rejectedClaim ? (
                  <div className="flex justify-center space-x-2">
                    <span className="font-semibold text-gray-800 pt-[1px]">
                      {docketData.rejectedClaims?.[0]}.
                    </span>{" "}
                    <p
                      className="text-[1rem] text-justify leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: formatTextByDelimiter(
                          docketData.novelData.rejectedClaim
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
        message="This will regenerate the novel features and amendment claims suggestion."
        confirmButtonText="Regenerate"
        cancelButtonText="Cancel"
      />
      <FinalizeConfirmationModal
        isOpen={isFinalizeModalOpen}
        onClose={handleFinalizeCloseModal}
        onConfirm={handleFinalizeConfirmation}
        onViewDetails={
          docketData &&
          docketData.finalizedType &&
          Object.keys(amendedClaim).length
            ? handleViewCurrentDetails
            : null
        }
        title={
          docketData && docketData.finalizedType
            ? "Replace Existing Amendment?"
            : "Finalize Amendment?"
        }
        message="Do you want to finalize this claim amendment for response generation?"
        confirmButtonText={
          docketData && docketData.finalizedType ? "Replace" : "Finalize"
        }
        cancelButtonText="Cancel"
        currentFinalizedText="CURRENTLY FINALIZED"
        sourceTabText={
          docketData && docketData.finalizedType
            ? getAmendmentTitle(docketData.finalizedType)
            : ""
        }
        warningNoteText={
          docketData && docketData.finalizedType
            ? "This will replace the existing finalized amendment"
            : ""
        }
        isAmendedClaimFailed={isAmendedClaimFailed}
        isAmendedClaimLoading={isAmendedClaimLoading}
      />
      <FullScreenTable
        isOpen={isFullScreenOpen}
        onClose={closeFullScreen}
        tableData={docketData?.novelData?.comparisonTable}
        tableHeading="Novel Features Table"
      />
      <AmendedClaimModal
        isOpen={showAmendedModal}
        onClose={handleAmendedClaimCloseModal}
        heading={
          docketData && docketData.finalizedType
            ? getAmendmentTitle(docketData.finalizedType)
            : ""
        }
        amendedClaim={amendedClaim?.amendedClaim}
        amendmentStrategy={amendedClaim?.amendmentStrategy}
      />
    </>
  );
};

export default NovelFeatures;
