const AllApplicationsSkeleton = () => {
  return (
    <div className="w-full animate-pulse">
      <table className="w-full border-collapse border border-gray-300 text-center">
        <thead>
          <tr className="bg-[#0284c7]">
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
            <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
              101
            </th>
            <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
              102
            </th>
            <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2 border-r border-gray-300">
              103
            </th>
            <th className="py-2 px-4 text-md font-bold text-white max-[425px]:px-2">
              121
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-200 ${
                rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <td className="py-3 px-4 max-[425px]:px-2 border-r border-gray-300">
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </td>
              <td className="py-3 px-4 max-[425px]:px-2 border-r border-gray-300">
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </td>
              <td className="py-3 px-4 max-[425px]:px-2 border-r border-gray-300">
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </td>
              <td className="py-3 px-4 max-[425px]:px-2 border-r border-gray-300">
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </td>
              <td className="py-3 px-4 max-[425px]:px-2 border-r border-gray-300">
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </td>
              <td className="py-3 px-4 max-[425px]:px-2">
                <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllApplicationsSkeleton;
