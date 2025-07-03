export const getAmendmentTitle = (type) => {
  const titles = {
    technicalComparison: "Technical Comparison Amendment",
    novelFeatures: "Novel Features Amendment",
    dependentClaims: "Dependent Claims Amendment",
    compositeAmendment: "Composite Amendment",
    oneFeatures: "One Features Amendment",
  };
  return titles[type] || "Amendment";
};
