import {
  Table,
  Packer,
  TextRun,
  TableRow,
  Document,
  TableCell,
  Paragraph,
  PageBreak,
  WidthType,
  BorderStyle,
  HeadingLevel,
  AlignmentType,
} from "docx";
import dotenv from "dotenv";

dotenv.config();
const enviroment = process.env.NODE_ENV;

export const generateDraftDocument = async (draftData) => {
  const sections = [];

  sections.push(
    new Paragraph({
      text: "RESPONSE TO OFFICE ACTION",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Application No.: ${draftData.applicationNumber}`,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Publication No.: ${draftData.publicationNumber}`,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${new Date().toLocaleDateString()}`,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  sections.push(
    new Paragraph({
      text: "Examiner:",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: "Patent Examining Group:",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Art Unit:",
      spacing: { after: 400 },
    })
  );

  sections.push(
    new Paragraph({
      text: "SUMMARY OF REJECTIONS",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 400 },
    })
  );

  draftData.rejections.forEach((rejection, index) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${
              rejection.type
            } Rejection - Claims ${rejection.claims.join(", ")}`,
            bold: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  });

  sections.push(
    new Paragraph({
      text: "DETAILED RESPONSE TO REJECTIONS",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 400 },
    })
  );

  for (const [index, rejection] of draftData.rejections.entries()) {
    sections.push(new PageBreak());

    sections.push(
      new Paragraph({
        text: `${rejection.type} REJECTION`,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Claims Rejected: ${rejection.claims.join(", ")}`,
            bold: true,
          }),
        ],
        spacing: { after: 300 },
      })
    );

    if (rejection.response) {
      if (rejection.response.type !== "other") {
        sections.push(
          new Paragraph({
            text: "Prior Art References:",
            bold: true,
            spacing: { before: 200, after: 200 },
          })
        );

        if (
          rejection.priorArtReferences &&
          rejection.priorArtReferences.length
        ) {
          rejection?.priorArtReferences.forEach((ref) => {
            sections.push(
              new Paragraph({
                text: `• ${ref.citedPubNo}`,
                indent: { left: 400 },
                spacing: { after: 100 },
              })
            );
          });
        }

        sections.push(
          new Paragraph({
            text: getAmendmentTitle(rejection.response.type),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 200 },
          })
        );

        if (
          rejection.response.comparisonTable &&
          rejection.response.comparisonTable.length
        ) {
          sections.push(
            createComparisonTable(rejection.response.comparisonTable)
          );
        }

        if (rejection.response.amendedClaim) {
          sections.push(
            new Paragraph({
              text: "Amended Claim:",
              bold: true,
              spacing: { before: 300, after: 200 },
            }),
            new Paragraph({
              text: rejection.response.amendedClaim.preamble,
              spacing: { after: 200 },
            })
          );

          if (
            rejection.response.amendedClaim.elements &&
            rejection.response.amendedClaim.elements.length
          ) {
            rejection.response.amendedClaim.elements.forEach((element) => {
              sections.push(
                new Paragraph({
                  text: element.text,
                  indent: { left: 400 },
                  spacing: { after: 100 },
                })
              );
            });
          }

          if (
            rejection.response.amendedClaim.additionalElements &&
            rejection.response.amendedClaim.additionalElements.length
          ) {
            rejection.response.amendedClaim.additionalElements.forEach(
              (element) => {
                sections.push(
                  new Paragraph({
                    text: element.text,
                    indent: { left: 400 },
                    spacing: { after: 100 },
                  })
                );
              }
            );
          }
        }

        if (rejection.response.amendmentStrategy) {
          sections.push(
            new Paragraph({
              text: "Amendment Strategy:",
              bold: true,
              spacing: { before: 300, after: 200 },
            }),
            new Paragraph({
              text: rejection.response.amendmentStrategy,
              spacing: { after: 200 },
            })
          );
        }
      } else if (rejection.response.type === "other") {
        sections.push(
          new Paragraph({
            text: "Response:",
            bold: true,
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            text: rejection.response.userResponse,
            spacing: { after: 300 },
          })
        );
      }
    }
  }

  sections.push(
    new PageBreak(),
    new Paragraph({
      text: "CONCLUSION",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "In view of the foregoing amendments and remarks, Applicant respectfully submits that all pending claims are in condition for allowance. Favorable reconsideration and allowance of the application are earnestly solicited.",
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "Respectfully submitted,",
      spacing: { before: 600, after: 400 },
    }),
    new Paragraph({
      text: "_____________________________",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "Attorney Name",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "Registration No.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "Date: " + new Date().toLocaleDateString(),
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    if (enviroment === "development") {
      console.error("Error packing DOCX document:", error);
    }
    throw new Error("Failed to pack DOCX document: " + error.message);
  }
};

const getAmendmentTitle = (type) => {
  const titles = {
    technicalComparison: "Technical Comparison Amendment",
    novelFeatures: "Novel Features Amendment",
    dependentClaims: "Dependent Claims Amendment",
    compositeAmendment: "Composite Amendment",
    oneFeatures: "One Features Amendment",
  };
  return titles[type] || "Amendment";
};

const createComparisonTable = (comparisonData) => {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              text: "Subject Application",
              bold: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              text: "Prior Art",
              bold: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              text: "Differentiating Feature",
              bold: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
  ];

  comparisonData.forEach((comparison) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(comparison.subjectApplication)],
          }),
          new TableCell({
            children: [new Paragraph(comparison.priorArt)],
          }),
          new TableCell({
            children: [new Paragraph(comparison.differentiatingFeature)],
          }),
        ],
      })
    );
  });

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

export default { generateDraftDocument };
