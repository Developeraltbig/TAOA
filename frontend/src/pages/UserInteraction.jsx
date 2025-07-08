import { toast } from "react-toastify";
import {
  setDocketId,
  clearUserSlice,
  setApplicationId,
  setApplicationRejections,
} from "../store/slices/authUserSlice";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bot, Send, User } from "lucide-react";
import { post } from "../services/ApiEndpoint";
import {
  clearShowState,
  clearDocketState,
} from "../store/slices/applicationDocketsSlice";
import { useDispatch, useSelector } from "react-redux";
import { handleDownload } from "../helpers/downloadFile";
import OrbitingRingsLoader from "../loaders/OrbitingRingsLoader";
import DocketsContentPanel from "../components/DocketsContentPanel";
import DocketsHeaderSection from "../components/DocketsHeaderSection";
import DocketsToggleButtons from "../components/DocketsToggleButtons";

const getPanel = (chatHistory) => {
  return chatHistory[0]?.text.includes("basis") ? "right" : "left";
};

const getKey = (chatHistory) => {
  if (chatHistory[0].text.includes("Technical Comparison")) {
    return "technicalData";
  } else if (chatHistory[0].text.includes("Novel Features")) {
    return "novelData";
  } else if (chatHistory[0].text.includes("Dependent Claims")) {
    return "dependentData";
  } else if (chatHistory[0].text.includes("Composite Amendments")) {
    return "compositeData";
  } else if (chatHistory[0].text.includes("One Features")) {
    return "oneFeaturesData";
  }
};

