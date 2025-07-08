const ApplicationDetailsSkeleton = () => {
  return (
    <div className="animate-pulse">
      <section className="bg-white rounded-2xl shadow-lg mb-6 p-6 border border-blue-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-full bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-5 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </section>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
        <div className="h-16 bg-gray-200 rounded" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationDetailsSkeleton;
