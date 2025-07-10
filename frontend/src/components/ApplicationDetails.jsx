import { useDispatch } from "react-redux";
import { formatDate } from "../helpers/dateFormatter";
import { BookOpen, ExternalLink } from "lucide-react";
import { setIsClaimStatusModalOpen } from "../store/slices/modalsSlice";

const ApplicationDetails = ({ data, showTutorial }) => {
  const dispatch = useDispatch();

  if (!data) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg mb-6 animate-fadeIn application-details-section border border-blue-100">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-purple-600 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Project - {data.applicationNumber}
            </h3>
            <p className="text-sm text-gray-500">Application Details</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md mb-4 border border-blue-100">
          <h4 className="text-sm font-medium text-gray-500 mb-1">
            Invention Title
          </h4>
          <p className="font-medium text-gray-900">
            {data.applicationDetails?.inventionTitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md border border-blue-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Publication Number
            </h4>
            <a
              href={`https://patents.google.com/patent/${data.publicationNumber}/en`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              {data.publicationNumber}
              <ExternalLink size={16} />
            </a>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md border border-blue-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Filing Date
            </h4>
            <p className="font-medium text-gray-900">
              {formatDate(data.applicationDetails?.lastFilingDate)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md border border-blue-100">
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Claim Status
            </h4>
            <button
              onClick={() => {
                if (!showTutorial) {
                  dispatch(setIsClaimStatusModalOpen(true));
                }
              }}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Check Claim Status
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApplicationDetails;
