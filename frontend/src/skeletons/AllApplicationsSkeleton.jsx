const AllApplicationsSkeleton = () => {
  return (
    <div className="flex-grow animate-pulse">
      {/* Table Skeleton */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full table-auto">
          {/* Table Header Skeleton */}
          <thead className="bg-[#0284c7]">
            <tr>
              <th className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </th>
              <th className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </th>
            </tr>
          </thead>
          {/* Table Body Rows Skeleton */}
          <tbody>
            {[...Array(4)].map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-6 py-5 whitespace-nowrap border-t border-gray-100">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap border-t border-gray-100 text-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto"></div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap border-t border-gray-100 text-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto"></div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap border-t border-gray-100 text-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto"></div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap border-t border-gray-100 text-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto"></div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap border-t border-gray-100">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info Skeleton */}
      <div className="mt-4 text-gray-500 text-sm">
        <div className="h-4 bg-gray-300 rounded w-1/2 lg:w-2/5"></div>
      </div>
    </div>
  );
};

export default AllApplicationsSkeleton;
