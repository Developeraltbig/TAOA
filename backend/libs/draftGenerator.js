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
  AlignmentType,
} from "docx";
import dotenv from "dotenv";

dotenv.config();
const enviroment = process.env.NODE_ENV;

const createTextRun = (text, options = {}) => {
  return new TextRun({
    text,
    font: "Arial",
    ...options,
  });
};

export const generateDraftDocument = async (draftData) => {
  const sections = [];

  // Title Block
  sections.push(
    new Paragraph({
      children: [
        createTextRun("RESPONSE TO OFFICE ACTION", {
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        createTextRun(
          `Application No.: ${draftData.applicationNumber || "N/A"}`,
          {
            bold: true,
          }
        ),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        createTextRun(
          `Publication No.: ${draftData.publicationNumber || "N/A"}`,
          {
            bold: true,
          }
        ),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [createTextRun(`Date: ${new Date().toLocaleDateString()}`)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // Summary
  sections.push(
    new Paragraph({
      children: [
        createTextRun("SUMMARY OF REJECTIONS", {
          bold: true,
          size: 30,
        }),
      ],
      spacing: { before: 600, after: 400 },
    })
  );

  if (Array.isArray(draftData.rejections)) {
    draftData.rejections.forEach((rejection, index) => {
      const claimsText =
        Array.isArray(rejection.claims) && rejection.claims.length > 0
          ? rejection.claims.join(", ")
          : "N/A";

      sections.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            createTextRun(
              `${index + 1}. ${String(
                rejection.type || "Unknown"
              )} Rejection - Claims ${claimsText}`,
              {
                bold: true,
              }
            ),
          ],
        })
      );
    });
  }

  sections.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  sections.push(
    new Paragraph({
      children: [
        createTextRun("DETAILED RESPONSE TO REJECTIONS", {
          bold: true,
          size: 30,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 400 },
    })
  );

  if (Array.isArray(draftData.rejections)) {
    for (const [index, rejection] of draftData.rejections.entries()) {
      const claimsText =
        Array.isArray(rejection.claims) && rejection.claims.length > 0
          ? rejection.claims.join(", ")
          : "N/A";

      sections.push(
        new Paragraph({
          children: [
            createTextRun(
              `${index + 1}. ${String(rejection.type || "Unknown")} REJECTION`,
              {
                bold: true,
                size: 28,
              }
            ),
          ],
          spacing: { after: 300 },
        }),
        new Paragraph({
          spacing: { after: 300 },
          children: [
            createTextRun(`Claims Rejected: ${claimsText}`, {
              bold: true,
            }),
          ],
        })
      );

      if (rejection.response) {
        if (rejection.response.type !== "other") {
          sections.push(
            new Paragraph({
              spacing: { before: 200, after: 200 },
              children: [
                createTextRun("Prior Art References:", {
                  bold: true,
                }),
              ],
            })
          );

          if (
            Array.isArray(rejection.priorArtReferences) &&
            rejection.priorArtReferences.length > 0
          ) {
            rejection.priorArtReferences.forEach((ref) => {
              sections.push(
                new Paragraph({
                  children: [
                    createTextRun(
                      `• ${String(ref?.citedPubNo || "Unknown Reference")}`
                    ),
                  ],
                  indent: { left: 400 },
                  spacing: { after: 100 },
                })
              );
            });
          } else {
            sections.push(
              new Paragraph({
                children: [createTextRun("• No prior art references listed")],
                indent: { left: 400 },
                spacing: { after: 100 },
              })
            );
          }

          sections.push(
            new Paragraph({
              children: [
                createTextRun(getAmendmentTitle(rejection.response.type), {
                  bold: true,
                  size: 24,
                }),
              ],
              keepNext: true,
              keepLines: true,
              spacing: { before: 400, after: 200 },
            })
          );

          if (
            Array.isArray(rejection.response.comparisonTable) &&
            rejection.response.comparisonTable.length > 0
          ) {
            sections.push(
              createComparisonTable(rejection.response.comparisonTable)
            );
          }

          if (rejection.response.amendedClaim) {
            sections.push(
              new Paragraph({
                spacing: { before: 300, after: 200 },
                children: [
                  createTextRun("Amended Claim:", {
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  createTextRun(
                    String(
                      rejection.response.amendedClaim?.preamble ||
                        "No preamble provided"
                    )
                  ),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 },
              })
            );

            if (Array.isArray(rejection.response.amendedClaim.elements)) {
              rejection.response.amendedClaim.elements.forEach((element) => {
                if (element && element.text) {
                  sections.push(
                    new Paragraph({
                      children: [createTextRun(String(element.text))],
                      alignment: AlignmentType.JUSTIFIED,
                      indent: { left: 400 },
                      spacing: { after: 100 },
                    })
                  );
                }
              });
            }

            if (
              Array.isArray(rejection.response.amendedClaim.additionalElements)
            ) {
              rejection.response.amendedClaim.additionalElements.forEach(
                (element) => {
                  if (element && element.text) {
                    sections.push(
                      new Paragraph({
                        children: [createTextRun(String(element.text))],
                        alignment: AlignmentType.JUSTIFIED,
                        indent: { left: 400 },
                        spacing: { after: 100 },
                      })
                    );
                  }
                }
              );
            }
          }

          if (rejection.response.amendmentStrategy) {
            sections.push(
              new Paragraph({
                spacing: { before: 300, after: 200 },
                children: [
                  createTextRun("Amendment Strategy:", {
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  createTextRun(
                    String(
                      rejection.response.amendmentStrategy ||
                        "No strategy provided"
                    )
                  ),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 },
              })
            );
          }
        } else {
          sections.push(
            new Paragraph({
              spacing: { before: 200, after: 200 },
              children: [
                createTextRun("Response:", {
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                createTextRun(
                  String(
                    rejection.response.userResponse || "No response provided"
                  )
                ),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            })
          );
        }
      }
    }
  }

  // Conclusion
  sections.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      children: [
        createTextRun("CONCLUSION", {
          bold: true,
          size: 30,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        createTextRun(
          "In view of the foregoing amendments and remarks, Applicant respectfully submits that all pending claims are in condition for allowance. Favorable reconsideration and allowance of the application are earnestly solicited."
        ),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [createTextRun("Respectfully submitted:")],
      spacing: { before: 600, after: 400 },
    }),
    new Paragraph({
      children: [createTextRun("_____________________________")],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [createTextRun("Attorney Name")],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [createTextRun("Registration No.")],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [createTextRun(`Date: ${new Date().toLocaleDateString()}`)],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
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
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          run: {
            font: "Arial",
          },
        },
      ],
    },
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    if (enviroment === "development") {
      console.error("Error in generateDraftDocument:", error);
    }
    throw error;
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
  const cellMargins = {
    top: 100,
    bottom: 100,
    left: 100,
    right: 100,
  };

  const rows = [
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [createTextRun("Subject Application", { bold: true })],
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
                  }),
                ],
                width: { size: 33.33, type: WidthType.PERCENTAGE },
                margins: cellMargins,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [createTextRun(comparison.priorArt || "N/A")],
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

export default { generateDraftDocument };
