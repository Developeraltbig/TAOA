import { useSelector } from "react-redux";
import DocketsSkeleton from "../skeletons/DocketsSkeleton";

const HeaderSection = ({ title, subtitle, patents, loading }) => {
  const isSidebarMenuVisible = useSelector(
    (state) => state.modals.isSidebarMenuVisible
  );

  return (
    <div className="mb-16">
      <div
        className={`flex flex-col 2xl:flex-row 2xl:justify-between gap-8 ${
          isSidebarMenuVisible ? "" : "xl:flex-row xl:justify-between"
        }`}
      >
        <div className="w-fit shrink-0">
          <h1 className="text-lg font-semibold text-[#3586cb]">{title}</h1>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-4 lg:gap-8">
          {loading ? (
            <DocketsSkeleton />
          ) : (
            <>
              {patents.map((patent, index) => (
                <div key={index} className="text-left h-fit">
                  <h1 className="font-medium text-lg text-[#3586cb]">
                    {patent.number}
                  </h1>
                  <p className="text-gray-600 text-sm">{patent.label}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderSection;
