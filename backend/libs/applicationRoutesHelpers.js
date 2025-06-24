import qs from "qs";
import axios from "axios";
import dotenv from "dotenv";
import { writeFile } from "fs/promises";

dotenv.config();
const enviroment = process.env.NODE_ENV;
const SERP_API_KEY = process.env.SERP_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PATENT_VIEW_API_KEY = process.env.PATENT_VIEW_API_KEY;

export const fetchOfficeActionData = async (appNumber) => {
  const baseUrl = "https://developer.uspto.gov/ds-api";
  const dataset = "oa_actions";
  const version = "v1";
  const searchFields = [
    "patentApplicationNumber",
    "applicationId",
    "sections.patentApplicationNumber",
  ];

  for (const field of searchFields) {
    const criteria = `${field}:${appNumber}`;
    const results = await searchRecords(baseUrl, dataset, version, criteria);
    if (results && results.response?.numFound > 0) {
      return results;
    }
  }
  return null;
};

async function searchRecords(
  baseUrl,
  dataset,
  version,
  criteria,
  start = 0,
  rows = 25
) {
  const url = `${baseUrl}/${dataset}/${version}/records`;
  try {
    const response = await axios.post(
      url,
      qs.stringify({ criteria, start, rows }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    if (!response.data || Object.keys(response.data).length === 0) {
      return { response: { numFound: 0, docs: [] } };
    }
    return response.data;
  } catch (error) {
    if (enviroment === "development") {
      console.error(`Error searching records: ${error.message}`);
    }
    return null;
  }
}

export const saveToFile = async (data, filename) => {
  try {
    await writeFile(filename, JSON.stringify(data, null, 2));
    if (enviroment === "development") {
      console.log(`Results saved to ${filename}`);
    }
  } catch (error) {
    if (enviroment === "development") {
      console.error(`Error saving to file: ${error.message}`);
    }
  }
};

export const isRejectionDoc = (doc) => {
  let codes = doc.legacyDocumentCodeIdentifier || [];
  if (!Array.isArray(codes)) {
    codes = [codes];
  }
  const rejectionCodes = new Set(["CTNF", "CTFR"]);
  return codes.some((code) => rejectionCodes.has(code));
};

export const parseDate = (doc) => {
  const dateFields = [
    "submissionDate",
    "lastModifiedTimestamp",
    "createDateTime",
  ];
  for (const field of dateFields) {
    const dateStr = doc[field] || "";
    if (dateStr) {
      try {
        const dt = new Date(dateStr.replace("Z", ""));
        if (!isNaN(dt)) {
          return [dateStr, dt];
        }
      } catch (error) {
        if (enviroment === "development") {
          console.error(`Error in parse date: ${error.message}`);
        }
      }
    }
  }
  return ["", null];
};

export const getFullBodyText = (doc) => {
  const body = doc.bodyText || "";
  return Array.isArray(body) ? body.join(" ") : body;
};

export const getApplicationDetails = (doc) => {
  const inventionTitle = Array.isArray(doc.inventionTitle)
    ? doc.inventionTitle[0] || ""
    : doc.inventionTitle || "";
  const lastFilingDate = Array.isArray(doc.filingDate)
    ? doc.filingDate[0] || ""
    : doc.filingDate || "";

  return {
    inventionTitle,
    lastFilingDate,
  };
};

export const backgroundProcessRejection = async (appNumber, rejectionText) => {
  if (enviroment === "development") {
    console.log(`Starting processing for ${appNumber}`);
  }

  let result = await processRejectionWithAI(rejectionText);
  if (result === null) {
    result = await processRejectionWithAI(rejectionText);
  }
  if (enviroment === "development") {
    console.log(`Completed processing for ${appNumber}`);
  }
  return result;
};

async function processRejectionWithAI(rejectionText) {
  try {
    const prompt =
      `You have received the full text of a USPTO Office Action. Your task is to extract structured data from EACH rejection instance and claim status instance raised by the examiner exactly as instructed below and nothing else.

FOLLOW THESE INSTRUCTIONS STRICTLY:

1. Completely EXCLUDE from extraction:
- Any standard or boilerplate statutory language (e.g., 35 USC 103 general quotation).
- Any generalized legal statements, MPEP instructions, disclaimers.
- Examiner contact information or procedural instructions.

2. For EACH distinct rejection section identified explicitly by the examiner (e.g., under headings like 'Claim Rejections - 35 USC § 112' or 'Claim Rejections - 35 USC § 103'), extract only the following fields exactly:

{
"rejectionType": "[Explicit rejection statutory type exactly as stated by examiner, Don't include text like these as anticipated by or, in the alternative. e.g., '35 U.S.C. 103' or 'Nonstatutory Double Patenting']",

"claimsRejected": [Exact numeric claim numbers explicitly cited in each rejection, e.g., 1, 23],

"priorArtReferences": ["US########A1" or "JP########A" references exactly as cited by examiner with no punctuation or slashes, e.g., 'US7250547'. For explicitly cited journal or literature references, provide the reference title. In each rejection, you must give the accurate patent number or the reference title even if the reference was repeated in a previous rejection. Include ALL cited references explicitly stated by the examiner in the rejection section],

"examinerReasoning": "Extract exactly the entire detailed examiner-specific reasoning from examiner paragraphs verbatim. Examiner detailed reasoning usually starts explicitly as 'In regards to claims...', 'Regarding claims...', or similar specific statements discussing exact technical substitutions, chemical structures, motivations, finite choices, technical examples, and specific references to prior art documents and teachings. You MUST extract precisely all examiner-specific paragraphs of detailed technical reasoning fully and without omission. Only exclude standard statutory text, general legal paragraphs, and procedural statements. NEVER truncate or omit parts of unique examiner reasoning."
}

3. For CLAIM STATUS EXTRACTION, follow this systematic approach:

STEP A - Identify ALL claim status mentions throughout the Office Action:
Look for claim status information in these locations (in order of priority):
1. The "DETAILED ACTION" or similar introductory section at the beginning
2. Status summaries within or before rejection sections
3. Any explicit statements about claim disposition anywhere in the document

STEP B - Recognize these EXACT status keywords:
- "pending" or "are pending" → Status: "Pending"
- "rejected" or "are rejected" → Status: "Rejected"  
- "withdrawn" or "are withdrawn" → Status: "Withdrawn"
- "canceled" or "have been canceled" or "are canceled" → Status: "Canceled"
- "allowed" or "are allowed" or "allowable" → Status: "Allowed"
- "objected to" or "are objected to" → Status: "Objected"
- "indicated allowable" → Status: "Indicated Allowable"
- "previously presented" → Status: "Previously Presented"
- "currently amended" → Status: "Currently Amended"
- "new" → Status: "New"

STEP C - Extract claim status using this EXACT format:
{
"claimNumbers": "[Preserve the EXACT format from the Office Action, e.g., '1-2, 6-13, 15-16 & 18-25' or '3-5, 14 & 17']",
"status": "[Use ONLY the exact status values from Step B above]",
"type": "[Extract the statutory basis IF explicitly provided in the same context, otherwise use 'N/A']"
}

STEP D - Apply these extraction rules:
- Create ONE claim status entry for EACH unique status mentioned
- If the same claims appear with different statuses in different sections, create SEPARATE entries
- For rejected claims found within rejection sections, the type should be the rejection basis (e.g., '35 U.S.C. 103')
- For withdrawn claims, look for regulatory basis like '37 CFR 1.142(b)'
- For status mentions in introductory sections without statutory basis, use type: 'N/A'
- NEVER combine different statuses into one entry
- NEVER infer or assume claim statuses that are not explicitly stated

Example extraction patterns:
- "Claims 1-20 are pending" → {"claimNumbers": "1-20", "status": "Pending", "type": "N/A"}
- "Claims 3-5, 14 & 17 have been canceled" → {"claimNumbers": "3-5, 14 & 17", "status": "Canceled", "type": "N/A"}
- "Claims 6-8 are withdrawn from further consideration pursuant to 37 CFR 1.142(b)" → {"claimNumbers": "6-8", "status": "Withdrawn", "type": "37 CFR 1.142(b)"}

4. CRITICAL:
- Validate your extracted output extremely thoroughly. Ensure fully correct and valid JSON with absolutely no extra commas, no empty values, and proper formatting. Output the result as a single valid JSON object containing two arrays: "rejections" for the rejection instances and "claimStatus" for the claim status instances (e.g., { "rejections": [ {...}, {...}, {...} ], "claimStatus": [ {...}, {...} ] }). If no claim status instances are found, return an empty "claimStatus" array (e.g., "claimStatus": []). Do not include any additional explanations or text outside the JSON.

Here is the full USPTO Office Action to extract:
` + rejectionText;

    const generationConfig = {
      temperature: 0.4,
      topP: 0.95,
      topK: 64,
      // maxOutputTokens: 30000,
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    try {
      const cleanedText = response.data.candidates[0].content.parts[0].text
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "")
        .trim();

      let result = JSON.parse(cleanedText);

      for (const rejection of result.rejections) {
        if (!rejection.rejectionType) {
          rejection.rejectionType = "Unknown Rejection Type";
        }
      }
      return result;
    } catch (error) {
      if (enviroment === "development") {
        console.error(`Error parsing AI response: ${error.message}`);
      }
      return null;
    }
  } catch (error) {
    if (enviroment === "development") {
      console.error(error);
    }
    throw new Error(`Error in AI Processing`);
  }
}

export const generatePatentUrl = (reference) => {
  if (!reference) {
    return {
      citedPubNo: reference,
      citedPubURL: "#",
    };
  }
  const match = reference
    .replace(/[\s/]/g, "")
    .match(/(US|EP|JP|CN|WO)(\d+)([A-Z]\d*)?/);
  if (match) {
    const [, country, number, kind = ""] = match;
    return {
      citedPubNo: reference,
      citedPubURL: `https://patents.google.com/patent/${country}${number.replace(
        /^0+/,
        ""
      )}${kind}/en`,
    };
  }
  return {
    citedPubNo: reference,
    citedPubURL: "#",
  };
};

export const extractApplicationNumber = (text) => {
  const pattern = /\d{2}\/\d{3},\d{3}/;
  const match = text.match(pattern);
  if (match) {
    const appNumber = match[0];
    const cleaned = appNumber.replace("/", "").replace(",", "");
    return cleaned;
  } else {
    return null;
  }
};

export const extractFilingDate = (text) => {
  const pattern = /\d{2}\/\d{2}\/\d{4}/;
  const match = text.match(pattern);
  if (match) {
    const filingDate = match[0];
    return filingDate;
  } else {
    return null;
  }
};

export const fetchPublicationDetails = async (applicationNumber) => {
  try {
    const normalizeApp = (num) => num.replace(/[^0-9]/g, "").padStart(8, "0");
    const appNormalized = normalizeApp(applicationNumber);

    const size = 100;
    const fields = ["document_number", "publication_title"];
    const query = {
      "granted_pregrant_crosswalk.application_number": appNormalized,
    };

    const qs = new URLSearchParams({
      q: JSON.stringify(query),
      f: JSON.stringify(fields),
      o: JSON.stringify({ size }),
    }).toString();

    const response = await axios.get(
      `https://search.patentsview.org/api/v1/publication/?${qs}`,
      {
        headers: { "X-Api-Key": PATENT_VIEW_API_KEY },
      }
    );

    return response.data.publications[0];
  } catch (error) {
    if (enviroment === "development") {
      console.error(error);
    }
    throw new Error("Error in fetching publication details");
  }
};

function getFirstNAlphabets(text, n) {
  let result = "";
  for (let char of text) {
    if (/[a-zA-Z]/.test(char)) {
      result += char;
      if (result.length === n) {
        break;
      }
    }
  }
  return result;
}

export const checkInclusion = (firstDocument, secondDocument) => {
  const seq = getFirstNAlphabets(secondDocument, 200);
  const alphaFirstDocument = firstDocument.replace(/[^a-zA-Z]/g, "");
  const isIncluded = alphaFirstDocument.includes(seq);
  return isIncluded;
};

export const fetchPatentTextFromSerpAPI = async (
  patent,
  isFirstRejection = false
) => {
  try {
    const patentIdFormatted = patent.startsWith("patent/")
      ? patent
      : `patent/${patent}`;
    const finalPatentId = patentIdFormatted.endsWith("/en")
      ? patentIdFormatted
      : `${patentIdFormatted}/en`;

    const url = "https://serpapi.com/search";
    const params = {
      engine: "google_patents_details",
      patent_id: finalPatentId,
      api_key: SERP_API_KEY,
    };

    const response = await axios.get(url, { params });

    const data = response.data;
    let fullDescription = "";

    if (data.description_link) {
      const descResponse = await axios.get(data.description_link, {
        timeout: 100000,
      });
      if (descResponse.status === 200) {
        fullDescription = descResponse.data
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    if (!fullDescription) {
      fullDescription = data.description || "";
    }

    if (!fullDescription) {
      throw new Error("No patent text retrieved from API or description link");
    }

    if (isFirstRejection) {
      let text = "";
      data.claims.forEach((claim) => (text += claim));
      return {
        fullDescription,
        claims: text,
      };
    } else {
      return fullDescription;
    }
  } catch (error) {
    throw new Error("Error fetching patent information");
  }
};

export const processClaimsWithAI = async (claimText) => {
  try {
    const prompt =
      `Extract and analyze claim dependencies from the provided patent claims listing.

TASK: Identify which claims are independent and which are dependent, then group all dependent claims under their respective independent claims.

IDENTIFICATION RULES:

1. INDEPENDENT CLAIMS: Claims that do NOT reference any other claim. They define the invention without depending on other claims.

2. DEPENDENT CLAIMS: Claims containing references to other claims. Look for these patterns:
   - "The [method/device/apparatus/system] of claim [number]"
   - "according to claim [number]"
   - "as set forth in claim [number]" 
   - "wherein" following a claim reference
   - Any variation mentioning "claim [number]"

3. CHAIN DEPENDENCIES: Handle multi-level dependencies correctly
   - If claim 16 depends on claim 15, and claim 15 depends on claim 14 (independent), then:
   - Both claims 15 and 16 should be listed under claim 14's dependent claims

4. IGNORE: All parenthetical status indicators (Currently Amended, Previously Presented, Cancelled, New, Original, etc.)

5. SKIP: Claims marked as "Cancelled" - do not include these in the output

OUTPUT FORMAT:
Provide a JSON array with this exact structure:
[
  {
    "independentClaim": 1,
    "dependentClaims": [2, 6, 7, 8, 9, 10, 11, 22, 23]
  },
  {
    "independentClaim": 12,
    "dependentClaims": [13, 15, 16, 18, 19, 20, 21]
  }
]

CRITICAL: 
- First thoroughly analyze ALL claims to understand the complete dependency tree
- Ensure EVERY valid dependent claim appears under exactly ONE independent claim
- Sort claim numbers in ascending order
- Output ONLY the JSON array, no explanations

Patent claims text:` + claimText;

    const generationConfig = {
      temperature: 0.4,
      topP: 0.95,
      topK: 64,
      // maxOutputTokens: 30000,
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
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

    try {
      const cleanedText = response.data.candidates[0].content.parts[0].text
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "")
        .trim();

      let result = JSON.parse(cleanedText);

      return result;
    } catch (error) {
      if (enviroment === "development") {
        console.error(`Error parsing AI response: ${error.message}`);
      }
      return null;
    }
  } catch (error) {
    throw new Error(`Error parsing AI processing: ${error.message}`);
  }
};
