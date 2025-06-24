import { Check } from "lucide-react";
import { toast } from "react-toastify";
import {
  clearUserSlice,
  setApplicationId,
} from "../store/slices/authUserSlice";
import { useEffect, useState } from "react";
import { post } from "../services/ApiEndpoint";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import OrbitingRingsLoader from "../loaders/OrbitingRingsLoader";
import { clearShowState } from "../store/slices/applicationDocketsSlice";
import AllApplicationsSkeleton from "../skeletons/AllApplicationsSkeleton";
import { addOrUpdateApplication } from "../store/slices/latestApplicationsSlice";

const filterRejection = (rejections) => {
  let reject101 = false,
    reject102 = false,
    reject103 = false,
    reject112 = false;
  rejections.forEach((rejection) => {
    reject101 = reject101 ? reject101 : rejection.rejectionType.includes("101");
    reject102 = reject102 ? reject102 : rejection.rejectionType.includes("102");
    reject103 = reject103 ? reject103 : rejection.rejectionType.includes("103");
    reject112 = reject112 ? reject112 : rejection.rejectionType.includes("112");
  });
  return {
    reject101,
    reject102,
    reject103,
    reject112,
  };
};

const ApplicationsHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const enviroment = import.meta.env.VITE_ENV;
  const [searchValue, setSearchValue] = useState("");
  const [allApplications, setAllApplications] = useState([]);
  const authUser = useSelector((state) => state.user.authUser);
  const [isAllApplicationsLoading, setIsAllApplicationsLoading] =
    useState(false);
  const [searchedApplications, setSearchedApplication] = useState([]);
  const [isApplicationFetching, setIsApplicationFetching] = useState(false);

  const handleInputChange = (event) => {
    if (!isNaN(event.target.value)) {
      setSearchValue(event.target.value);
    }
  };

  const fetchApplications = async () => {
    try {
      setIsAllApplicationsLoading(true);
      const response = await post("/application/fetchAllApplication", {
        token: authUser.token,
      });
      setAllApplications(response.data.data);
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
      setIsAllApplicationsLoading(false);
    }
  };

  const handleApplicationClick = async (applicationNumber, e) => {
    e.preventDefault();
    try {
      setIsApplicationFetching(true);
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
      setIsApplicationFetching(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    dispatch(clearShowState());
  }, []);

  useEffect(() => {
    if (!searchValue.length) {
      setSearchedApplication(allApplications);
    } else if (searchValue.length) {
      const filteredApplications = allApplications.filter((application) =>
        String(application.applicationNumber).startsWith(searchValue)
      );
      setSearchedApplication(filteredApplications);
    }
  }, [searchValue, allApplications]);

  return (
    <>
      <div className="min-h-full px-4 sm:px-8 md:px-12 lg:px-16 pt-16 pb-18 flex items-center flex-col gap-12">
        <header className="text-[calc(1rem+0.9vw)] font-[700] w-full">
          <h2>
            Hello,{" "}
            <span className="text-[#38b6ff] font-bold">
              {authUser.name.split(" ")[0]}
            </span>
          </h2>
          <h5>Ready to review your past applications?</h5>
        </header>
        <form
          className="w-4/5 md:w-2/3 lg:w-1/2 shadow-md -shadow-md h-fit rounded-md"
          role="search"
        >
          <input
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
            type="search"
            placeholder="Enter application number"
            aria-label="Enter application number"
            value={searchValue}
            onChange={handleInputChange}
            required
          />
        </form>

        {isAllApplicationsLoading ? (
          <AllApplicationsSkeleton />
        ) : searchedApplications.length ? (
          <table className="w-full border-collapse border border-gray-300 text-center">
            <thead>
              <tr className="bg-[#0284c7]">
                {/* First Row */}
                <th
                  className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300"
                  rowSpan="2"
                >
                  Application No.
                </th>
                <th
                  className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-b border-gray-300"
                  colSpan="4"
                >
                  Rejection Type
                </th>
                <th
                  className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2"
                  rowSpan="2"
                >
                  Last Modified Time
                </th>
              </tr>
              <tr className="bg-[#0284c7]">
                {/* Second Row */}
                <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                  101
                </th>
                <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                  102
                </th>
                <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                  103
                </th>
                <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
                  112
                </th>
              </tr>
            </thead>
            <tbody>
              {searchedApplications.map((application, index) => {
                const { reject101, reject102, reject103, reject112 } =
                  filterRejection(application.rejections);
                const checkMark = (
                  <div className="flex justify-center">
                    <Check color="green" />
                  </div>
                );

                return (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-gray-200" : "bg-white"
                    } hover:bg-gray-200/50`}
                  >
                    <td className="py-2 px-4 text-base font-semibold max-[425px]:px-2 border-r border-gray-300">
                      <span
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={(e) =>
                          handleApplicationClick(
                            application.applicationNumber,
                            e
                          )
                        }
                      >
                        {application.applicationNumber}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-base font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300 text-center">
                      {reject101 ? checkMark : "-"}
                    </td>
                    <td className="py-2 px-4 text-base font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300">
                      {reject102 ? checkMark : "-"}
                    </td>
                    <td className="py-2 px-4 text-base font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300">
                      {reject103 ? checkMark : "-"}
                    </td>
                    <td className="py-2 px-4 text-base font-semibold text-gray-800 max-[425px]:px-2 border-r border-gray-300">
                      {reject112 ? checkMark : "-"}
                    </td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-800 max-[425px]:px-2">
                      {application.updatedAt.split("T")[0]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div>
            <span className="font-semibold text-2xl mt-">
              No Projects Found!
            </span>
          </div>
        )}
      </div>
      {isApplicationFetching && (
        <div className="absolute z-200 w-full h-[calc(100vh+64px)] -mt-16 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60">
          <OrbitingRingsLoader color="white" />
        </div>
      )}
    </>
  );
};

export default ApplicationsHistory;
