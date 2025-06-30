import express from "express";
import {
  generateResponse,
  extractAndParseAllJson,
} from "../libs/rejectionRoutesHelper.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import ApplicationDetails from "../models/ApplicationDetails.js";
import { saveToFile } from "../libs/applicationRoutesHelpers.js";
import ApplicationDocuments from "../models/ApplicationDocuments.js";
import OtherRejectionResponse from "../models/OtherRejectionResponse.js";

const router = express.Router();
const enviroment = process.env.NODE_ENV;

router.post("/generate", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { rejectionId, applicationId, rejection } = req.body;

    if (!rejectionId || !applicationId || !rejection) {
      return res.status(400).json({
        status: "error",
        message: "Required fields are missing",
      });
    }

    const application = await ApplicationDetails.findOne({
      applicationId,
      user: user.userId,
      "rejections._id": rejectionId,
    });

    if (!application) {
      return res.status(400).json({
        status: "error",
        message: "Application or rejection not found",
      });
    }

    if (
      !application.isSubjectClaimsExists ||
      !application.isSubjectDescriptionExists ||
      !application.isPriorArtDescriptionExists
    ) {
      return res.status(400).json({
        status: "error",
        message: "Application Documents doesn't exist",
      });
    }

    const applicationDocuments = await ApplicationDocuments.findOne({
      applicationId,
      user: user.userId,
    });

    if (!applicationDocuments) {
      return res.status(400).json({
        status: "error",
        message: "Application Documents doesn't exist",
      });
    }

    let prompt = "";
    if (rejection.rejectionType.includes("101")) {
      prompt = `You are an expert patent prosecutor analyzing a §101 subject matter eligibility rejection to determine the optimal response strategy.
PROVIDED INPUTS:

Full Client Patent Claim Set (Independent and Dependent Claims)
Complete Specification of Client's Patent Application
Examiner's Detailed §101 Rejection Reasoning

YOUR TASK:
PART 1 - COMPREHENSIVE ELIGIBILITY ANALYSIS (Free-form narrative)
a) Categorize the rejection type

Abstract idea (mathematical concepts, mental processes, organizing human activity)
Law of nature
Natural phenomenon
Identify which specific grouping examiner applied

b) Apply Alice/Mayo two-step framework

Step 1: Is claim directed to judicial exception?

What is the alleged abstract idea/natural law?
Is examiner's characterization accurate?
Can claim be recharacterized?


Step 2A Prong Two: Integrated practical application?

Additional elements beyond exception?
Do they integrate exception into practical application?
Improvement to technology/technical field?


Step 2B: Inventive concept?

Significantly more than exception?
Well-understood, routine, conventional?



c) Evaluate response strategies

Arguments without amendment

Dispute abstract idea characterization
Show practical application integration
Demonstrate inventive concept
Cite favorable case law (Enfish, McRO, Vanda, etc.)


Amendment options

Add technical implementation details
Emphasize technological improvement
Include specific hardware/software elements
Narrow to specific technical application



d) Consider strategic options

Is this worth fighting or should claims be abandoned?
Would continuation with different claims be better?
Are there stronger fallback positions in dependent claims?
Should we request examiner interview?

PART 2 - STRATEGIC RECOMMENDATION
Based on your analysis above, provide your strategic recommendation:
\`\`\`json
{
  "response": "Strategic recommendation in 100 words or less, including: (1) Primary strategy (argue without amendment/amend claims/file continuation), (2) Key argument or amendment focus, (3) Likelihood of success assessment, (4) Any procedural recommendations (interview/declaration needed)"
}
\`\`\`  
IMPORTANT NOTE ON JSON DATA: Each of the json output, should start with \`\`\`json and end with \`\`\`.
Full Client Patent Claim Set: ${applicationDocuments.subjectPublicationClaim}
Complete Specification of Client's Patent Application: ${applicationDocuments.subjectPublicationDescription}
Examiner's Detailed §101 Rejection Reasoning: ${rejection.examinerReasoning}
`;
    } else if (rejection.rejectionType.includes("112")) {
      prompt = `You are an expert patent prosecutor analyzing a §112 rejection to determine the optimal response strategy.
PROVIDED INPUTS:

Full Client Patent Claim Set (Independent and Dependent Claims)
Complete Specification of Client's Patent Application
Examiner's Detailed §112 Rejection Reasoning (specify 112(a), (b), or (f))

YOUR TASK:
PART 1 - COMPREHENSIVE §112 ANALYSIS (Free-form narrative)
a) Identify specific §112 issues

§112(a) - Written Description

New matter allegations?
Lack of support for claimed features?
Genus/species issues?
Negative claim limitations?


§112(a) - Enablement

Undue experimentation required?
Unpredictable arts considerations?
Scope vs. disclosure issues?


§112(b) - Indefiniteness

Unclear claim boundaries?
Relative terms without baseline?
Antecedent basis issues?
Means-plus-function problems?

§112(f) - Means-Plus-Function

Proper invocation?
Corresponding structure disclosed?

b) Evaluate specification support

Locate exact support for challenged limitations
Check for implicit/inherent disclosure
Review drawings for structural support
Consider declaration evidence potential

c) Analyze response options

Arguments without amendment

Point to specification support
Clarify claim interpretation
Challenge examiner's construction
Provide expert declaration

Amendment strategies

Clarify ambiguous terms
Add antecedent basis
Remove unsupported features
Convert means-plus-function

d) Strategic considerations

Risk of prosecution history estoppel
Impact on claim scope
Likelihood of examiner acceptance
Need for continuation/divisional

PART 2 - STRATEGIC RECOMMENDATION
Based on your analysis above, provide your strategic recommendation:
\`\`\`json
{
  "response": "Strategic recommendation in 100 words or less, including: (1) Primary response strategy (argue/amend/combination), (2) Key specification paragraphs/figures supporting response, (3) Specific fixes for each 112 issue, (4) Risk assessment and whether continuation should be filed as backup"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output, should start with \`\`\`json and end with \`\`\`.
Full Client Patent Claim Set: ${applicationDocuments.subjectPublicationClaim}
Complete Specification of Client's Patent Application: ${applicationDocuments.subjectPublicationDescription}
Examiner's Detailed §112 Rejection Reasoning: ${rejection.examinerReasoning}
`;
    } else if (rejection.rejectionType.includes("121")) {
      prompt = `You are an expert patent prosecutor analyzing a restriction/election requirement to determine the optimal response strategy.
PROVIDED INPUTS:

Full Client Patent Claim Set (Independent and Dependent Claims)
Complete Specification of Client's Patent Application
Examiner's Detailed Restriction Requirement with Groups/Species

YOUR TASK:
PART 1 - COMPREHENSIVE RESTRICTION ANALYSIS (Free-form narrative)
a) Analyze the restriction requirement

Identify all groups/inventions defined
Review examiner's burden rationale

Different fields of search?
Non-overlapping classifications?
Divergent technologies?

Check for species election within groups
Evaluate propriety of restriction

b) Map claims to commercial products

Which groups cover current products?
Which cover future products?
Which have strongest market value?
Which face less prior art?

c) Evaluate strategic options

Election with traverse

Arguments against restriction
Burden on examiner not met
Single general inventive concept
Overlapping search/classification

Election without traverse

Preserve divisional rights
Faster prosecution

Rejoinder possibilities

Generic claims allowable?
Product-by-process rejoinder?

d) Consider filing strategies

Divisional application timing

File immediately vs. wait
Foreign filing deadlines
Patent term implications


Multiple divisionals needed?
Cost-benefit analysis
Client budget constraints

PART 2 - STRATEGIC RECOMMENDATION
Based on your analysis above, provide your strategic recommendation:
\`\`\`json
{
  "response": "Strategic recommendation in 100 words or less, including: (1) Which group/species to elect and why, (2) Whether to traverse (with key argument if yes), (3) Divisional filing strategy and timing, (4) Commercial/strategic rationale for the election"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output, should start with \`\`\`json and end with \`\`\`.
Full Client Patent Claim Set: ${applicationDocuments.subjectPublicationClaim}
Complete Specification of Client's Patent Application: ${applicationDocuments.subjectPublicationDescription}
Examiner's Detailed Restriction Requirement with Groups/Species: ${rejection.examinerReasoning}
`;
    } else {
      prompt = `You are an expert patent prosecutor analyzing a double patenting rejection to determine the optimal response strategy.
PROVIDED INPUTS:

Full Client Patent Claim Set (Independent and Dependent Claims)
Complete Specification of Client's Patent Application
Examiner's Detailed Double Patenting Rejection (including reference patent/application)

YOUR TASK:
PART 1 - COMPREHENSIVE DOUBLE PATENTING ANALYSIS (Free-form narrative)
a) Characterize the rejection type

Statutory double patenting (same invention)?
Non-statutory (obviousness-type)?

One-way or two-way obviousness?
Common inventor/assignee?

Provisional vs. non-provisional ODP?
Reference patent vs. application?

b) Analyze the claims comparison

Map overlapping elements
Identify distinguishing features
Evaluate obviousness differences
Check for patentably distinct inventions

c) Evaluate response strategies

Arguments against rejection

Show patentable distinction
Different inventive entities
Safe harbor provisions
Design choice vs. patentable difference

Terminal disclaimer option

Impact on patent term
Common ownership requirement
Enforceability considerations
Client business impact

d) Strategic considerations

Patent term implications

PTA/PTE effects
Which patent expires first?
Commercial life of product

Portfolio management

Continuation practice implications
Family member interactions
Foreign counterpart effects


Business considerations

Licensing complications
Assignment requirements
Enforcement risks

PART 2 - STRATEGIC RECOMMENDATION
Based on your analysis above, provide your strategic recommendation:
\`\`\`json
{
  "response": "Strategic recommendation in 100 words or less, including: (1) Whether to file terminal disclaimer or argue distinction, (2) Key basis for recommendation (term impact/commercial value/enforcement), (3) If arguing, strongest distinguishing feature, (4) Any alternative strategies (amendment/continuation practice)"
}
\`\`\`
IMPORTANT NOTE ON JSON DATA: Each of the json output, should start with \`\`\`json and end with \`\`\`.
Full Client Patent Claim Set: ${applicationDocuments.subjectPublicationClaim}
Complete Specification of Client's Patent Application: ${applicationDocuments.subjectPublicationDescription}
Examiner's Detailed Double Patenting Rejection: ${rejection.examinerReasoning}
`;
    }

    let rawText = await generateResponse(prompt, application.applicationNumber);

    if (!rawText) {
      rawText = await generateResponse(prompt, application.applicationNumber);
    }

    if (enviroment === "development") {
      await saveToFile(
        rawText,
        `unclean/${application.applicationNumber}.json`
      );
    }

    let data = extractAndParseAllJson(rawText);

    if (data === null) {
      rawText = await generateResponse(prompt, application.applicationNumber);
      if (enviroment === "development") {
        await saveToFile(
          rawText,
          `unclean/${application.applicationNumber}.json`
        );
      }
      data = extractAndParseAllJson(rawText);
    }

    if (data === null) {
      return res.status(400).json({
        status: "error",
        message: "Failed to analyse technical comparison claim!",
      });
    }

    if (enviroment === "development") {
      await saveToFile(data, `data/${application.applicationNumber}.json`);
    }

    const savedResponse = await OtherRejectionResponse.findOneAndUpdate(
      {
        rejectionId,
        applicationId,
        user: user.userId,
      },
      {
        response: data.response,
        status: "draft",
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      status: "success",
      message: "Response saved successfully",
      data: savedResponse,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/save", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { rejectionId, applicationId, response } = req.body;

    if (!rejectionId || !applicationId || !response) {
      return res.status(400).json({
        status: "error",
        message: "Required fields are missing",
      });
    }

    const application = await ApplicationDetails.findOne({
      applicationId,
      user: user.userId,
      "rejections._id": rejectionId,
    });

    if (!application) {
      return res.status(400).json({
        status: "error",
        message: "Application or rejection not found",
      });
    }

    const savedResponse = await OtherRejectionResponse.findOneAndUpdate(
      {
        rejectionId,
        applicationId,
        user: user.userId,
      },
      {
        response,
        status: "draft",
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      status: "success",
      message: "Response saved successfully",
      data: savedResponse,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/fetch", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { rejectionId, applicationId } = req.body;

    if (!rejectionId || !applicationId) {
      return res.status(400).json({
        status: "error",
        message: "Required fields are missing",
      });
    }

    const response = await OtherRejectionResponse.findOne({
      applicationId,
      rejectionId,
      user: user.userId,
    });

    res.status(200).json({
      status: "success",
      message: "Response successfully fetched",
      data: response || null,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/finalize", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { rejectionId, applicationId } = req.body;

    if (!rejectionId || !applicationId) {
      return res.status(400).json({
        status: "error",
        message: "Required fields are missing",
      });
    }

    const response = await OtherRejectionResponse.findOneAndUpdate(
      {
        rejectionId,
        user: user.userId,
      },
      {
        status: "finalized",
        finalizedAt: new Date(),
      },
      { new: true }
    );

    if (!response) {
      return res.status(400).json({
        status: "error",
        message: "Response doesn't exist!",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Response finalized",
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
