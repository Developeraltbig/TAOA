import dotenv from "dotenv";
import mammoth from "mammoth";
import { Mistral } from "@mistralai/mistralai";

dotenv.config();
const enviroment = process.env.NODE_ENV;
const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: apiKey });

export const uploadPdf = async (fileName, fileBuffer) => {
  try {
    const uploadedPdf = await client.files.upload({
      file: {
        fileName: fileName,
        content: fileBuffer,
      },
      purpose: "ocr",
    });

    const signedUrl = await client.files.getSignedUrl({
      fileId: uploadedPdf.id,
    });

    return signedUrl.url;
  } catch (error) {
    throw new Error(`Failed to upload file to Mistral AI`);
  }
};

export const extractTextFromPDF = async (url) => {
  try {
    if (enviroment === "development") {
      console.log(`Started extracting text from PDF`);
    }

    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: url,
      },
      includeImageBase64: true,
    });

    if (enviroment === "development") {
      console.log(`Completed extracting text from PDF`);
    }

    const text = ocrResponse.pages
      .map((page) => page.markdown)
      .join("\n")
      .trim();

    return text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF ${error.message}`);
  }
};

export const extractTextFromDoc = async (buffer) => {
  try {
    if (enviroment === "development") {
      console.log(`Started extracting text from word`);
    }
    const result = await mammoth.extractRawText({ buffer });
    if (enviroment === "development") {
      console.log(`Completed extracting text from word`);
    }
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOC/DOCX: ${error.message}`);
  }
};
