import {
  Table,
  Packer,
  TextRun,
  TableRow,
  Document,
  TableCell,
  Paragraph,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import { store } from "../store/store.js";

export const handleDownload = async (
  activeApplicationId,
  docketData,
  key,
  panel
) => {
  const state = store.getState();
  const enviroment = import.meta.env.VITE_ENV;
  const latestApplications = state.applications.latestApplication;
  const application = latestApplications?.find(
    (app) => app.applicationId === activeApplicationId
  );
  if (!application) {
    return toast.error("Invalid Download! Please try again.");
  }
  let draftData = {};
  draftData.applicationNumber = application.applicationNumber;
  draftData.applicationTitle = application.applicationDetails.inventionTitle;
  draftData.publicationNumber = application.publicationNumber;
  draftData.priorArtReferences = docketData.priorArtReferences;
  draftData.panel = panel;
  draftData.title = getAmendmentTitle(key, panel);
  if (panel === "left") {
    draftData.comparisonTable = docketData[key].comparisonTable;
  } else {
    draftData.amendedClaim = docketData[key].amendedClaim;
    draftData.amendmentStrategy = docketData[key].amendmentStrategy;
    draftData.rejectedClaim = docketData[key].rejectedClaim;
  }
  try {
    await generateDraftDocument(draftData);
    toast.success("Document downloaded successfully!");
  } catch (error) {
    if (enviroment === "development") {
      console.error("Download error:", error);
    }
    toast.error("Failed to generate document. Please try again.");
  }
};

const getAmendmentTitle = (key, panel) => {
  const table = {
    technicalData: "Technical Comparison",
    oneFeaturesData: "One Features",
    novelData: "Novel Features",
    dependentData: "Dependent Claims",
    compositeData: "Composite Amendments",
  };
  return `${table[key]} ${panel === "left" ? "Table" : "Amendment"}`;
};

const createTextRun = (text, options = {}) => {
  const textString = text !== null && text !== undefined ? String(text) : "";

  return new TextRun({
    text: textString,
    font: "Arial",
    ...options,
  });
};

const createComparisonTable = (comparisonData) => {
  const cellMargins = {
    top: 100,
    bottom: 100,
    left: 100,
    right: 100,
  };

  const rows = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [createTextRun("Subject Application", { bold: true })],
              keepTogether: true,
            }),
          ],
          width: { size: 33.33, type: WidthType.PERCENTAGE },
          margins: cellMargins,
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [createTextRun("Prior Art", { bold: true })],
              keepTogether: true,
            }),
          ],
          width: { size: 33.33, type: WidthType.PERCENTAGE },
          margins: cellMargins,
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                createTextRun("Differentiating Feature", { bold: true }),
              ],
              keepTogether: true,
            }),
          ],
          width: { size: 33.34, type: WidthType.PERCENTAGE },
          margins: cellMargins,
        }),
      ],
    }),
  ];

  if (Array.isArray(comparisonData)) {
    comparisonData.forEach((comparison) => {
      if (comparison) {
        rows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      createTextRun(comparison.subjectApplication || "N/A"),
                    ],
                    keepTogether: true,
                  }),
                ],
                width: { size: 33.33, type: WidthType.PERCENTAGE },
                margins: cellMargins,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [createTextRun(comparison.priorArt || "N/A")],
                    keepTogether: true,
                  }),
                ],
                width: { size: 33.33, type: WidthType.PERCENTAGE },
                margins: cellMargins,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      createTextRun(comparison.differentiatingFeature || "N/A"),
                    ],
                    keepTogether: true,
                  }),
                ],
                width: { size: 33.34, type: WidthType.PERCENTAGE },
                margins: cellMargins,
              }),
            ],
          })
        );
      }
    });
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
};

