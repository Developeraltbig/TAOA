import "./OrbitingRingsLoader.css";

const OrbitingRingsLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-600">
      <div className="text-xl font-semibold mb-6">Generating Response ...</div>
      <div className="folding-cube-container">
        <div className="folding-cube-item"></div>
        <div className="folding-cube-item"></div>
        <div className="folding-cube-item"></div>
        <div className="folding-cube-item"></div>
      </div>
    </div>
  );
};

export default OrbitingRingsLoader;
