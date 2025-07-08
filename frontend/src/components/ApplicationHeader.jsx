const ApplicationHeader = ({ userName }) => {
  return (
    <header className="text-[calc(0.8rem+0.9vw)] font-[700] mb-6 mt-9">
      <h2>
        Hello,{" "}
        <span className="text-blue-500 font-bold">
          {userName.split(" ")[0]}
        </span>
      </h2>
      <h5>Thinking about analyzing Office Actions</h5>
      <h5>(Examination Reports/Search Report) today?</h5>
    </header>
  );
};

export default ApplicationHeader;
