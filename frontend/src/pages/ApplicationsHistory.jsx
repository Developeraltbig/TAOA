import {
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
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

const formatDate = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "-";
  }

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };

  return date.toLocaleDateString("en-US", options);
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalItems = searchedApplications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApplications = searchedApplications.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleInputChange = (event) => {
    if (!isNaN(event.target.value)) {
      setSearchValue(event.target.value);
      setCurrentPage(1);
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

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
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
      <div className="min-h-full bg-gray-50 px-4 sm:px-8 md:px-12 lg:px-16 py-18">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Projects</h1>
          <p className="text-base text-slate-600">
            Track and manage your patent application rejections
          </p>
        </div>

        <div className="relative max-w-md mb-8">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
          <input
            type="search"
            className="w-full py-3 pl-11 pr-4 border-2 border-slate-200 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:shadow-outline-blue bg-white"
            placeholder="Search by application number"
            aria-label="Search by application number"
            value={searchValue}
            onChange={handleInputChange}
            required
          />
        </div>

        {isAllApplicationsLoading ? (
          <AllApplicationsSkeleton />
        ) : searchedApplications.length ? (
          <>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full table-auto">
                <thead className="bg-[#3586cb]">
                  <tr className="text-white">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Application Number
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      §101
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      §102
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      §103
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      §112
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Last Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentApplications.map((project, index) => {
                    const { reject101, reject102, reject103, reject112 } =
                      filterRejection(project.rejections);
                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-5 whitespace-nowrap border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-base">
                              {project.applicationNumber}
                            </span>
                            <button
                              onClick={(e) =>
                                handleApplicationClick(
                                  project.applicationNumber,
                                  e
                                )
                              }
                              className="cursor-pointer"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap border-t border-slate-100 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-semibold ${
                              reject101
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {reject101 ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap border-t border-slate-100 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-semibold ${
                              reject102
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {reject102 ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap border-t border-slate-100 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-semibold ${
                              reject103
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {reject103 ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap border-t border-slate-100 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-semibold ${
                              reject112
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {reject112 ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap border-t border-slate-100">
                          <span className="text-slate-600 text-sm">
                            {formatDate(project.updatedAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
                {totalItems} applications
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage === 1
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-200 cursor-pointer"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => page !== "..." && handlePageChange(page)}
                    disabled={page === "..."}
                    className={`min-w-[40px] h-10 px-2 rounded-md transition-colors cursor-pointer ${
                      page === currentPage
                        ? "bg-blue-500 text-white font-medium"
                        : page === "..."
                        ? "cursor-default text-slate-400"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage === totalPages
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-200 cursor-pointer"
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="mt-4 text-slate-500 text-sm">
              <i className="fas fa-info-circle mr-2"></i>
              <strong>Rejection Types:</strong> §101 (Eligibility) • §102 (Prior
              Art) • §103 (Obviousness) • §112 (Specification)
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No projects found</p>
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
