const LatestApplicationSkeleton = () => {
  const skeleton = Array(3).fill(null);

  return (
    <div className="space-y-3" role="status" aria-label="Loading projects">
      {skeleton.map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse"
        >
          {/* Project Header Skeleton */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LatestApplicationSkeleton;
