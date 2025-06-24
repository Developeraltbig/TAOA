const LatestApplicationSkeleton = () => {
  const skeleton = Array(3).fill(null);
  return (
    <aside className="space-y-3">
      {skeleton.map((_, idx) => (
        <div
          key={idx}
          className="py-2 px-4 w-full rounded-lg flex items-center gap-2 bg-gradient-to-r from-[#f3fff3] to-[#eef7ff] font-bold border border-gray-300"
        >
          <div className="size-6 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-5 w-4/5 rounded bg-gray-200 animate-pulse"></div>
        </div>
      ))}
    </aside>
  );
};

export default LatestApplicationSkeleton;