const generateDraftDocument = async (draftData) => {
  const sections = [];

  // Title Page
  sections.push(
    new Paragraph({
      children: [
        createTextRun("ANALYZING THE OFFICE ACTION", {
          bold: true,
          size: 36,
          underline: {
            type: "single",
          },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      keepTogether: true,
    }),

    new Paragraph({
      children: [
        createTextRun("Application No.: ", { bold: true, size: 24 }),
        createTextRun(String(draftData.applicationNumber || "N/A"), {
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      keepTogether: true,
    }),

    new Paragraph({
      children: [
        createTextRun("Publication No.: ", { bold: true, size: 24 }),
        createTextRun(String(draftData.publicationNumber || "N/A"), {
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      keepTogether: true,
    }),

    new Paragraph({
      children: [
        createTextRun("Invention Title: ", { bold: true, size: 24 }),
        createTextRun(String(draftData.applicationTitle || "N/A"), {
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      keepTogether: true,
    })
  );

  // Prior Art References Section
  if (
    Array.isArray(draftData.priorArtReferences) &&
    draftData.priorArtReferences.length > 0
  ) {
    sections.push(
      new Paragraph({
        children: [
          createTextRun("Prior Art References:", {
            bold: true,
            size: 26,
            underline: {
              type: "single",
            },
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 400, after: 300 },
        keepNext: true,
        keepTogether: true,
      })
    );

    draftData.priorArtReferences.forEach((prior, index) => {
      const isLast = index === draftData.priorArtReferences.length - 1;
      sections.push(
        new Paragraph({
          children: [
            createTextRun(`${index + 1}. `, { bold: true, size: 22 }),
            createTextRun(String(prior.citedPubNo || "Unknown Reference"), {
              size: 22,
            }),
          ],
          indent: { left: 720 },
          spacing: { after: 150 },
          keepNext: !isLast,
          keepTogether: true,
        })
      );
    });
  }

  // Left Panel - Comparison Table
  if (draftData.panel === "left") {
    sections.push(
      new Paragraph({
        children: [
          createTextRun(draftData.title || "Document Content", {
            bold: true,
            size: 28,
            underline: {
              type: "single",
            },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 400 },
        keepNext: true,
        keepTogether: true,
      })
    );

    if (
      Array.isArray(draftData.comparisonTable) &&
      draftData.comparisonTable.length > 0
    ) {
      sections.push(createComparisonTable(draftData.comparisonTable));
    } else {
      sections.push(
        new Paragraph({
          children: [
            createTextRun("No comparison data available", {
              italics: true,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          keepTogether: true,
        })
      );
    }
  }
  // Right Panel - Amendment Details
  else {
    if (draftData.amendedClaim) {
      sections.push(
        new Paragraph({
          children: [
            createTextRun(draftData.title || "Amendment", {
              bold: true,
              size: 28,
              underline: {
                type: "single",
              },
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 600, after: 300 },
          keepNext: true,
          keepTogether: true,
        })
      );

      if (draftData.amendedClaim.preamble) {
        sections.push(
          new Paragraph({
            children: [
              createTextRun(String(draftData.amendedClaim.preamble), {
                size: 22,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 },
            keepTogether: true,
          })
        );
      }

      if (
        Array.isArray(draftData.amendedClaim.elements) &&
        draftData.amendedClaim.elements.length > 0
      ) {
        draftData.amendedClaim.elements.forEach((element, index) => {
          if (element && element.text) {
            sections.push(
              new Paragraph({
                children: [
                  createTextRun(`${index + 1}. `, { bold: true, size: 22 }), // Bold number
                  createTextRun(String(element.text), { size: 22 }), // Regular text
                ],
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 720 },
                spacing: { after: 150 },
                keepTogether: true,
              })
            );
          }
        });
      }

      if (
        Array.isArray(draftData.amendedClaim.additionalElements) &&
        draftData.amendedClaim.additionalElements.length > 0
      ) {
        const startIndex = draftData.amendedClaim.elements
          ? draftData.amendedClaim.elements.length
          : 0;

        draftData.amendedClaim.additionalElements.forEach((element, index) => {
          if (element && element.text) {
            sections.push(
              new Paragraph({
                children: [
                  createTextRun(`${startIndex + index + 1}. `, {
                    bold: true,
                    size: 22,
                  }),
                  createTextRun(String(element.text), { size: 22 }),
                ],
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 720 },
                spacing: { after: 150 },
                keepTogether: true,
              })
            );
          }
        });
      }
    }

    // Amendment Strategy Section
    if (draftData.amendmentStrategy) {
      sections.push(
        new Paragraph({
          children: [
            createTextRun("Amendment Strategy", {
              bold: true,
              size: 26,
              underline: {
                type: "single",
              },
            }),
          ],
          spacing: { before: 600, after: 300 },
          keepNext: true,
          keepTogether: true,
        }),
        new Paragraph({
          children: [
            createTextRun(String(draftData.amendmentStrategy), { size: 22 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 },
          keepTogether: true,
        })
      );
    }

    // Rejected Claim Section
    if (draftData.rejectedClaim) {
      sections.push(
        new Paragraph({
          children: [
            createTextRun("Rejected Claim", {
              bold: true,
              size: 26,
              underline: {
                type: "single",
              },
            }),
          ],
          spacing: { before: 600, after: 300 },
          keepNext: true,
          keepTogether: true,
        }),
        new Paragraph({
          children: [
            createTextRun(String(draftData.rejectedClaim), { size: 22 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          keepTogether: true,
        })
      );
    }
  }

  // Footer
  sections.push(
    new Paragraph({
      children: [
        createTextRun("--- End of Document ---", {
          size: 20,
          italics: true,
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 800 },
      keepTogether: true,
    })
  );

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440, // 1 inch
              bottom: 1440, // 1 inch
              left: 1440, // 1 inch
            },
          },
        },
        children: sections,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt default
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Arial",
            size: 22,
          },
          paragraph: {
            spacing: {
              line: 276,
            },
          },
        },
      ],
    },
  });

  // Generate and save the document
  const blob = await Packer.toBlob(doc);

  // Create a cleaner filename
  const date = new Date().toISOString().split("T")[0];
  const safeTitle = draftData.title
    ? draftData.title.replace(/[^a-zA-Z0-9]/g, "_")
    : "Document";
  const appNumber = draftData.applicationNumber
    ? String(draftData.applicationNumber).replace(/[^a-zA-Z0-9]/g, "_")
    : "Draft";

  const filename = `${safeTitle}_${appNumber}_${date}.docx`;

  saveAs(blob, filename);
};
