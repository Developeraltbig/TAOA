const ApplicationAnalyseSkeleton = () => {
  const skeleton = Array(1).fill(null);
  return (
    <section className="space-y-6">
      {skeleton.map((_, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-l from-[#e6eefa] to-[#f0faf4] rounded-xl px-6 py-6 sm:px-8 sm:py-8 h-fit shadow-lg flex flex-col gap-6 max-[425px]:px-2 max-[375px]:px-1 animate-pulse"
        >
          <div className="h-5 w-2/4 rounded bg-gray-200"></div>
          <div className="flex flex-col gap-3">
            <div className="h-[18px] w-1/5 rounded bg-gray-200"></div>
            <div className="w-full flex flex-wrap gap-3">
              <div className="size-9 rounded-full bg-gray-200"></div>
              <div className="size-9 rounded-full bg-gray-200"></div>
              <div className="size-9 rounded-full bg-gray-200"></div>
            </div>
          </div>
          <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            <div className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-6 py-4 shadow-lg flex flex-col gap-4 border border-gray-300">
              <div className="bg-gray-200 w-4/5 rounded h-[18px]"></div>
              <div className="bg-gray-200 h-20 rounded-md"></div>
            </div>
            <div className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-6 py-4 shadow-lg flex flex-col gap-4 border border-gray-300">
              <div className="bg-gray-200 w-4/5 rounded h-[18px]"></div>
              <div className="bg-gray-200 h-20 rounded-md"></div>
            </div>
            <div className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-6 py-4 shadow-lg flex flex-col gap-4 border border-gray-300">
              <div className="bg-gray-200 w-4/5 rounded h-[18px]"></div>
              <div className="bg-gray-200 h-20 rounded-md"></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] rounded-xl px-6 py-4 shadow-lg w-full border border-gray-300 flex flex-col gap-4">
            <div className="h-[18px] w-1/6 rounded bg-gray-200"></div>
            <div className="h-12 rounded w-full bg-gray-200"></div>
          </div>

          <div className="w-full flex items-center justify-end">
            <div className="h-12 rounded-md shadow-md w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6 bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] border border-gray-300"></div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default ApplicationAnalyseSkeleton;
