import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const enviroment = process.env.NODE_ENV;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const extractAndParseAllJson = (text) => {
  try {
    const pattern = /```json\n(.*?)```/gs;
    const matches = Array.from(text.matchAll(pattern), (match) => match[1]);

    let mergedJSONData = {};

    matches.forEach((match) => {
      const parsedJSON = JSON.parse(match);
      mergedJSONData = { ...mergedJSONData, ...parsedJSON };
    });
    return mergedJSONData;
  } catch (error) {
    if (enviroment === "development") {
      console.error(`Error parsing AI response: ${error.message}`);
    }
    return null;
  }
};

export const generateResponse = async (prompt, applicationNumber) => {
  try {
    if (enviroment === "development") {
      console.log(`Analysing Technical Comparison ${applicationNumber}`);
    }
    const generationConfig = {
      temperature: 0.4,
      topP: 0.95,
      topK: 64,
    };
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        // timeout: 60000, // 60 seconds
      }
    );
    if (enviroment === "development") {
      console.log(`Completed Technical Comparison ${applicationNumber}`);
    }
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    if (error.status === 503) {
      if (enviroment === "development") {
        console.error("Gemini service unavailable");
      }
      return null;
    } else {
      throw new Error(`Error in AI processing: ${error}`);
    }
  }
};

export const getClaimTextByNumber = (fullText, claimNumber) => {
  const regex = /(\d+)\.\s*([\s\S]*?)(?=\d+\.|\Z)/g;

  const claimsMap = new Map();

  let match;
  while ((match = regex.exec(fullText)) !== null) {
    const currentClaimNumber = parseInt(match[1], 10);
    let claimBody = match[2]; // Claim body is now consistently in group 2

    if (claimBody !== undefined) {
      claimBody = claimBody.trim();

      claimBody = claimBody
        .replace(
          /^\((?:cancelled|previously presented|currently amended|new|reinstated|withdrawn)\)\s*/i,
          ""
        )
        .trim();

      if (claimBody.length > 0) {
        claimsMap.set(currentClaimNumber, claimBody);
      }
    }
  }

  if (claimsMap.has(claimNumber)) {
    return claimsMap.get(claimNumber);
  } else {
    return `Claim number ${claimNumber} not found.`;
  }
};