const UserInteraction = () => {
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const [docketData, setDocketData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [responseData, setResponseData] = useState(null);
  const [leftViewMode, setLeftViewMode] = useState("Table");
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const latestApplications = useSelector(
    (state) => state.applications.latestApplication
  );
  const isLatestApplicationLoading = useSelector(
    (state) => state.loading.isLatestApplicationLoading
  );
  const authUser = useSelector((state) => state.user.authUser);
  const activeDocketId = useSelector((state) => state.user.docketId);
  const activeApplicationId = useSelector((state) => state.user.applicationId);

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

  const quickQuestions = [
    {
      category: "Technical Comparison",
      questions: [
        "View Technical Comparison",
        "Claim Amendments basis Technical Comparison",
      ],
    },
    {
      category: "Novel Features",
      questions: [
        "View Novel Features",
        "Claim Amendments basis Novel Features",
      ],
    },
    {
      category: "Dependent Claims",
      questions: [
        "View Dependent Claims",
        "Claim Amendments basis Dependent Claims",
      ],
    },
    {
      category: "Composite Amendments",
      questions: [
        "View Composite Amendments",
        "Claim Amendments basis Composite Amendments",
      ],
    },
    {
      category: "One Features",
      questions: ["View One Features", "Claim Amendments basis One Features"],
    },
    // {
    //   category: "OA Analysis",
    //   questions: [
    //     "Summary and Key features of Subject application",
    //     "Summary and Key features of each of the cited arts",
    //     "Features for filing a divisional or continuation",
    //   ],
    // },
  ];

  const currentApplicationRejections = useSelector(
    (state) => state.user.applicationRejections[activeDocketId]
  );
  const isTechnicalClaimsLoading =
    currentApplicationRejections?.isTechnicalComparisonLoading;
  const isNovelClaimsLoading =
    currentApplicationRejections?.isNovelFeaturesLoading;
  const isDependentClaimsLoadingState =
    currentApplicationRejections?.isDependentClaimsLoading;
  const isCompositeClaimsLoading =
    currentApplicationRejections?.isCompositeAmendmentLoading;
  const isOneFeaturesClaimsLoading =
    currentApplicationRejections?.isOneFeaturesLoading;

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

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
  };

  const handleSendMessage = async () => {
    if (!selectedQuestion || isLoading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: selectedQuestion,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setChatHistory([userMessage]);

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (
      selectedQuestion.toLowerCase().includes("view") ||
      selectedQuestion.toLowerCase().includes("basis")
    ) {
      if (selectedQuestion.toLowerCase().includes("technical comparison")) {
        if (
          docketData?.technicalData &&
          Object.keys(docketData?.technicalData).length
        ) {
          if (selectedQuestion.toLowerCase().includes("view")) {
            setResponseData(docketData.technicalData.comparisonTable);
          } else {
            setResponseData(docketData.technicalData.amendedClaim);
          }
        } else {
          await analyseTechnicalComparison(activeApplicationId, activeDocketId);
        }
      } else if (selectedQuestion.toLowerCase().includes("novel features")) {
        if (
          docketData?.novelData &&
          Object.keys(docketData?.novelData).length
        ) {
          if (selectedQuestion.toLowerCase().includes("view")) {
            setResponseData(docketData.novelData.comparisonTable);
          } else {
            setResponseData(docketData.novelData.amendedClaim);
          }
        } else {
          await analyseNovelFeatures(activeApplicationId, activeDocketId);
        }
      } else if (selectedQuestion.toLowerCase().includes("dependent claims")) {
        if (
          docketData?.dependentData &&
          Object.keys(docketData?.dependentData).length
        ) {
          if (selectedQuestion.toLowerCase().includes("view")) {
            setResponseData(docketData.dependentData.comparisonTable);
          } else {
            setResponseData(docketData.dependentData.amendedClaim);
          }
        } else {
          await analyseDependentComparison(activeApplicationId, activeDocketId);
        }
      } else if (
        selectedQuestion.toLowerCase().includes("composite amendments")
      ) {
        if (
          docketData?.compositeData &&
          Object.keys(docketData?.compositeData).length
        ) {
          if (selectedQuestion.toLowerCase().includes("view")) {
            setResponseData(docketData.compositeData.comparisonTable);
          } else {
            setResponseData(docketData.compositeData.amendedClaim);
          }
        } else {
          await analyseCompositeComparison(activeApplicationId, activeDocketId);
        }
      } else if (selectedQuestion.toLowerCase().includes("one features")) {
        if (
          docketData?.oneFeaturesData &&
          Object.keys(docketData?.oneFeaturesData).length
        ) {
          if (selectedQuestion.toLowerCase().includes("view")) {
            setResponseData(docketData.oneFeaturesData.comparisonTable);
          } else {
            setResponseData(docketData.oneFeaturesData.amendedClaim);
          }
        } else {
          await analyseOneFeatures(activeApplicationId, activeDocketId);
        }
      }
    }

    const aiMessage = {
      id: Date.now() + 1,
      text: "Analysis completed. View the results in the left panel.",
      sender: "ai",
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, aiMessage]);

    setIsLoading(false);
    setSelectedQuestion("");
  };

  const analyseTechnicalComparison = async (applicationId, docketId) => {
    try {
      if (isTechnicalClaimsLoading) {
        return toast.info("Technical Claims are already being generated!");
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
      } else if (docketData.rejectionType === "103") {
        response = await post("/tabs/103/technicalcomparison", {
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
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "showFinalizedType",
          value: false,
        })
      );
      if (selectedQuestion.toLowerCase().includes("view")) {
        setResponseData(response.data.data.comparisonTable);
      } else {
        setResponseData(response.data.data.amendedClaim);
      }
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

  const analyseNovelFeatures = async (applicationId, docketId) => {
    try {
      if (isNovelClaimsLoading) {
        return toast.info("Novel Claims are already being generated!");
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
      if (selectedQuestion.toLowerCase().includes("view")) {
        setResponseData(response.data.data.comparisonTable);
      } else {
        setResponseData(response.data.data.amendedClaim);
      }
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

  const analyseDependentComparison = async (applicationId, docketId) => {
    try {
      if (isDependentClaimsLoadingState) {
        return toast.info("Dependent Claims are already being generated!");
      }
      let response;
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isDependentClaimsLoading",
          value: true,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isDependentClaimsAmended",
          value: false,
        })
      );
      if (docketData.rejectionType === "102") {
        response = await post("/tabs/102/dependentclaims", {
          token: authUser.token,
          data: docketData,
        });
      } else if (docketData.rejectionType === "103") {
        response = await post("/tabs/103/dependentclaims", {
          token: authUser.token,
          data: docketData,
        });
      }
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "dependentData",
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
      if (selectedQuestion.toLowerCase().includes("view")) {
        setResponseData(response.data.data.comparisonTable);
      } else {
        setResponseData(response.data.data.amendedClaim);
      }
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
          name: "isDependentClaimsLoading",
          value: false,
        })
      );
    }
  };

  const analyseCompositeComparison = async (applicationId, docketId) => {
    try {
      if (isCompositeClaimsLoading) {
        return toast.info("Composite Claims are already being generated!");
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
      if (selectedQuestion.toLowerCase().includes("view")) {
        setResponseData(response.data.data.comparisonTable);
      } else {
        setResponseData(response.data.data.amendedClaim);
      }
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

  const analyseOneFeatures = async (applicationId, docketId) => {
    try {
      if (isOneFeaturesClaimsLoading) {
        return toast.info("One Features Claims are already being generated!");
      }
      let response;
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isOneFeaturesLoading",
          value: true,
        })
      );
      dispatch(
        setApplicationRejections({
          rejectionId: activeDocketId,
          name: "isOneFeaturesClaimsAmended",
          value: false,
        })
      );
      if (docketData.rejectionType === "102") {
        response = await post("/tabs/102/onefeatures", {
          token: authUser.token,
          data: docketData,
        });
      } else if (docketData.rejectionType === "103") {
        response = await post("/tabs/103/onefeatures", {
          token: authUser.token,
          data: docketData,
        });
      }
      dispatch(
        updateDocketData({
          applicationId: applicationId,
          docketId: docketId,
          name: "oneFeaturesData",
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
      if (selectedQuestion.toLowerCase().includes("view")) {
        setResponseData(response.data.data.comparisonTable);
      } else {
        setResponseData(response.data.data.amendedClaim);
      }
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
          name: "isOneFeaturesLoading",
          value: false,
        })
      );
    }
  };

  useEffect(() => {
    if (activeDocketId && activeApplicationId) {
      fetchDocketData();
    }
  }, [latestApplications, activeDocketId, activeApplicationId]);

  useEffect(() => {
    if (
      (responseData && !Array.isArray(responseData)) ||
      (chatHistory &&
        chatHistory.length &&
        chatHistory[0].text.includes("basis"))
    ) {
      setLeftViewMode("Paragraph");
    }
  }, [responseData, chatHistory]);

  if ((!isLatestApplicationLoading && docketData === null) || !activeDocketId) {
    return <Navigate to="/application" />;
  } else if (!activeApplicationId && !activeDocketId) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-full px-4 sm:px-8 md:px-12 lg:px-16 py-18 bg-gray-50">
      <DocketsHeaderSection
        title="Interact With Subject Application And Cited Arts"
        subtitle="Formulate targeted questions to gain a deeper understanding of the subject application and the cited prior arts."
        patents={patentData}
        loading={isLatestApplicationLoading && docketData !== null}
      />

      <div className="flex flex-col xl:flex-row gap-10 space-y-6 xl:space-y-0 xl:h-[600px] p-3 sm:p-0">
        {/* Left Panel - Response Display */}
        <div className="h-[600px] xl:w-[calc(50%-20px)]">
          <DocketsContentPanel
            headerContent={
              <DocketsToggleButtons
                options={[
                  ...((chatHistory &&
                    chatHistory.length &&
                    chatHistory[0].text.includes("basis")) ||
                  (responseData && !Array.isArray(responseData))
                    ? []
                    : ["Table"]),
                  "Paragraph",
                ]}
                defaultSelected={leftViewMode}
                onSelectionChange={setLeftViewMode}
              />
            }
            onDownload={
              !responseData || isLoading
                ? null
                : () =>
                    handleDownload(
                      activeApplicationId,
                      docketData,
                      getKey(chatHistory),
                      getPanel(chatHistory)
                    )
            }
          >
            <div className="h-full bg-white rounded border border-gray-200 py-3 px-5 overflow-y-auto overflow-x-hidden relative">
              {isLoading ? (
                <OrbitingRingsLoader />
              ) : !responseData ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Bot size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    Select a query and click send to see the analysis
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
                    {responseData.map((comparison, index) => (
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
                    ))}
                  </tbody>
                </table>
              ) : Array.isArray(responseData) ? (
                <ul className="list-none">
                  {responseData.map((comparison, index) => {
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
                  })}
                </ul>
              ) : (
                <div className="space-y-4">
                  <p className="text-[1rem] text-justify leading-relaxed">
                    <span className="font-semibold text-gray-800">
                      {docketData.rejectedClaims?.[0]}.
                    </span>{" "}
                    {responseData.preamble}
                  </p>
                  <ul className="list-disc pl-5">
                    {responseData.elements.map((element, index) => {
                      return (
                        <li key={index} className="mb-2">
                          <p className="text-[0.95rem] text-justify flex-1 leading-relaxed">
                            {element.text}
                          </p>
                        </li>
                      );
                    })}
                    {responseData.additionalElements.map((element, index) => {
                      return (
                        <li key={index} className="mb-2">
                          <p className="text-[0.95rem] text-justify flex-1 leading-relaxed">
                            {element.text}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </DocketsContentPanel>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="h-[600px] xl:w-[calc(50%-20px)]">
          <DocketsContentPanel title="AI Assistant">
            <div className="h-full flex flex-col bg-white rounded border border-gray-200">
              {/* Chat Messages Area */}
              <div className="max-h-[250px] p-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Bot size={40} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Select a question below to start the analysis
                    </p>
                  </div>
                ) : (
                  chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.sender === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-[#3586cb] flex items-center justify-center flex-shrink-0">
                          <Bot size={18} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          message.sender === "user"
                            ? "bg-[#3586cb] text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                      {message.sender === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-[#3586cb] flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Questions */}
              <div className="border-t border-gray-200 p-3 bg-gray-50 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {quickQuestions.map((category, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-semibold text-gray-600 px-1">
                        {category.category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {category.questions.map((question, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleQuestionClick(question)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                              selectedQuestion === question
                                ? "bg-[#3586cb] text-white border-[#3586cb]"
                                : "bg-white border-gray-300 hover:border-[#3586cb] hover:text-[#3586cb]"
                            }`}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={selectedQuestion}
                    readOnly
                    placeholder="Select a question from above..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!selectedQuestion || isLoading}
                    className="px-4 py-2 bg-[#3586cb] text-white rounded-lg cursor-pointer hover:bg-[#2b6faa] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                  >
                    <Send size={18} />
                    Ask
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select a predefined question to analyze your patent
                  application
                </p>
              </div>
            </div>
          </DocketsContentPanel>
        </div>
      </div>
    </div>
  );
};

export default UserInteraction;
