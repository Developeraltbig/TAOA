import { useEffect, useState } from "react";

const DocketsToggleButtons = ({
  options,
  defaultSelected,
  onSelectionChange,
}) => {
  const [selected, setSelected] = useState(defaultSelected || options[0]);

  const handleSelection = (option) => {
    setSelected(option);
    onSelectionChange?.(option);
  };

  useEffect(() => {
    setSelected(defaultSelected || options[0]);
  }, [defaultSelected]);

  return (
    <>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSelection(option)}
          className={`px-6 py-2 text-sm font-medium transition-colors rounded-md border border-gray-300 w-fit h-[2.35rem] cursor-pointer shadow-sm ${
            selected === option
              ? "bg-gray-200 text-gray-900"
              : "bg-white text-gray-600 hover:bg-gray-100"
          } `}
        >
          {option}
        </button>
      ))}
    </>
  );
};

export default DocketsToggleButtons;
