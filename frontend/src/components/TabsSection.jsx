import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setDocketId } from "../store/slices/authUserSlice";
import { setShowDocket } from "../store/slices/applicationDocketsSlice";

const TabsSection = ({ data, children }) => {
  const tabs = [
    { href: "/technicalcomparison", tabName: "Technical Comparison" },
    { href: "/novelfeatures", tabName: "Novel Features" },
    { href: "/dependentclaims", tabName: "Dependent Claims" },
    { href: "/compositeamendments", tabName: "Composite Amendments" },
    { href: "/onefeatures", tabName: "One Features" },
    { href: "/userinteraction", tabName: "User Interaction" },
  ];
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const showDocket = useSelector(
    (state) => state.applicationDockets?.showDocket[data._id]
  );

  const toggleShowDocketTab = () => {
    dispatch(
      setShowDocket({
        docketId: data._id,
        showTab: showDocket?.showTab !== undefined ? !showDocket.showTab : true,
      })
    );
    dispatch(setDocketId(data._id));
    if (location.pathname.includes("application")) {
      navigate("/technicalcomparison");
    }
  };

  const handleTabClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <>
      {children && children(toggleShowDocketTab)}
      {showDocket?.showTab && (
        <aside className="space-y-1 pl-2 overflow-hidden flex flex-col truncate">
          {tabs.map((tab, index) => {
            return (
              <button
                key={index}
                onClick={(e) => handleTabClick(e, tab.href)}
                className={`py-1 px-4 w-full rounded-lg font-bold border cursor-pointer border-gray-300 flex items-center gap-2 ${
                  location.pathname.includes(tab.href)
                    ? "bg-white"
                    : "bg-gradient-to-r from-[#eef7ff] to-[#f3fff3]"
                }`}
              >
                <i className="fa-solid fa-bars-staggered"></i>
                <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {tab.tabName}
                </span>
              </button>
            );
          })}
        </aside>
      )}
    </>
  );
};

export default TabsSection;
