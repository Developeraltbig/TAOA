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

export const getAllClaimsAsArray = (fullText) => {
  fullText = fullText.replace(/\r\n|\r/g, "\n");
  const regex = /^(\d+(?:-\d+)?)\.\s*((?:(?!^\d+(?:-\d+)?\.)[\s\S])*)/gm;

  const allClaims = [];
  let match;

  const headerFooterPatterns = [
    /^DOCKET NO\.:\s*\S+\s*$/im,
    /^Application No\.:\s*\S+\s*$/im,
    /^Office Action Dated:\s*.+$/im,
    /^PATENT\s*$/im,
    /^\s*Page\s+\d+\s+of\s+\d+\s*$/im,
    /^\s*4927-1215-8768\.1\s*$/im,
    /^---\s*PAGE\s+\d+\s*---\s*$/im,
    /^This listing of claims will replace all prior versions and listings, of claims in the application:\s*$/im,
    /^Listing of Claims:\s*$/im,
    /^\s*\d+\s*$/im,
  ];

  while ((match = regex.exec(fullText)) !== null) {
    const currentClaimNumber = match[1];
    let claimBody = match[2];

    if (claimBody !== undefined) {
      claimBody = claimBody.trim();

      const lines = claimBody.split("\n");
      const cleanedLines = [];

      for (const line of lines) {
        let shouldKeepLine = true;
        for (const pattern of headerFooterPatterns) {
          if (pattern.test(line.trim())) {
            shouldKeepLine = false;
            break;
          }
        }
        if (shouldKeepLine) {
          cleanedLines.push(line);
        }
      }
      claimBody = cleanedLines.join("\n").trim();

      if (claimBody.length > 0) {
        allClaims.push(`${currentClaimNumber}. ${claimBody}`);
      }
    }
  }
  return allClaims;
};

export const getClaimWithFallback = (claimsArray, targetClaimNumber) => {
  const targetNum = parseInt(targetClaimNumber, 10);
  if (isNaN(targetNum) || targetNum <= 0) {
    return null;
  }

  const claimStringParseRegex = /^(\d+(?:-\d+)?)\.\s*([\s\S]*)/;

  const parseAndValidateClaim = (claimStr) => {
    const match = claimStr.match(claimStringParseRegex);
    if (!match) {
      return null;
    }
    const claimNumberGroup = match[1];
    const claimText = match[2].trim();

    let matchesTarget = false;

    if (claimNumberGroup === String(targetNum)) {
      matchesTarget = true;
    } else {
      const rangeMatch = claimNumberGroup.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const startNum = parseInt(rangeMatch[1], 10);
        const endNum = parseInt(rangeMatch[2], 10);
        if (targetNum >= startNum && targetNum <= endNum) {
          matchesTarget = true;
        }
      }
    }
    return {
      number: claimNumberGroup,
      text: claimText,
      matchesTarget: matchesTarget,
    };
  };

  if (claimsArray.length >= targetNum) {
    const directLookupClaimString = claimsArray[targetNum - 1];
    if (directLookupClaimString) {
      const parsedClaim = parseAndValidateClaim(directLookupClaimString);
      if (parsedClaim && parsedClaim.matchesTarget) {
        return parsedClaim.text;
      }
    }
  }

  for (const claimString of claimsArray) {
    const parsedClaim = parseAndValidateClaim(claimString);
    if (parsedClaim && parsedClaim.matchesTarget) {
      return parsedClaim.text;
    }
  }

  return null;
};
