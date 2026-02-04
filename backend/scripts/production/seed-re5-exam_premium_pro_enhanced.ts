import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Get table name from command line argument or environment variable
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith("--env="));
const envName = envArg ? envArg.split("=")[1] : "dev";
const TABLE_NAME = process.env["TABLE_NAME"] || `exam-platform-data-${envName}`;
const EXAM_ID = "re5-premium-pro-exam"; // PREMIUM/PRO TIER EXAM

// Exam metadata (Enhanced Description)
const examMetadata = {
  PK: `EXAM#${EXAM_ID}`,
  SK: "METADATA",
  GSI1PK: "EXAM#ACTIVE",
  GSI1SK: `RE5#${new Date().toISOString()}`,
  GSI3PK: `EXAM#CATEGORY#RE5`,
  GSI3SK: `intermediate#${EXAM_ID}`,
  examId: EXAM_ID,
  title: "RE5 Full Exam Simulation (Premium/Pro)",
  description: "A comprehensive 747-question RE5 practice exam designed for Premium and Pro tier users, covering all key regulatory examination topics with enhanced questions and detailed explanations.",
  category: "RE5",
  difficulty: "intermediate",
  totalQuestions: 747,
  totalTime: 67230, // 1.5 minutes per question in seconds
  duration: 67230,
  passingScore: 70,
  pointsPerQuestion: 2,
  isActive: true,
  // TIER RESTRICTION: This exam is exclusively for premium and pro tier users
  allowedTiers: ["premium", "pro"],
  isPremiumExam: true,
  createdBy: "admin",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entityType: "EXAM",
};

// 747 RE5 Questions - PREMIUM/PRO TIER ONLY
const questions = [
  {
    "questionNumber": 1,
    "questionText": "Mr. Simelane is newly employed by 'SA Life (Pty) Ltd', a licensed FSP, and provides advice on long-term insurance policies. His employment contract states he is 'working under supervision'. In terms of the FAIS Act's definitions, what is Mr. Simelane's official regulatory status?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A Key Individual, as he manages client advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A Product Supplier's agent.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A Representative.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "An assistant, as he is working under supervision.",
        "isCorrect": false
      }
    ],
    "explanation": "According to the FAIS Act (Sec 1, Definitions), a 'Representative' is a person appointed by an FSP to render specified financial services. 'Working under supervision' is a condition of appointment for those not yet fully competent, but their regulatory status remains that of a Representative.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 2,
    "questionText": "A company, 'Safe Deposits (Pty) Ltd', primarily sells safes. As a side-activity, a director, Mrs. Kanya, provides general advice on banking deposits. Under which specific circumstance would 'Safe Deposits (Pty) Ltd' be EXEMPT from needing an FSP license for this activity?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The company receives a referral fee from the bank.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The advice is given as part of a separate, paid financial seminar.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The company is also a registered Bank (a Product Supplier) and the advice *only* relates to its own deposit products.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The advice is provided on behalf of another, licensed FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides exemptions. A Product Supplier (like a bank) that provides advice *only* on its own financial products is generally exempt from needing a separate FSP license for that specific activity. Receiving fees (A, B) or acting for another FSP (D) would require licensing.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 3,
    "questionText": "A Category I FSP, 'Growth Capital (Pty) Ltd,' decides it wants to start managing clients' investment portfolios on a discretionary basis (Category II). Which regulatory action is mandatory before they can legally offer this new service?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Submit a new annual compliance report to the FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Update their internal Conflict of Interest Management Policy.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Appoint an additional Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Apply to the FSCA for a variation of their license to include Category II.",
        "isCorrect": true
      }
    ],
    "explanation": "According to the FAIS Act (Sec 8(2)), an FSP must comply with the conditions of its license. Rendering services in a category for which it is not licensed (like a Cat I FSP moving to Cat II) is prohibited. The FSP must first apply to the FSCA for a variation (or change) of its license.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 4,
    "questionText": "Mr. Naidoo is appointed by an FSP. His mandate on the representative register is strictly limited to 'intermediary services' for a specific investment product. Which of the following actions is he legally prohibited from performing?\n\ni. Recommending the product to a client as a 'good investment'.\nii. Submitting a client's completed application form to the product supplier.\niii. Explaining the factual costs and fees as listed on the product brochure.\niv. Assisting a client with filling in their personal details on a form.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i only",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "ii and iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) makes a clear distinction between 'advice' (recommending) and 'intermediary services' (processing, submitting forms, providing factual information). If Mr. Naidoo's mandate is restricted to intermediary services, he is legally prohibited from providing advice (i). Actions (ii), (iii), and (iv) are all examples of intermediary services or factual information provision, which he is allowed to do.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 5,
    "questionText": "Thandi is appointed as a new representative for 'Community Funerals (Pty) Ltd'. Her mandate is restricted to only providing advice and intermediary services for funeral policies (Subcategory 1.1). What is the specific RE5 regulatory exam requirement for Thandi?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "She must write the RE1 (Key Individual) exam within two years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "She must write the RE5 within two years as she provides advice.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "She is exempt from writing the RE5 as she only services a Tier 2 product.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "She must write the RE5, but the deadline is extended to five years.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (linked to Sec 13 of the FAIS Act) distinguish between Tier 1 (complex) and Tier 2 (simple) products. Funeral policies are Tier 2. The RE5 regulatory exam is *only* mandatory for representatives rendering services for Tier 1 products. As Thandi *only* services a Tier 2 product, she is exempt.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 6,
    "questionText": "A financial journalist provides financial guidance through a publicly available blog and does not interact with individual clients. The content is general in nature. Under the FAIS Act, what is the regulatory status of this general guidance?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It must be approved by the FSCA prior to publication.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It is deemed an intermediary service.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "It constitutes financial advice and requires a separate FSP license.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It is excluded from the definition of 'advice' as it is a general recommendation via mass media.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) specifically excludes recommendations or guidance published to the public via mass media (like a blog or newspaper) from the definition of 'advice', provided it is general in nature and not tailored to a specific client's situation.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 7,
    "questionText": "An FSP, 'Honest Advice Brokers', suspends a representative, Mr. Dlamini, due to strong evidence of poor ethical behaviour. What is the FSP's mandatory duty to the FSCA regarding this suspension?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Inform the relevant Product Supplier within 15 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Inform the client within 30 days.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Inform the FSCA immediately and provide the reasons for the suspension.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Inform the FAIS Ombud only after the internal investigation is complete.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) mandates that if an FSP suspends or debars a representative, it must *immediately* inform the FSCA (the regulator) and provide the reasons for this action. This ensures the central register is up-to-date, even while an investigation is pending.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 8,
    "questionText": "Mr. Nkosi, a representative for a Tier 1 product, fails to pass the RE5 examination within the required two-year period from his date of first appointment. What is the mandatory consequence under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "He can continue to work under supervision indefinitely.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "He must be immediately debarred and removed from the FSP’s Representative register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "He can still render intermediary services, but not advice.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP must pay a fine to the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "Failure to meet the competence requirements (passing the RE5 for Tier 1 products) within the prescribed 24 months from the date of first appointment means the representative is no longer 'Fit and Proper'. The FSP is mandated (Sec 14) to debar the representative and remove them from the register immediately.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 9,
    "questionText": "Mr. Khumalo, a Representative, was recently declared insolvent due to personal business failure. According to the Fit and Proper requirements, which core requirement is directly impacted by this event?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence, due to a lack of business skill.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability, due to personal debt.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity, due to failure to pay debt.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness, due to the inability to meet obligations.",
        "isCorrect": true
      }
    ],
    "explanation": "The Fit and Proper requirements (FAIS Act, Sec 8(1)(b)) mandate that Representatives must be 'Financially Sound'. Insolvency (being declared unable to meet one's financial obligations) is a direct contravention of this specific requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 10,
    "questionText": "Ms. Dlamini, a Representative, was found guilty of a criminal offence involving fraud six years ago, which she deliberately failed to disclose upon appointment. This action compromises all the following Fit and Proper requirements EXCEPT:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Honesty",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Integrity",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Good Standing",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competence",
        "isCorrect": true
      }
    ],
    "explanation": "A conviction for fraud is a direct breach of 'Honesty' and 'Integrity' (FAIS Act, Sec 8(1)(a)). It also means the representative is not of 'Good Standing'. The failure to disclose it is also a breach of honesty. However, this event does not directly relate to her 'Competence' (which is about qualifications, exams, and experience).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 11,
    "questionText": "An FSP must ensure it has adequate physical and electronic systems, including IT security and data backup, to conduct business securely. This requirement falls under which Fit and Proper element?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(c)) requires an FSP to have the 'Operational Ability' to perform its functions. This includes having adequate and secure systems, technology, business continuity plans, and internal controls.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 12,
    "questionText": "Ms. Zama is a Representative who advises on Category I products. She has achieved the necessary qualification and passed the RE5. To be deemed fully competent, which of the following must she also complete?\n\ni. The required minimum period of experience under supervision.\nii. The annual Class of Business training.\niii. The annual product specific training.\niv. The RE1 Key Individual examination.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i only",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "i, ii and iii only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "ii and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i and iv only",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper requirements (Sec 26) state that initial 'Competence' is a three-legged stool: 1) Qualification, 2) Regulatory Exam (RE5), and 3) Experience. Ms. Zama has met the first two but must still complete the minimum required period of experience under supervision. Class of Business (ii) and Product Training (iii) are part of competence but not the final step to lift supervision. RE1 (iv) is for Key Individuals.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 13,
    "questionText": "An FSP's license is conditional on maintaining adequate professional indemnity (PI) insurance. This policy is a crucial component of the FSP's ability to compensate clients for losses due to negligence. This is a requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Maintaining adequate Professional Indemnity (PI) insurance is a key requirement for an FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(c)). It ensures the FSP has the operational and financial mechanisms to manage risks and compensate clients for potential errors or negligence.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 14,
    "questionText": "An FSP fails to respond to a regulatory request for client records during an audit, citing a lack of resources and a poorly maintained filing system. Which Fit and Proper requirement is the FSP fundamentally failing to comply with?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 19) requires FSPs to maintain records and provide them to the regulator upon request. The ability to maintain and retrieve records (Sec 18) and respond to regulatory requests falls under 'Operational Ability', which covers systems, internal controls, and record-keeping infrastructure.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 15,
    "questionText": "If the FSCA is informed that a Representative on an FSP's register has been debarred by another FSP for dishonesty. What is the *mandated* action for the current FSP to maintain license integrity?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Re-evaluate the Representative's contract within six months.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Automatically appoint the person as a Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Remove the Representative from its FSP register immediately.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Report the debarment to the FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "Under the FAIS Act (Sec 13(2)), an FSP has a duty to ensure all its representatives are Fit and Proper. A person who has been debarred (especially for dishonesty) no longer meets this requirement. The FSP must, therefore, remove the representative from its register immediately.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 16,
    "questionText": "A Representative must meet continuous professional development (CPD) requirements. The failure to comply with these requirements impacts which core regulatory element?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competency (maintaining knowledge and skills).",
        "isCorrect": true
      }
    ],
    "explanation": "Continuous Professional Development (CPD) (Fit & Proper, Sec 30) is the mechanism used to ensure that a representative maintains their 'Competency' after achieving their initial qualification, exam, and experience. Failure to do CPD means they are no longer deemed competent.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 17,
    "questionText": "A Representative, Ms. Palesa, is offered a significant financial incentive (a paid luxury trip) by a product supplier to recommend their product over a competitor's, even though the competitor's product is slightly more suitable. If Ms. Palesa accepts, she is in breach of the Code of Conduct requirement to manage:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping requirements.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness requirements.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Continuous Professional Development (CPD).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Conflicts of Interest.",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(a)) requires an FSP and its representatives to avoid or mitigate 'Conflicts of Interest'. Accepting a significant incentive that could influence advice and cause a representative to prioritize personal gain (the trip) over the client's best interests is a clear conflict of interest.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 18,
    "questionText": "Before providing advice, the General Code of Conduct requires a Representative to take reasonable steps to seek sufficient information from the client. Which of the following pieces of information must be obtained?\n\ni. The client's financial situation.\nii. The client's financial product experience.\niii. The client's needs and objectives.\niv. The name of the client's previous FSP.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii, and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "ii and iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(2), often linked to Sec 8 on suitability) mandates that a representative must conduct a 'needs analysis' to ensure advice is appropriate. This requires gathering sufficient information about the client's financial situation (i), financial product experience (ii), and their needs and objectives (iii). The name of their previous FSP (iv) is not a mandatory component.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 19,
    "questionText": "A Representative fails to disclose the nature and source of their remuneration (e.g., commission) that will be received from the transaction. This is a direct breach of the Code of Conduct's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping requirement.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure requirements.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness requirement.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) contains specific rules for 'Information on Product Suppliers and FSPs'. This includes the mandatory disclosure of any commission or remuneration the representative or FSP will receive as a result of the financial service provided.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 20,
    "questionText": "A client refuses to provide the necessary information for a proper needs analysis. Which ONE of the following actions is the Representative required to take according to the General Code of Conduct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Refuse to provide any advice or service to the client.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Complete the needs analysis using market averages and assumptions.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Proceed with the transaction but make no record of it.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Clearly inform the client of the risks and limitations of the advice given as a result.",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(3)) states that if a client refuses to provide information, the representative must clearly inform the client that this refusal may limit the appropriateness of the advice and that the client must accept the risks associated with this limitation. This must also be recorded.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 21,
    "questionText": "Which scenario demonstrates a failure to manage an actual or potential conflict of interest?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A Representative charges a client a legitimate, pre-disclosed fee for service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A Representative clearly discloses the amount of commission they will earn to the client.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A Key Individual pressures Representatives to sell 'in-house' products to meet FSP targets, regardless of client suitability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A Representative advises a client to buy a product that is perfectly suitable for their needs.",
        "isCorrect": false
      }
    ],
    "explanation": "A conflict of interest (General Code, Sec 3(1)(c)) arises when the FSP's or representative's interests are prioritized over the client's. Pressuring staff to sell an FSP's own product to meet targets, even if unsuitable for the client, is a clear failure to manage this conflict, as it incentivizes poor advice for the FSP's gain.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 22,
    "questionText": "The General Code of Conduct requires all communications and advertising to clients to be:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only in English and Afrikaans.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Pre-approved by the FSCA before publication.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Factual, clear, and not misleading.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Guaranteed to provide a positive return.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(1) and other sections, including Sec 4) mandates that all communications, including advertisements and advice, must be factual, clear, concise, and not misleading. This ensures clients can make informed decisions.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 23,
    "questionText": "Mr. Chetty, a Representative, advises a client on a long-term insurance policy on 10 November 2025. What is the minimum period for which the FSP must retain the record of this advice?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "5 years from 10 November 2025.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years from 10 November 2025.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years from the date the policy is terminated.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)), aligned with Sec 18 of the FAIS Act, mandates that for an ongoing product (like a long-term policy), records must be kept for a minimum period of 5 years *after the product is terminated* (e.g., cancelled, matured, or paid out).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 24,
    "questionText": "A client submits a formal complaint to the FSP about advice received 2 years ago. The FSP is required to keep a record of this complaint, and all related correspondence, for a minimum period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "6 months from the complaint date.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "1 year from the complaint date.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years from the date the complaint is resolved.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "5 years from the date of the original advice.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) and FAIS Act (Sec 18) require *all* records relating to the FSP's compliance, including a register of complaints and their resolution, to be maintained for a minimum period of 5 years. This period starts from the date the complaint is finalized (a form of service termination).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 25,
    "questionText": "An FSP stores all required records electronically. To comply with the FAIS Act, which of the following is NOT a requirement for these electronic records?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "They must be easily retrievable.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "They must be securely backed up against loss or destruction.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "They must be stored in a format that cannot be altered.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "They must be printed out in hard copy at the end of each financial year.",
        "isCorrect": true
      }
    ],
    "explanation": "The Code of Conduct and FAIS Act (Sec 18) permit electronic storage, provided the records are secure, easily retrievable (A), and adequately backed up (B). Their integrity must be maintained (C), but there is no requirement to print them out in hard copy annually (D).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 26,
    "questionText": "If a Representative leaves the FSP's service, what is the FSP's continuing obligation regarding the records generated by that Representative during their employment?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP can destroy all records immediately.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The records must be handed over to the former Representative.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP must continue to maintain the records for the minimum required period (5 years).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP must transfer the records to the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "The legal responsibility for record keeping (General Code, Sec 3(4)) rests with the FSP, not the individual representative. Therefore, even if the representative leaves, the FSP remains obligated to securely maintain all client and advice records for the full 5-year statutory period.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 27,
    "questionText": "The FSP must ensure all required records are available for inspection by which regulatory body/person?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The local municipality.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSCA (or a person appointed by the FSCA).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The client's family members.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) explicitly states that records must be maintained and made available for inspection by the FSCA (the Authority) or a person appointed by the Authority (e.g., an auditor or inspector).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 28,
    "questionText": "The FIC Act classifies an FSP as an Accountable Institution (AI). What is the FSP's mandatory initial action to comply with the Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only accept cash transactions.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Submit a list of all clients to the FIC.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Hire an external security company.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Develop and implement a Risk Management and Compliance Programme (RMCP).",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 42A) mandates that all Accountable Institutions (AIs), including FSPs, must develop, document, maintain, and implement a Risk Management and Compliance Programme (RMCP). This RMCP contains all the internal rules and controls for CDD, reporting, and record keeping.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 29,
    "questionText": "Customer Due Diligence (CDD) requires an FSP to identify and verify the client's identity. When must the FSP generally perform CDD?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only when the client submits a complaint.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only for cash transactions over R25,000.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Before establishing a business relationship or concluding a single transaction.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Every five years, regardless of new transactions.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21) requires an Accountable Institution (FSP) to perform Customer Due Diligence (CDD) *before* establishing a business relationship or concluding a single transaction with a client. This is the 'Know Your Customer' (KYC) principle.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 30,
    "questionText": "A Representative observes a client trying to structure a cash deposit of R90,000 into three separate R30,000 transactions at different branches within a short period. This activity should trigger which type of report?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Fraudulent Transaction Report (FTR).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Property of a Terrorist Report (POTR).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Suspicious or Unusual Transaction Report (STR).",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires an STR for any suspicious or unusual transaction. 'Structuring' (breaking up a large transaction into smaller ones to avoid detection, even if they are below the CTR threshold) is a classic money laundering technique. The suspicious *nature* of the activity triggers an STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 31,
    "questionText": "A Representative submits a Suspicious Transaction Report (STR) to the FIC. They must NOT inform the client that a report has been filed. This is a crucial FIC Act principle known as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Client Confidentiality.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Record Keeping.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Tipping-Off Prohibition.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Risk-Based Approach.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29(3)) contains the 'Tipping-Off Prohibition'. This rule makes it a criminal offence to inform (or 'tip off') a client or any unauthorized person that an STR has been filed, as this could compromise the subsequent investigation.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 32,
    "questionText": "The FIC Act requires an FSP to adopt a Risk-Based Approach (RBA) to compliance. What is the fundamental principle of the RBA?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP must charge the client a fee based on their risk profile.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must only take on low-risk clients.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP’s intensity of CDD must be proportionate to the money laundering risk.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP must report all transactions, regardless of the risk.",
        "isCorrect": false
      }
    ],
    "explanation": "The Risk-Based Approach (RBA), central to the RMCP (Sec 42A), means the FSP must identify and assess its money laundering risks. The level of Customer Due Diligence (CDD) applied must be proportionate to that risk (e.g., simplified diligence for low-risk clients, enhanced diligence for high-risk clients).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 33,
    "questionText": "An FSP must identify and verify the identity of the Beneficial Owner of a legal entity client (like a company). The Beneficial Owner is the individual who ultimately:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Signs the application form.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Works as the FSP's Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Pays the initial premium.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Owns or controls the client.",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 21B) requires FSPs to 'look through' a legal entity (like a company or trust) to identify the 'Beneficial Owner'. This is the natural person (human being) who ultimately owns or controls the entity, even if they do so through a complex chain of ownership.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 34,
    "questionText": "The FIC can impose Administrative Sanctions on an FSP for non-compliance with the FIC Act (e.g., failure to implement the RMCP). Which of the following are examples of these sanctions?\n\ni. A reprimand.\nii. A restriction on business activities.\niii. A monetary fine.\niv. A mandatory jail term for the KI.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "iii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "iii and iv only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i, ii, and iii only",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) gives the FIC power to impose 'Administrative Sanctions'. These are civil penalties and include reprimands (i), restrictions on business (ii), and significant monetary fines (iii). A jail term (iv) is a criminal penalty, not an administrative sanction.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 35,
    "questionText": "Before a client can refer a complaint to the FAIS Ombud, what is the mandatory first step?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client must hire an attorney.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client must inform the FSCA.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The client must first submit the complaint to the FSP's internal complaint resolution procedure.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The client must file a police report.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Ombud Rules (Rule 6(a)) state that the Ombud will not investigate a complaint unless the client has first submitted the complaint to the FSP's internal complaints procedure and given the FSP six weeks to resolve it.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 36,
    "questionText": "An FSP fails to respond to a client's internal complaint within six weeks (42 days) of receiving it. The client is now entitled to take which action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Automatically receive compensation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "File a second complaint with the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Refer the complaint directly to the FAIS Ombud.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Ask the FSCA to audit the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "According to the Ombud Rules (Rule 7(1)), a client must wait for the FSP to provide a final response *or* for the six-week period to elapse. If the FSP fails to respond within six weeks, the client is entitled to refer the complaint directly to the Ombud.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 37,
    "questionText": "A client receives a final written rejection of their complaint from their FSP on 1 March. What is the deadline for this client to refer the same complaint to the FAIS Ombud?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "30 days from 1 March.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "1 year from the date of the original advice.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Six months from 1 March.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "5 years from the date of the transaction.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Ombud Rules (Rule 7(3)) set a time limit (prescription period). The client must submit their complaint to the Ombud within six months from the date of the FSP's final response (or from the expiry of the six-week FSP response period).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 38,
    "questionText": "A client complains to the Ombud about the poor performance of an investment fund due to negative global market conditions, not due to poor advice. Would the FAIS Ombud likely resolve this complaint?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Yes, all financial complaints are handled by the Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Yes, if the client is over 60.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "No, the Ombud generally only handles complaints related to a FAIS breach (e.g., poor advice/conduct), not poor market performance.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Yes, if the FSP agrees to the resolution.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud's jurisdiction (Rule 4) is limited to resolving disputes where a client has suffered a financial loss due to a contravention of the FAIS Act (e.g., unsuitable advice, non-disclosure, negligence). The Ombud does not handle complaints about general market performance or investment returns if there was no fault on the FSP's part.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 39,
    "questionText": "The FAIS Ombud's Final Determination (ruling) against an FSP is considered legally equivalent to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An FSP's internal decision.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A civil court judgment.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A media statement.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A tax audit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 28(5)) gives the Ombud's Final Determination significant power. If not appealed, it is deemed to be a judgment of a civil court and can be enforced as such.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 40,
    "questionText": "If the Ombud issues a Final Determination against an FSP, what is the FSP's only recourse if it disagrees with the decision?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Refuse to pay the compensation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Complain to the FSCA.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Appeal the decision to the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Apply to the Financial Services Tribunal for reconsideration.",
        "isCorrect": true
      }
    ],
    "explanation": "As per the FAIS Act (Sec 28(3)) and the FSR Act, any party aggrieved by a Final Determination of the FAIS Ombud may apply to the Financial Services Tribunal (FST) for a reconsideration of the decision. They cannot simply refuse to pay (A) or appeal internally (C).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 41,
    "questionText": "What is the primary responsibility of a Key Individual (KI) in terms of the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To personally sell the most products for the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To manage the FSP’s external marketing campaign.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "To conduct the annual external audit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "To manage and oversee the financial services rendered by the FSP and its Representatives.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines a 'Key Individual' as a natural person responsible for managing or overseeing the FSP's activities related to the rendering of financial services. They are the 'mind and management' of the FSP's compliance.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 42,
    "questionText": "Which scenario represents a failure of the Key Individual's management and oversight duty?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The KI takes a one-day leave.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The KI ensures all Representatives pass the RE5.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The KI fails to implement a control that allows an unsupervised Representative to render advice on a new product.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The KI submits the annual compliance report on time.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI is responsible for the FSP's 'Operational Ability' (Sec 8(1)(c)), which includes internal controls and supervision. Allowing an unsupervised (and likely not competent) representative to render advice is a direct failure of the KI's management and oversight duty.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 43,
    "questionText": "If a Representative fails to submit their required annual Fit and Proper declaration, what is the KI's mandatory action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ignore the matter if the Representative is performing well.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Pay the Representative a bonus.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Only inform the Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Take corrective action, which may include suspension or debarment of the Representative.",
        "isCorrect": true
      }
    ],
    "explanation": "The KI is responsible for the FSP's compliance (Sec 17(1)) and ensuring all representatives remain Fit and Proper. Failure to submit a mandatory declaration is a compliance breach. The KI must take corrective action to enforce compliance, which could ultimately lead to suspension or debarment if the non-compliance persists.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 44,
    "questionText": "If an FSP provides financial services in multiple categories (e.g., Category I and Category II), the KI must be approved by the FSCA for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only one of the categories.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The category with the lowest risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Only Category I.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "All categories in which the FSP is licensed.",
        "isCorrect": true
      }
    ],
    "explanation": "A Key Individual must meet the Fit and Proper requirements (Sec 8(1)(a)), including competence, for the specific categories of financial services they are appointed to manage. If the FSP is licensed for Cat I and Cat II, the KI must be approved for both to oversee them.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 45,
    "questionText": "Which document is the KI primarily responsible for approving and submitting to the FSCA regarding the FSP's ongoing compliance?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal tax return.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's application form.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP's annual compliance report.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's marketing budget.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 19(2)) requires the FSP to submit an annual compliance report to the FSCA. The Key Individual, as the person responsible for oversight and management, is responsible for ensuring this report is accurate and submitted on time.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 46,
    "questionText": "A Representative is advising a client on an endowment policy. This type of product is legally classified as an example of which financial product category?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Short-Term Insurance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Banking Deposit.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Foreign Currency Exchange.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Long-Term Insurance.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines various financial products. An endowment policy is a life insurance product that pays out a lump sum after a specified term or on death, classifying it as a 'Long-Term Insurance' product.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 47,
    "questionText": "Services related to a funeral policy or friendly society benefits (Subcategory 1.1) are generally associated with which product classification in terms of complexity?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tier 1 financial products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Category II financial products.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Tier 2 financial products.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Derivative instruments.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act and Fit & Proper requirements (Sec 1) categorize products by complexity. Funeral policies (Subcategory 1.1) are deemed simpler, lower-risk products and are classified as 'Tier 2'. This is why representatives advising *only* on these products are exempt from the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 48,
    "questionText": "When advising on a product, the Representative must explain the consequences of early termination (e.g., penalties or loss of benefits). This is a crucial part of the disclosure requirements for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's internal audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative's CPD.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Understanding the client's contractual rights and obligations.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's insurance policy.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3) requires full and fair disclosure. To make an informed decision, the client must understand all material terms, which includes their contractual obligations and the financial consequences (like penalties) if they terminate the product early.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 49,
    "questionText": "A Representative must understand the risk profile of the financial product being recommended. Which factor is a key determinant of a product's risk profile?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The color of the brochure.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The name of the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The potential for loss of capital and the volatility of returns.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's office address.",
        "isCorrect": false
      }
    ],
    "explanation": "A product's risk profile is determined by its potential to lose capital and the degree to which its value fluctuates (volatility). The Code of Conduct (Sec 3(2)) requires a representative to understand this to match the product to the client's risk tolerance.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 50,
    "questionText": "The term 'Product Supplier' in the FAIS Act refers to the entity that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Provides the FSP with office supplies.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Gives general financial information via mass media.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Audits the FSP's financial statements.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Issues or offers the actual financial product (e.g., insurance company, asset manager).",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines a 'Product Supplier' as the entity that creates, issues, or 'stands behind' the financial product. For example, an insurance company is the product supplier for a policy, and an asset manager is the supplier for a unit trust.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 51,
    "questionText": "Ms. Gwala, an employee of an FSP, provides a client with factual information about a financial product's current features and pricing without offering any recommendation. Under the FAIS Act, is this service classified as 'advice'?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Yes, because all information provided by an FSP's employee is considered advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Yes, if the client subsequently purchases the product.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "No, because providing factual product information is generally excluded from the definition of advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "No, only if Ms. Gwala is a Key Individual.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines 'advice' as a recommendation or proposal. The definition explicitly *excludes* the mere provision of factual information about a product's features, pricing, or administrative details, as long as no recommendation is made.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 52,
    "questionText": "Mr. Dube, a Representative, has his appointment terminated by his FSP due to persistent non-compliance (debarment). What is the mandatory regulatory action the FSP must take regarding Mr. Dube's status?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Inform the FAIS Ombud within 30 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Allow Mr. Dube to continue serving existing clients for 6 months.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Notify the FSCA immediately and update the representative register.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Pay Mr. Dube a severance package approved by the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) mandates that an FSP must immediately debar a representative who no longer complies with Fit & Proper requirements. The FSP must then immediately notify the FSCA of this debarment and remove the person from the register.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 53,
    "questionText": "An FSP operating in Category I decides to wind up its business. The FSP's license withdrawal process requires them to ensure the continuity and safety of all client records for the required statutory period. This requirement is linked to the FSP's adherence to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Continuous Professional Development (CPD).",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(d)) includes 'Operational Ability'. This covers all systems, processes, and controls, including those for business continuity, data security, and record keeping. Ensuring records are safely maintained, even during a wind-up, is a key operational requirement.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 54,
    "questionText": "What is the overarching requirement in terms of the FAIS Act and General Code of Conduct for all services rendered by an FSP?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP must use an independent compliance officer.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "All services must be rendered honestly, fairly, with due care, skill, and diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP must only advise on products with guaranteed returns.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP must renew its license annually on the same date.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a foundational principle of the FAIS Act, reinforced by the General Code of Conduct (Sec 2). The primary duty of an FSP and its representatives is to act professionally and ethically, which is encapsulated by the requirement to render services honestly, fairly, and with due care, skill, and diligence.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 55,
    "questionText": "A representative has been appointed to render services relating to a Tier 1 product. If they fail the RE5 exam after the two-year deadline, what is the *immediate* and mandatory regulatory consequence for that person?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "They are automatically debarred for 5 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "They can be re-appointed under supervision for another year.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "They must be removed from the FSP's representative register and are prohibited from acting as a Representative.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP receives a written warning from the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 13(1)(a)) sets the competence requirements. Failure to pass the RE5 for a Tier 1 product within 24 months from the date of first appointment is a failure to meet these requirements. The FSP must immediately debar the representative and remove them from the register, prohibiting them from rendering financial services.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 56,
    "questionText": "A financial writer publishes an article recommending a general investment strategy to the public in a national newspaper. The article does not target any individual client. This action is considered:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial advice, and the writer must be a licensed FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An intermediary service only.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "An exclusion from the definition of 'advice' as it is a general recommendation via mass media.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A failure to comply with the Code of Conduct's disclosure requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) explicitly excludes 'advice given by... any newspaper, magazine, ... or other mass media... to the public' from the definition of 'advice', provided it is general and not tailored to a client's specific circumstances.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 57,
    "questionText": "An FSP is licensed for Category I but decides to outsource its compliance function to an independent compliance officer. This outsourcing arrangement must be reported to the FSCA because it is a material change to the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness requirement.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Product knowledge requirement.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability requirement.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Record keeping period.",
        "isCorrect": false
      }
    ],
    "explanation": "The compliance function is a key internal control and governance structure, which falls under the FSP's 'Operational Ability'. Outsourcing such a critical function is a material change to the FSP's operations and must be managed, overseen, and reported to the FSCA.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 58,
    "questionText": "Which entity, if rendering financial services, would typically be excluded from the requirement to be a licensed FSP under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A brokerage firm providing investment advice for commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An investment management company charging a management fee.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A medical aid scheme providing advice on its own regulated health benefits.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A bank providing intermediary services on long-term insurance policies.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides exemptions. A medical aid scheme, which is regulated under the Medical Schemes Act, is generally exempt from the FAIS Act when providing services related to its own health benefits.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 59,
    "questionText": "A Representative is facing disciplinary action for gross negligence regarding client funds. This situation directly compromises the Representative's compliance with which Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (CPD).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) define 'Honesty and Integrity'. Gross negligence, especially concerning client funds, is a severe breach of the ethical standards required and directly compromises the representative's integrity and 'good standing'.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 60,
    "questionText": "Ms. Nkosi, a Representative, has completed her qualification and passed the RE5 exam. What is her ongoing responsibility regarding her Competence requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "She must only advise on products she sold in the previous year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "She must conduct annual external audits on the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "She must meet Continuous Professional Development (CPD) requirements to maintain her knowledge.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "She must re-write the RE5 every three years.",
        "isCorrect": false
      }
    ],
    "explanation": "Competence is not a once-off requirement. The Fit & Proper Requirements (Sec 29) mandate that all representatives must complete Continuous Professional Development (CPD) hours each cycle to ensure they maintain their knowledge and skills in an evolving regulatory and product environment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 61,
    "questionText": "An FSP's **Business Continuity Plan (BCP)** is a key element of Operational Ability. The primary purpose of the BCP is to ensure the FSP can:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Generate new sales leads during a recession.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Pay out all claims immediately during a disaster.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Continue operating critical services with minimal disruption following a major incident.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Reduce the FSP's annual tax burden.",
        "isCorrect": false
      }
    ],
    "explanation": "A Business Continuity Plan (BCP) is a core component of 'Operational Ability' (FAIS Act, Sec 8(1)(c)). Its purpose is to ensure the FSP has a plan to manage and recover from major disruptions (like a fire, flood, or cyber-attack) and can continue its critical functions to service clients.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 62,
    "questionText": "Mr. Sizwe, a Representative, has successfully served his mandatory 12 months under supervision for a specific product category. What is the final step for the FSP to confirm his full competence for this category?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Mr. Sizwe must be promoted to Key Individual.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must assess and confirm Mr. Sizwe has gained the necessary experience and update his status on the register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Mr. Sizwe must complete 10 new CPD hours immediately.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP must update its license to Category II.",
        "isCorrect": false
      }
    ],
    "explanation": "Once a representative under supervision has completed the minimum experience period (Fit & Proper, Sec 25), the FSP must internally assess and confirm that the representative is now competent. The FSP must then update the representative's status on the central register, notifying the FSCA that the supervision is lifted.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 63,
    "questionText": "The FSP is required to maintain a Representative register. The formal, mandatory action of removing a representative from this register for failing to comply with Fit and Proper requirements is legally referred to as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Retrenchment.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Resignation.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Debarment.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Suspension.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 13(2) and Sec 14) outlines the process of 'Debarment'. This is the formal, mandatory action an FSP must take to remove a representative who no longer meets the Fit and Proper requirements (e.g., for dishonesty or incompetence).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 64,
    "questionText": "A Key Individual (KI) of an FSP is facing a civil judgment for a substantial amount of unpaid personal debt. This situation most directly threatens the KI's compliance with which Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": true
      }
    ],
    "explanation": "The Fit & Proper requirements (Sec 7) state that KIs and Representatives must be 'Financially Sound'. A large, unpaid civil judgment demonstrates an inability to manage one's own financial obligations, which is a direct breach of the Financial Soundness requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 65,
    "questionText": "An FSP must appoint a Compliance Officer whose primary role is to monitor and report on the FSP's adherence to regulatory requirements. This requirement is intended to reinforce the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability (Control and Governance).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "The appointment of a Compliance Officer is a key governance and internal control mechanism. This function is a mandatory part of the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) to ensure it has the systems in place to monitor its own compliance.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 66,
    "questionText": "If the FSCA suspects an FSP or Representative is no longer Fit and Proper, what is the regulatory body's first step before taking final punitive action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Immediately withdraw the FSP's license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Inform the media of the suspicion.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Issue a notice of intention to take action (e.g., suspension or withdrawal).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Appoint a new Key Individual for the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8) requires procedural fairness. Before the FSCA can suspend or withdraw a license for a breach of Fit and Proper requirements, it must first issue a notice of its intention to do so and provide the FSP with an opportunity to respond to the allegations.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 67,
    "questionText": "An FSP's **Conflict of Interest Management Policy** is mandatory. Which of the following is the primary purpose of this policy?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To prohibit all FSP staff from ever having a conflict.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To justify why a representative should receive higher commission.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "To identify, mitigate, and disclose conflicts that might influence objective advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "To keep the policy secret from the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(c)) requires every FSP to have a Conflict of Interest Management Policy. Its purpose is not to prohibit all conflicts (which is impossible), but to ensure a formal process exists to identify, mitigate (reduce the effect of), and disclose those conflicts to the client.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 68,
    "questionText": "The Code of Conduct stipulates that advice must be 'appropriate' to the client. What must the Representative do to ensure this requirement is met?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only recommend the cheapest product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Ensure the product recommended is suitable for the client's needs and financial objectives.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Guarantee a specific return on the investment.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Ensure the client signs a waiver confirming they accept all risks.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(1), linked to Sec 8 on suitability) requires advice to be appropriate. This is achieved by conducting a needs analysis to understand the client's needs and objectives, and then recommending a product that is suitable for that specific client.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 69,
    "questionText": "A Representative is recommending the replacement of a client's existing life policy with a new one. The Code of Conduct imposes strict additional duties. Which action is mandatory?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only offer the replacement product if the client is over 65.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Clearly state the disadvantages, costs, and risks of the replacement.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Inform the FAIS Ombud of the replacement.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Wait 30 days before implementing the replacement.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(2)) has specific, strict rules for 'replacement' advice. Because replacement can harm a client (e.g., new waiting periods, higher costs), the representative *must* provide a detailed comparison and clearly disclose all disadvantages, costs, and potential loss of benefits.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 70,
    "questionText": "The Code of Conduct emphasizes the 'Delivery of fair outcomes to clients.' This requirement is part of the shift towards the new Conduct Standards, focusing on the principle of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Legislative Currency.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Market Share.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Treating Customers Fairly (TCF).",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)) and the broader regulatory framework (FSR Act) are built on the principles of 'Treating Customers Fairly' (TCF). The six TCF outcomes are designed to ensure FSPs deliver fair outcomes to clients, rather than just following technical rules.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 71,
    "questionText": "A Representative provides a client with advice but deliberately fails to mention a high penalty for early withdrawal associated with the recommended product. This is a breach of the duty to ensure all communications are:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only in writing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Factual, clear, and not misleading.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Approved by the FSP's CEO.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Technical and concise.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) mandates that all information and disclosures must be 'factual, clear, and not misleading'. Deliberately omitting a material fact, like a high penalty, makes the communication misleading and is a severe breach of this duty.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 72,
    "questionText": "The FSP must have appropriate policies and procedures to ensure the suitability of the financial product. The primary aim of this is to protect the client from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competition from other FSPs.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Purchasing products that do not align with their financial goals or risk profile.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP being audited by the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's IT systems failing.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 4) requires FSPs to have procedures to assess product suitability. The entire purpose of the 'suitability' requirement is to protect clients from harm by ensuring the products they purchase are appropriate for their specific financial situation, goals, and risk tolerance.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 73,
    "questionText": "Ms. Govender, a Key Individual, is conducting an internal audit. She finds that the FSP's records of new Representative appointments are only kept for 12 months. This is a failure to comply with the minimum FAIS Act record-keeping period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "7 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18) mandates that all records, including records of representative appointments and the FSP's register, must be maintained for a minimum period of 5 years. Keeping them for only 12 months is a clear breach.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 74,
    "questionText": "The record of advice provided to a client must include a statement that the client has been advised of their **right to complain**. This is a requirement related to both the Code of Conduct and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Record Keeping.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) specifies what must be included in the 'Record of Advice'. This record serves as proof of compliance, and must include evidence that mandatory disclosures (like the FSP's complaints procedure and the client's right to complain) were provided.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 75,
    "questionText": "If the FSP loses client records due to a system failure and has no backup, which core Fit and Proper requirement is fundamentally compromised?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability (Business Continuity and Control).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18) mandates record keeping. The *ability* to keep records securely, including having data backups and disaster recovery, is a core component of an FSP's 'Operational Ability'. A loss of data due to a lack of backup is a failure of this operational control.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 76,
    "questionText": "For an ongoing financial service with no definite end date (e.g., a living annuity), the record-keeping period of 5 years starts from which date?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The date the FSP's license was first issued.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The date the financial service to the client ceased.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The date the Representative passed the RE5.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The date the client was born.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) states that for ongoing services (like a recurring investment), the 5-year record retention period begins from the date the relationship or service is terminated by either party.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 77,
    "questionText": "A Representative must record all material aspects of the service rendered. Which of the following is least likely to be considered a material aspect requiring mandatory recording?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The product recommended and the date of the advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's financial situation and needs analysis.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Representative's personal lunch break schedule.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Any fee or commission received by the FSP/Representative.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) requires the recording of all information *material* to the financial service. This includes the client's details, the needs analysis, the products recommended, and the remuneration. A representative's personal schedule is not material to the service rendered.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 78,
    "questionText": "A Suspicious Transaction Report (STR) must be submitted to the Financial Intelligence Centre (FIC). What is the deadline for submission?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Within 30 working days of the transaction.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "At the end of the financial year.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "As soon as reasonably possible after the suspicion is formed.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only if the amount is over R100,000.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) is very strict on the timing of STRs. An FSP must file the report 'as soon as reasonably possible' after becoming aware of the suspicion, which is interpreted as immediately and without delay (typically within 15 days, but the legal duty is to act immediately).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 79,
    "questionText": "An FSP determines that a new client is a **Politically Exposed Person (PEP)**. Under the FIC Act, what action is the FSP required to take?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Immediately refuse to do business with them.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Exclude them from all CDD requirements.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Report them to the Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Obtain senior management approval and apply enhanced due diligence (EDD).",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 21C) classifies PEPs as high-risk. FSPs are not prohibited from dealing with them, but they *must* apply 'Enhanced Due Diligence' (EDD), which includes obtaining senior management approval to establish the relationship and verifying the source of funds/wealth.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 80,
    "questionText": "An FSP's **Risk Management and Compliance Programme (RMCP)** must be formally approved by:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The local police station.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Board of Directors or Senior Management.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 42A) mandates that the RMCP, which represents the FSP's governance and control framework for AML/CFT, must be developed, implemented, and formally approved by the FSP's Board of Directors or (if no board exists) its Senior Management.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 81,
    "questionText": "The FIC Act requires FSPs to verify the **source of funds** when the money laundering risk is deemed high. This is a component of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Standard Due Diligence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Simplified Due Diligence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Enhanced Due Diligence (EDD).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "General Record Keeping.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 20/21) requires identifying the source of funds/wealth as part of 'Enhanced Due Diligence' (EDD). This higher level of scrutiny is applied to high-risk clients, such as Politically Exposed Persons (PEPs) or clients from high-risk jurisdictions.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 82,
    "questionText": "Which statement regarding **Cash Threshold Reporting (CTR)** is accurate for an FSP (Accountable Institution)?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "CTRs only apply to transactions over R50,000.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "CTRs are only required for non-resident clients.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "CTRs are mandatory for all cash transactions that meet or exceed a specific prescribed amount.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FIC Act no longer requires CTRs.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 28) mandates that Accountable Institutions must report all cash transactions (or series of transactions) that meet or exceed the prescribed threshold (currently R49,999.99, so R50,000.00 and above). This report is mandatory, regardless of suspicion.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 83,
    "questionText": "An FSP fails to report a suspicious transaction that a compliance audit later reveals. This failure exposes the FSP and its Key Individual to the risk of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A written warning from the Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A mandatory holiday for the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Significant administrative sanctions (e.g., fines) from the FIC.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A review of their marketing strategy.",
        "isCorrect": false
      }
    ],
    "explanation": "Failure to report a mandatory item (like an STR) is a serious breach of the FIC Act. Under Sec 45B, the FIC can impose severe 'Administrative Sanctions' for this failure, including substantial monetary fines, reprimands, and restrictions on the FSP's business.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 84,
    "questionText": "Under the Risk-Based Approach (RBA), which type of client typically allows for **Simplified Due Diligence (SDD)**?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A client who wants to pay R500,000 in cash.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A foreign resident with complex trust structures.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A client who is a close associate of a PEP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A known, listed domestic bank or public institution.",
        "isCorrect": true
      }
    ],
    "explanation": "The RBA allows for 'Simplified Due Diligence' (SDD) when the money laundering risk is proven to be low. Other listed financial institutions (like domestic banks) or public companies listed on a stock exchange are considered low-risk, as they are already subject to their own AML regulations.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 85,
    "questionText": "Once an FSP receives a written complaint from a client, the FSP must acknowledge receipt of the complaint within:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "30 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A reasonable time.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "6 months.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "7 working days.",
        "isCorrect": false
      }
    ],
    "explanation": "The rules governing the FSP's internal complaints procedure (linked to the Ombud Rules) state that an FSP must, upon receipt of a complaint, acknowledge it to the client within a 'reasonable time' and inform them of the internal resolution process.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 86,
    "questionText": "The FAIS Ombud's primary function is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Prosecute FSPs for criminal offences.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Issue FSP licenses.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Set the interest rates for financial products.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Resolve disputes between clients and FSPs/Representatives in a procedurally fair, informal, and quick manner.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 27(1)) establishes the FAIS Ombud's office to resolve disputes (complaints) between clients and FSPs. The process is specifically designed to be informal, quick (expeditious), and procedurally fair, acting as an alternative to the expensive civil court system.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 87,
    "questionText": "What must an FSP ensure when communicating its final decision and reasons to a client's internal complaint?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The response is only verbal.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The response must be in writing and explain the reasons for the decision, and advise the client of their right to approach the Ombud.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The response is approved by the Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The response includes a marketing brochure.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 6(b)) and the General Code of Conduct require that the FSP's final response to an internal complaint must be in writing, clearly state the reasons for the decision, and inform the client of their right to refer the matter to the Ombud.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 88,
    "questionText": "The FAIS Ombud has a specific monetary limit for the amount of compensation or loss it can determine (currently R800,000). If a client's claim exceeds this limit, the Ombud must:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Resolve the claim anyway.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Refer the claim to the FIC.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Decline jurisdiction unless the client agrees to abandon the excess amount.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Ask the FSP to pay the full amount immediately.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(3)) sets a jurisdictional monetary limit (R800,000). If a client's claim exceeds this, the Ombud does not have jurisdiction. The only way the Ombud can hear the case is if the client formally agrees in writing to 'abandon' the portion of their claim that exceeds the R800,000 limit.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 89,
    "questionText": "If a client refers a complaint to the FAIS Ombud, what is the mandatory action for the FSP?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ignore the Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only communicate via email.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Cooperate fully with the Ombud's investigation and provide all requested information.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Immediately change their FSP license category.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(2)) and the Ombud Rules mandate that all parties to a complaint (including the FSP and representative) must cooperate fully with the Ombud. Failure to provide requested information or cooperate is a serious compliance breach.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 90,
    "questionText": "A Representative is found guilty of non-compliance (e.g., dishonesty) after an Ombud investigation. The Ombud may refer the Representative's conduct to the FSCA for potential:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A celebratory dinner.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Debarment (removal from the Representative register).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD exemption.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Ombud's role is to resolve the client's complaint (Sec 28(1)). However, if the Ombud finds evidence of serious non-compliance with the FAIS Act (like dishonesty), they can refer the matter to the FSCA for regulatory action, which includes potential debarment of the representative.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 91,
    "questionText": "The KI must ensure that the FSP maintains the required Operational Ability. This includes overseeing the adequacy of the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Stationery supply.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Lunch menu.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Internal controls, systems, and compliance infrastructure.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Number of cars in the parking lot.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's duty of management and oversight (Sec 17(1)) directly links to the FSP's 'Operational Ability'. This means the KI is responsible for ensuring the FSP has the necessary systems, internal controls, risk management, and compliance infrastructure to function correctly.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 92,
    "questionText": "A KI must be actively involved in the **oversight and management** of the FSP's financial services. Which statement is legally correct regarding this responsibility?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It can be delegated away entirely to a junior staff member.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It is a continuous responsibility for which the KI remains accountable, even if tasks are delegated.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It is only required when the FSCA conducts an audit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It only applies to Category II FSPs.",
        "isCorrect": false
      }
    ],
    "explanation": "The role of a Key Individual (FAIS Act, Sec 8(1)) is one of ultimate responsibility for management and oversight. While tasks can be delegated, the *accountability* for compliance remains with the KI. It is a continuous, active duty, not a passive one.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 93,
    "questionText": "If the KI fails to meet the Fit and Proper requirements, the FSCA can take action against:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Suppliers only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only the Representatives of the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Only the client.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Both the Key Individual and the FSP's license.",
        "isCorrect": true
      }
    ],
    "explanation": "The KI's 'Fit and Proper' status is integral to the FSP's license. If the KI (the 'mind and management') is found to be not Fit and Proper, the FSCA can debar the KI personally and also take action against the FSP's license (e.g., suspension or withdrawal), as the FSP no longer meets its licensing requirements.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 94,
    "questionText": "If a KI becomes aware that the FSP is no longer complying with a specific, material aspect of the FAIS Act, their mandatory duty is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Wait for the annual audit to fix the problem.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Resign immediately without informing anyone.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Only inform the receptionist.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Take immediate corrective action and report the non-compliance to the FSCA if material.",
        "isCorrect": true
      }
    ],
    "explanation": "The KI is responsible for the FSP's compliance (Sec 19). If they become aware of non-compliance, their duty is to take immediate steps to rectify the breach. Material breaches must also be reported to the FSCA (as part of compliance reporting).",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 95,
    "questionText": "The KI must ensure the FSP's processes are in place to prevent a Representative from acting outside the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "KI's personal opinion.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Country's borders.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Scope of the FSP's license (or the Representative's mandate).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "KI's retirement fund.",
        "isCorrect": false
      }
    ],
    "explanation": "A core duty of the KI is to manage and oversee the representatives (Sec 13(1)). This includes having internal controls to ensure that representatives only provide services for the products and categories for which they are competent and mandated, and which are on the FSP's license.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 96,
    "questionText": "Which product category is generally classified as a **Tier 1** financial product, requiring the Representative to pass the RE5 exam?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A simple short-term health service benefit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A retirement annuity (long-term insurance Category B2).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A funeral policy (Subcategory 1.1).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A Tier 2 general banking deposit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) and Fit & Proper requirements differentiate between Tier 1 (complex) and Tier 2 (simple) products. A retirement annuity is a complex, long-term savings product and is classified as Tier 1, which mandates that the representative must pass the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 97,
    "questionText": "What is the overarching requirement for a Representative when applying their knowledge of the financial products environment?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To be able to write the product's legal contract.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To ensure that the financial product and service are suitable and appropriate for the client.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "To only advise on the cheapest available product.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "To be able to personally invest in the products.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3(2), linked to Sec 8) requires a needs analysis. The *purpose* of product knowledge is to enable the representative to compare the client's identified needs with the features of a product, ensuring the final recommendation is suitable and appropriate.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 98,
    "questionText": "What does the term **'liquidity'** define in the context of a financial product?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The profit margin on the product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The physical location of the Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The cost of the financial product.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "How easily and quickly the client can access their funds without a significant loss in value.",
        "isCorrect": true
      }
    ],
    "explanation": "In finance, 'liquidity' refers to the ease and speed with which an asset or investment (the financial product) can be converted into cash. A product with high liquidity (like a savings account) is easy to access, while one with low liquidity (like property or a fixed-term investment) is not.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 99,
    "questionText": "A **defined contribution retirement fund** is a financial product where the benefit ultimately received by the client depends primarily on:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A guarantee from the government.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The contributions made and the investment returns earned.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client's age when they start the fund.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's annual sales.",
        "isCorrect": false
      }
    ],
    "explanation": "In a 'defined contribution' fund (like a pension fund or retirement annuity), the final payout (benefit) is *not* guaranteed. It is 'defined' only by the amount of money contributed (by the client and/or employer) *plus* the investment growth (or loss) those contributions generated over time.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 100,
    "questionText": "When comparing different financial products for a client, the Representative must clearly explain all of the following EXCEPT:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The key features and benefits of each product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The costs and charges associated with each product.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The name of the Product Supplier's CEO.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Any significant exclusions or risks of each product.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1) and Sec 4) requires full and fair disclosure. To allow a client to make an informed decision, the representative must provide factual, clear, and non-misleading information about all material aspects, including features (A), costs (B), and risks (D). The name of the supplier's CEO (C) is not a material fact for this comparison.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 101,
    "questionText": "An FSP operating in Category II (discretionary investment management) decides to start offering advice on long-term insurance (Category I). Which regulatory action is required before they can legally render this new service?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Submit a new annual financial statement to the FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Inform the FAIS Ombud of the change in service.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Apply to the FSCA for an extension of the license to include Category I.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Appoint a new independent Compliance Officer.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP's license is specific to the categories of financial services it is authorized to provide (FAIS Act, Sec 8). To offer services in a new category (moving from Cat II to offer Cat I), the FSP must first apply to the FSCA for a variation or extension of its license.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 102,
    "questionText": "Ms. Zinhle was appointed as a Representative 25 months ago to advise on pension fund benefits (Tier 1). She has not yet passed the RE5. What is the FSP's **mandatory and immediate** regulatory duty?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Allow her to continue working under strict supervision for an indefinite period.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately debar her and remove her from the FSP's Representative register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Pay a fine to the FSCA on her behalf to extend the deadline.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Transfer her to a role only dealing with Tier 2 products.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 13(1)(a)) requires representatives advising on Tier 1 products to pass the RE5 within 24 months (two years) of their date of first appointment. As 25 months have passed, Ms. Zinhle no longer meets the 'Competence' requirement and is not Fit and Proper. The FSP *must* immediately debar her and remove her from the register.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 103,
    "questionText": "A company renders financial services in relation to securities and collective investment schemes. Which other primary piece of legislation is integrated with the FAIS Act to regulate their market conduct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "National Credit Act (NCA).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Promotion of Access to Information Act (PAIA).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Sector Regulation Act (FSR Act).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Value-Added Tax Act (VAT Act).",
        "isCorrect": false
      }
    ],
    "explanation": "The Financial Sector Regulation (FSR) Act is the overarching 'twin peaks' legislation that establishes the FSCA (the market conduct regulator) and the Prudential Authority. The FAIS Act is now a specific piece of conduct legislation that operates *under* the authority and framework of the FSR Act.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 104,
    "questionText": "If an FSP decides to **debar** a Representative due to a breach of the Code of Conduct, the FSP must inform the FSCA within a specific timeframe and state the reasons. This timeframe is generally considered to be:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Within 30 days of the decision.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Within 6 months of the incident.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Immediately or as soon as reasonably possible.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only at the time of the FSP's annual compliance report.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) is clear that when a representative is debarred, the FSP must 'immediately' notify the FSCA. This is to ensure the central register is updated without delay, preventing the debarred individual from being employed by another FSP.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 105,
    "questionText": "Mr. Van Wyk, a Representative, assists a client with the signing and submission of an application form for an insurance policy without offering any recommendation. This activity is classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Key Individual duty.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Intermediary Service.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Development.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'Intermediary Service' as any act *other than advice* performed by a person for or on behalf of a client or product supplier, which results in the client entering into a financial product. Assisting with application forms falls squarely within this definition.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 106,
    "questionText": "The FAIS Act requires FSPs to have adequate guarantee or indemnity insurance. This requirement is primarily designed to ensure the FSP can:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Fund new product development.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compensate clients for losses resulting from negligence or professional errors.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Pay staff salaries during a slow business period.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Report suspicious transactions to the FIC.",
        "isCorrect": false
      }
    ],
    "explanation": "This requirement falls under 'Operational Ability' (FAIS Act, Sec 8(1)(d)). Professional Indemnity (PI) insurance is not for the FSP's running costs, but to ensure that if the FSP or its representatives cause a client financial loss due to negligence or an error, there are funds available to compensate that client.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 107,
    "questionText": "A person who is only appointed to render financial services for funeral and friendly society benefits (Subcategory 1.1) is generally:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Required to write the RE5 examination.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Automatically appointed as a Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Exempted from writing the RE5 examination.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Required to write the RE1 examination only.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 1) differentiate between Tier 1 (complex) and Tier 2 (simple) products. Funeral and friendly society benefits (Subcategory 1.1) are classified as Tier 2. Representatives who *only* advise on Tier 2 products are explicitly exempt from the RE5 examination.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 108,
    "questionText": "The **date of first appointment** of a Representative is a critical FAIS Act concept because it triggers the statutory deadline for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP’s license renewal date.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative to pass the RE5 regulatory examination (2 years).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The start of the 5-year record-keeping period for the first client.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The submission of the FSP’s first annual compliance report.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'date of first appointment' (DOFA) (FAIS Act, Sec 13) is the date the representative was first ever appointed to advise on Tier 1 products. This date starts the 24-month (2-year) 'clock' within which they must pass the RE5 to meet the competence requirements and remain on the register.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 109,
    "questionText": "A Representative fails to disclose a previous suspension by another FSP during their current FSP's appointment process. This omission directly violates the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) mandate 'Honesty and Integrity'. Deliberately failing to disclose a material fact (like a previous suspension) during the appointment process is an act of dishonesty and a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 110,
    "questionText": "A Representative must ensure that the financial services they provide are **appropriate** for the client, based on their needs analysis. This obligation is tied to which Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence (Skill and Knowledge).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 24) define 'Competence' as having the necessary skills and knowledge to render the financial service. A key component of this skill is the ability to conduct a needs analysis and ensure that the advice given is suitable and appropriate for the client.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 111,
    "questionText": "An FSP's external IT contractor mistakenly deletes the entire client database. Which element of Operational Ability did the FSP fail to properly control?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness (Capital adequacy).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Business Continuity and Data Management Systems.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Key Individual Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity controls.",
        "isCorrect": false
      }
    ],
    "explanation": "Operational Ability (FAIS Act, Sec 8(1)(d)) includes having robust systems for data management, security, and business continuity. The FSP is responsible for its outsourced providers. A failure to have backups or controls to prevent such a deletion is a critical failure of its data management and continuity systems.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 112,
    "questionText": "A Representative is appointed under supervision for Category I financial products. The **maximum period** they are permitted to operate under this supervision from their date of first appointment is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "60 months (5 years).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Indefinitely, provided the FSP agrees.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 22) set the rules for supervision. A representative who has not yet met the experience requirement can work under supervision, but this arrangement is limited to a *maximum* period of 60 months (5 years) from the date of first appointment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 113,
    "questionText": "The FSP must have a documented process for the **supervision** of its Representatives. This is a critical element of the Operational Ability requirement, particularly in relation to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's marketing budget.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Managing the activities of Representatives to ensure compliance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Deciding which products to offer.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's quarterly tax return.",
        "isCorrect": false
      }
    ],
    "explanation": "Operational Ability (FAIS Act, Sec 8(1)(d)) covers all internal controls and governance. A documented supervision process is a key internal control for managing the FSP's representatives, ensuring they remain competent, compliant, and are providing suitable advice.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 114,
    "questionText": "Which action by an FSP indicates a failure to comply with the **Honesty and Integrity** requirements?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Failing to conduct an annual internal audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Using client investment funds for the FSP's personal operational expenses.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Not completing the required CPD hours for staff.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Having only one server for all data storage.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(a)) requires Honesty and Integrity. Misappropriating client funds (stealing) for personal or business use is a severe criminal act and the most direct violation of the duty of honesty and integrity.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 115,
    "questionText": "The requirement that an FSP maintains **'adequate liquidity'** is a critical aspect of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 4) detail the 'Financial Soundness' rules. A key component of this is that an FSP must maintain sufficient liquid assets to meet its liabilities as they become due, ensuring it can pay its debts and remain a going concern.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 116,
    "questionText": "The FSP must ensure that its compliance systems and staff are not unduly influenced by the need to secure new business. This is a measure to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's profit margin.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The independence and effectiveness of the compliance function.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The public relations strategy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's marketing budget.",
        "isCorrect": false
      }
    ],
    "explanation": "This relates to 'Operational Ability' (FAIS Act, Sec 8(1)(d)) and governance. The compliance function must be independent to be effective. If it is pressured by sales targets, it cannot objectively monitor for non-compliance, which compromises the FSP's operational integrity.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 117,
    "questionText": "Mr. Sizwe, a Representative, advises a client to switch from Product A to Product B, primarily because Product B offers him a higher commission, though both products are equally suitable. Which principle of the Code of Conduct is most likely breached?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping adherence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure of product features.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Prioritising client interests (Conflict of Interest).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Fulfilling CPD requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a classic 'Conflict of Interest' (General Code, Sec 3). The representative is prioritizing his own financial gain (higher commission) over the client's interests. Even if the products are 'equally suitable', the advice is tainted by the conflict. This also relates to replacement advice (Sec 7(2)), which must be in the client's best interest.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 118,
    "questionText": "A Representative must provide clients with a **status disclosure** document. This document primarily contains:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Details of the client's family.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Details about the FSP, its license, and the Representative's status.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's bank account details.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The annual financial statements of the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(a) and Sec 4) mandates disclosures about the FSP and representative. This 'status disclosure' includes the FSP's name, license number, authorized categories, and details about the representative (e.g., whether they are supervised or not).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 119,
    "questionText": "A Representative receives a gift valued at R1,500 from a product supplier after closing a large sale. To comply with the Conflict of Interest policy, what should the Representative do?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Accept the gift and keep it secret from the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately resign from the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Declare the gift to the FSP and adhere to the FSP's policy on acceptable limits.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Return the gift to the product supplier immediately.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3(1)(c)) requires FSPs to have a policy to manage conflicts of interest, including gifts. This policy sets limits (e.g., gifts over R1,000 may be prohibited or require declaration). The representative's duty is to declare the gift to the FSP and follow the FSP's internal policy, which ensures transparency and management of the conflict.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 120,
    "questionText": "When a Representative gives advice, the recommendation must be recorded in writing and provided to the client:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only if the client specifically requests it.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Within 30 days of the transaction.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Only at the end of the calendar year.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "As soon as reasonably possible after the advice is given.",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(1) and Sec 9) requires a written 'Record of Advice' to be provided to the client. This record must be given to the client 'as soon as reasonably possible' after the advice is rendered, to ensure the client has a formal record of the recommendation.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 121,
    "questionText": "An FSP's website claims that a specific investment product has 'guaranteed double-digit returns.' Which requirement of the Code of Conduct is primarily violated by this statement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Suitability of advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Management of Conflicts of Interest.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honest and factual communication (misleading statements).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Record keeping duration.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) mandates that all communications (including advertising) must be 'factual, clear, and not misleading'. Guaranteeing investment returns is almost always misleading, as most investments carry risk. This is a breach of honest and factual communication.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 122,
    "questionText": "The Code of Conduct requires an FSP to provide the client with access to the FSP's internal complaint resolution procedure. This is a requirement related to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FIC Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Client Relations and TCF.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1) and Sec 16) places a strong emphasis on fair client relations and Treating Customers Fairly (TCF). Providing clear and accessible information on how to complain is a fundamental part of managing the client relationship fairly and transparently.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 123,
    "questionText": "The record of advice must clearly distinguish between **advice** and **intermediary services** rendered. This separation is required to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP can charge different fees.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative knows which regulatory rules apply to each service.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP can demonstrate its compliance with the Code of Conduct's specific rules for advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The client can easily find the FSP's address.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct has specific, stringent rules for 'advice' (like suitability analysis) that do not apply to 'intermediary services'. The record of advice (Sec 3(4)) must be detailed enough to prove that these specific advice-related duties (like the needs analysis) were properly performed.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 124,
    "questionText": "A Representative uses a personal notebook to record client details and the needs analysis. According to FAIS Act requirements, this system is acceptable only if:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative buys a new notebook every year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The notebook is approved by the client.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP's record-keeping procedures incorporate and secure this method, ensuring retrieval and auditability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The details are not shared with the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18) places the record-keeping duty on the FSP. The *method* is not prescribed, but it *must* be secure, auditable, and easily retrievable. If the FSP's official, secure procedure is to incorporate the notebook into its system (e.g., scanning and backing it up), it could be compliant. The record *must* be part of the FSP's system (D is incorrect).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 125,
    "questionText": "The FSP must retain records of all **internal compliance reports and audits**. This is crucial for demonstrating:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's marketing success.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The amount of commission paid to the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Ongoing adherence to the Fit and Proper requirements and FAIS Act.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The number of staff employed.",
        "isCorrect": false
      }
    ],
    "explanation": "Internal compliance reports and audits are part of the FSP's 'Operational Ability'. These records (FAIS Act, Sec 18) are the primary evidence the FSP can use to demonstrate to the FSCA that it is actively monitoring its own compliance with the FAIS Act and all Fit and Proper requirements.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 126,
    "questionText": "Which party is ultimately responsible for ensuring the FSP's records are maintained correctly for the minimum 5-year period?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP and the Key Individual.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The external Compliance Officer only.",
        "isCorrect": false
      }
    ],
    "explanation": "The legal obligation for record keeping (Code of Conduct, Sec 3(4) and FAIS Act, Sec 18) rests with the licensed entity, the FSP. The Key Individual, as the person responsible for managing and overseeing the FSP's compliance, is ultimately accountable for ensuring the FSP meets this obligation.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 127,
    "questionText": "The FSP's register of Representatives must contain, among other details, which of the following information?\n\ni. The categories of financial services the Representative is mandated for.\nii. Whether the Representative is working under supervision.\niii. The date of first appointment.\niv. The Representative's personal bank account details.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii, and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "i and iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's representative register (FAIS Act, Sec 13) is a key compliance record. It must contain all relevant details about the representative's appointment, including their mandate (i), competence status (ii), and their date of first appointment (iii). Personal bank details (iv) are not required.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 128,
    "questionText": "The primary objective of the Financial Intelligence Centre Act (FIC Act) is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Control interest rates in the banking sector.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Promote fair outcomes for clients of FSPs.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Combat money laundering, terrorist financing, and related crimes.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Set the qualification standards for FSPs.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act's (Sec 3) main purpose is to establish the Financial Intelligence Centre (FIC) and to introduce measures to identify the proceeds of crime, combat money laundering (ML), and prevent the financing of terrorist activities (CFT).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 129,
    "questionText": "The FIC Act requires FSPs to perform ongoing **monitoring** of the client's transactions and business relationship. This is to ensure that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client is always happy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP is meeting its sales targets.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The transactions are consistent with the FSP's knowledge of the client and their risk profile.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's license is renewed.",
        "isCorrect": false
      }
    ],
    "explanation": "Customer Due Diligence (FIC Act, Sec 20-21) is not just a once-off event. FSPs must conduct ongoing monitoring to ensure that the client's transactions remain consistent with what the FSP knows about the client's business and risk profile. Any significant deviation may be suspicious.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 130,
    "questionText": "A Representative notices a client suddenly requesting to transfer a large sum of money to a third party in a known high-risk country, which is highly inconsistent with the client's historical low-value transactions. The Representative should immediately file a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Internal Compliance Audit Report (ICAR).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Suspicious or Unusual Transaction Report (STR).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Suitability Report (PSR).",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires an STR when a transaction is 'suspicious or unusual'. A transaction that is inconsistent with a client's known profile (e.g., a sudden, large, high-risk international transfer for a client who normally only makes small, local transactions) is a classic indicator of suspicious activity.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 131,
    "questionText": "If the FIC Act's Tipping-Off Prohibition applies, a Representative who has filed an STR must not inform the client because doing so could:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Violate the FSP's privacy policy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compromise the investigation and allow the suspects to move funds.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Disclose the Representative's personal details.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Cause the client to submit a complaint to the Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Tipping-Off Prohibition' (FIC Act, Sec 29(3)) is a criminal offence. Its purpose is to protect the integrity of the investigation by ensuring the suspect is not alerted, which would give them a chance to move illicit funds, destroy evidence, or flee.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 132,
    "questionText": "If an FSP has filed an STR, it must not proceed with the suspicious transaction until it is advised by the FIC that it can, or until a specific period has lapsed. This is to allow the FIC to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Issue an intervention or monitoring order.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Conduct a full audit of the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "File a Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Contact the FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "When an STR is filed, the FSP must not proceed with the transaction for a short period. This 'waiting period' is to give the FIC time to analyze the report and decide whether to intervene, for example, by issuing a monitoring order (requiring reports on all future transactions) or an intervention order (blocking the transaction).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 133,
    "questionText": "When an FSP is dealing with a customer from a high-risk country (as identified by FATF), what level of Customer Due Diligence (CDD) is the FSP required to implement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence (SDD).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Standard Due Diligence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "No Due Diligence is required.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Enhanced Due Diligence (EDD).",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 21A) mandates 'Enhanced Due Diligence' (EDD) for specific high-risk situations. This includes transactions or business relationships with individuals or entities from countries identified as high-risk by authorities like the Financial Action Task Force (FATF).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 134,
    "questionText": "An FSP's internal control measures, required by the RMCP, include ensuring that all employees are appropriately screened. This screening is primarily against:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Social media profiles.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Local sports teams.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Targeted Financial Sanctions lists.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "University graduation lists.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) requires robust internal controls, including employee screening. This is to ensure the FSP does not hire individuals who are themselves on sanctions lists (e.g., terrorist watchlists, known as Targeted Financial Sanctions lists) and to check for criminal records involving dishonesty.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 135,
    "questionText": "The FAIS Ombud's resolution process is designed to be **expeditious**. This means the process is intended to be:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Very expensive.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only for very large complaints.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Completed quickly and efficiently.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Fully publicised in the newspaper.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 3(a)) explicitly state that the Ombud must resolve complaints in a manner that is 'informal, fair, and expeditious'. 'Expeditious' means quick and efficient, positioning the Ombud as a faster alternative to the civil courts.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 136,
    "questionText": "If a complaint has been referred to the FAIS Ombud, what is the mandatory action for the FSP?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Immediately change their FSP license category.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Cooperate fully with the Ombud's investigation and provide all requested information.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Ignore the Ombud and wait for a court summons.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only communicate via a legal representative.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Ombud Rules (Rule 11) and FAIS Act (Sec 27) impose a legal duty on all parties to a complaint, including the FSP, to cooperate fully with the Ombud's investigation. This includes providing all requested documents and information in a timely manner.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 137,
    "questionText": "Which situation falls under the FAIS Ombud's jurisdiction?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A client complaining about the FSP's poor tea-making facilities.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A client complaining that their investment lost money due to a global recession.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A client complaining that a Representative failed to conduct a proper needs analysis, leading to unsuitable advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A complaint about the FSP's poor advertising.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud's jurisdiction (FAIS Act, Sec 27(3)) is limited to financial loss or prejudice suffered as a result of a *contravention of the FAIS Act*. Failing to conduct a needs analysis and giving unsuitable advice is a direct breach of the General Code of Conduct, and therefore falls within the Ombud's jurisdiction. Poor market performance (B) does not.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 138,
    "questionText": "A complaint received by the FSP must be logged in the FSP's **complaints register**. This register is a critical part of the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing strategy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Record Keeping and Compliance monitoring.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product pricing structure.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Staff salary payments.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16(1)) requires an FSP to have an internal complaints procedure, which includes maintaining a 'complaints register'. This register is a key record-keeping document used for compliance monitoring, reporting, and identifying systemic issues.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 139,
    "questionText": "What information must the FSP provide to a client regarding the Ombud when the client submits an initial internal complaint?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A guarantee that the Ombud will rule in the client's favour.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The contact details of the FAIS Ombud.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Ombud's personal cell phone number.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A prediction of the Ombud's decision.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct and Ombud Rules (Rule 6) require the FSP's internal complaints procedure to be transparent. The FSP must inform the client of their right to escalate the complaint and must provide the name, address, and contact details of the FAIS Ombud.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 140,
    "questionText": "The FAIS Ombud can try to resolve a dispute through mediation or conciliation. This approach is intended to achieve:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A legal precedent.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The longest possible investigation time.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A voluntary and amicable settlement between the parties.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The highest possible fine.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 3(b)) state the Ombud may use 'conciliation or mediation' to resolve a complaint. The goal of these alternative dispute resolution methods is to help the parties (client and FSP) reach a mutually agreeable settlement voluntarily, without the need for a formal, binding determination.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 141,
    "questionText": "The KI must ensure the FSP maintains the required Financial Soundness. This is particularly important for FSPs that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only operate online.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Hold client funds or have high exposure to risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Do not charge a fee.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only deal with one client.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight (Sec 17(1)) of Financial Soundness is critical. The requirements (e.g., capital adequacy) are more stringent for FSPs that hold client funds or assets (like a Category II or III FSP) because the risk of client loss due to FSP insolvency is much higher.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 142,
    "questionText": "The KI must ensure that the FSP's internal systems and records are retained for the minimum 5-year period. This is an element of the KI's duty concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Management Oversight of Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tipping-Off Prohibition.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product Knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "Record keeping (FAIS Act, Sec 18) is a core component of 'Operational Ability'. The KI, through their duty of management oversight (Sec 17(1)), is ultimately responsible for ensuring the FSP's 'Operational Ability' (including its record-keeping systems) is compliant.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 143,
    "questionText": "The KI is responsible for ensuring that all new Representatives on the FSP register meet the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "KI's personal dress code.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Target of 10 new clients in the first month.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Fit and Proper requirements *before* rendering any financial service.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Requirements of the National Credit Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight role includes managing the representative register. The Fit & Proper Requirements (Sec 20) state that a person may only be appointed as a representative if they meet the Fit and Proper requirements (Honesty, Competence, etc.) *prior* to rendering services.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 144,
    "questionText": "The KI is the designated individual primarily responsible for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier's license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's personal investment performance.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The compliance of the FSP with the conditions of its license.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's advertising costs.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's core duty, as defined by their role (FAIS Act, Sec 17(1)), is the management and oversight of the FSP's compliance. They are the person accountable to the regulator (FSCA) for ensuring the FSP adheres to the FAIS Act and the conditions of its specific license.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 145,
    "questionText": "A KI must undertake Continuous Professional Development (CPD) to ensure they maintain their:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Debt-free status.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence and knowledge of updated legislation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing skills.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Negotiation tactics.",
        "isCorrect": false
      }
    ],
    "explanation": "Just like representatives, Key Individuals must also adhere to the Fit and Proper requirement for 'Competence' (FAIS Act, Sec 8(1)(b)). This includes an ongoing duty to complete CPD hours to maintain their knowledge of the regulatory and financial landscape they are responsible for overseeing.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 147,
    "questionText": "The FSP must ensure that the Representative only renders financial services for products that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Are developed by the FSP itself.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Offer guaranteed high returns.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Are defined as 'Financial Products' under the FAIS Act and are included in the FSP's license.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Are advertised on television.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP and its representatives can *only* render services for products that are 1) defined as 'Financial Products' in Sec 1 of the FAIS Act, and 2) included in the specific license categories issued to the FSP by the FSCA. Acting outside this license is a major violation.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 148,
    "questionText": "Which risk is associated with an investment that is heavily focused on a single asset class or geographical region?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Reputation Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Concentration Risk.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Compliance Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Concentration Risk' is the risk of loss because funds are concentrated in one investment, asset class, or region. If that one area performs poorly, the entire investment suffers. Diversification is the strategy used to mitigate concentration risk, and a representative must consider this as part of a suitability analysis (Code of Conduct, Sec 3(2)).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 149,
    "questionText": "A Collective Investment Scheme (CIS) is a financial product where:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The returns are guaranteed by the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The investor has direct control over the underlying assets.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A group of investors pool their money for collective investment by a portfolio manager.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The investment can only be withdrawn after 20 years.",
        "isCorrect": false
      }
    ],
    "explanation": "A Collective Investment Scheme (CIS), such as a unit trust, is defined (FAIS Act, Sec 1) as a scheme where investors pool their money, and a professional portfolio manager collectively invests that pool on their behalf in various assets (like stocks and bonds).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 150,
    "questionText": "The Code of Conduct requires a Representative to inform the client of any material changes to the information previously provided about the product. This duty is related to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "FIC Act reporting.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Record-keeping period.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Ongoing disclosure requirements.",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) requires disclosures to be factual, clear, and not misleading. This is not just a once-off duty. If material information about a product changes (e.g., a fee increase or change in risk), the representative has an ongoing duty to disclose this to the client.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 151,
    "questionText": "Mr. Sizwe, a Key Individual, is planning to appoint a new representative whose mandate is restricted to *only* rendering 'intermediary services' for Tier 1 products. What is the RE5 requirement for this representative?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "They must write the RE1 within one year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "They are exempt from writing the RE5 examination.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "They must write the RE5 within two years.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "They must be under supervision for 5 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) for the RE5 exam are linked to the *service* rendered, not just the product. The RE5 is for representatives who give 'advice'. A person appointed *only* for 'intermediary services' (like execution of sales or processing) is exempt from the RE5.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 152,
    "questionText": "A licensed FSP must maintain adequate administrative procedures, systems, and internal controls to manage its business. This requirement is fundamental to maintaining which Fit and Proper pillar?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(d)) defines 'Operational Ability' as having the necessary systems, procedures, and internal controls to effectively and compliantly manage the financial services business. This includes everything from IT systems to compliance monitoring.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 153,
    "questionText": "Which activity is explicitly excluded from the definition of a 'financial service' under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Advising a client to renew a policy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Executing a mandate on behalf of a client.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Providing advice on shares and securities.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "General recommendations on investment strategy published in a newspaper.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) explicitly excludes recommendations or guidance published to the public via mass media (like a newspaper) from the definition of 'advice', as long as it is not tailored to an individual client's situation.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 154,
    "questionText": "A representative resigns from an FSP. To ensure compliance, the FSP must update its Representative Register. This is a duty required to be performed:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Within 30 days of the resignation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately upon the representative ceasing to act for the FSP.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only at the end of the financial year.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only if the representative was debarred.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's representative register (FAIS Act, Sec 13) is a live document that must be accurate at all times. When a representative ceases to act for the FSP (whether by resignation or debarment), the FSP must update the register and notify the FSCA 'immediately' (or within 15 days, but 'immediately' is the principle).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 155,
    "questionText": "An FSP provides a financial service classified as an **intermediary service**. This service involves:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Issuing a new financial product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Managing a discretionary investment mandate.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Submitting a client's application for a financial product.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Guaranteeing a specific return on an investment.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'Intermediary Service' as any act *other than advice* that results in a client entering into, varying, or actioning a financial product. This includes submitting an application, processing a claim, or executing an instruction on behalf of a client.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 156,
    "questionText": "A Representative is permanently removed from the FSP's register due to failure to meet the Fit and Proper requirements. What is the immediate consequence in terms of the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The person may continue to render intermediary services only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must pay a fine to the FSCA.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The person is immediately prohibited from rendering financial services.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The representative must re-apply to the FSCA within six months.",
        "isCorrect": false
      }
    ],
    "explanation": "Debarment (FAIS Act, Sec 14) is the formal removal from the register. The consequence of debarment is that the person is immediately prohibited from rendering any financial services (both advice and intermediary services) on behalf of any FSP until they are formally re-appointed.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 157,
    "questionText": "Which regulatory body is primarily responsible for the **market conduct** of Financial Services Providers (FSPs) under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The South African Reserve Bank (SARB).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Financial Intelligence Centre (FIC).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Financial Sector Conduct Authority (FSCA).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The National Treasury.",
        "isCorrect": false
      }
    ],
    "explanation": "The Financial Sector Conduct Authority (FSCA) is the regulator responsible for market conduct in the financial sector. Its mandate includes licensing FSPs, enforcing the FAIS Act, and protecting clients from unfair treatment.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 158,
    "questionText": "The FSP is audited and found to have a representative providing advice on complex Category III products without the requisite experience. This is a failure of the FSP to ensure its representative meets the **Fit and Proper** requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 13(1)) requires an FSP to ensure its representatives are 'Fit and Proper'. This includes 'Competence', which is defined as having the necessary qualifications, regulatory exams, AND experience for the *specific categories* of products they advise on. Advising without experience is a competence failure.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 159,
    "questionText": "A Representative is found to have a history of regularly defaulting on personal debt obligations, although no fraud was involved. This situation mainly impacts the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) mandate that representatives must be 'Financially Sound'. A history of defaulting on debts demonstrates an inability to manage one's own financial affairs and obligations, which is a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 160,
    "questionText": "A Representative fails to complete the minimum required Continuous Professional Development (CPD) hours for the current cycle. What is the most likely consequence for the Representative's status?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Automatic debarment by the FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A suspension of their ability to render services until the CPD is completed.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A fine equal to the cost of the missed training.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "An extension of the deadline by 12 months.",
        "isCorrect": false
      }
    ],
    "explanation": "Failure to meet CPD requirements (Fit & Proper, Sec 29) means the representative no longer meets the ongoing 'Competence' requirement. The FSP must suspend the representative from rendering financial services until they have rectified the CPD shortfall.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 161,
    "questionText": "An FSP must maintain effective internal controls to protect client information against unauthorised access. This duty is specifically part of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "Protecting client data is a key internal control related to IT and data security. This falls under the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)), which covers all systems, processes, and controls needed to run the business securely and compliantly.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 162,
    "questionText": "A representative who passes the RE5 examination has demonstrated compliance with which component of the Competence requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Qualification.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Experience.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Regulatory Knowledge.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Competence' requirement (Fit & Proper, Sec 20) is made up of three parts: 1) a formal Qualification, 2) practical Experience, and 3) knowledge of the legislation, which is demonstrated by passing the Regulatory Examinations (REs).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 163,
    "questionText": "Which action is an FSP mandated to take if a Representative on its register has been debarred by the FSCA for incompetence?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Wait 90 days before taking any action.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately remove the Representative from its FSP register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Transfer the Representative to an administrative role.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Report the debarment to the Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP has a duty (FAIS Act, Sec 13(2)) to ensure its register is accurate and that all representatives on it are Fit and Proper. If the FSCA debars a representative, they are no longer Fit and Proper, and the FSP *must* remove them from its register immediately.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 164,
    "questionText": "A Representative is employed by an FSP. This Representative must submit an annual declaration to their Key Individual regarding their ongoing compliance with which Fit and Proper requirements?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Operational Ability and CPD.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity and Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product Knowledge and Experience.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP license renewal status.",
        "isCorrect": false
      }
    ],
    "explanation": "As part of the ongoing Fit and Proper requirements (FAIS Act, Sec 8(1)(a)), representatives must annually declare to their FSP (via the KI) that they continue to meet the requirements for 'Honesty and Integrity' and 'Financial Soundness' (e.g., they have not been convicted of fraud or declared insolvent).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 165,
    "questionText": "The FSP's Financial Soundness requirements are designed to ensure that the FSP:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Is never audited.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Sells only high-return products.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Can meet its financial obligations and liabilities.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only works with financially sound clients.",
        "isCorrect": false
      }
    ],
    "explanation": "The purpose of the 'Financial Soundness' requirements (Fit & Proper, Sec 4) is to protect clients and the market. It ensures the FSP has sufficient capital and liquidity to remain a 'going concern' and meet all its financial obligations (like paying debts and claims) as they fall due.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 166,
    "questionText": "If an FSP fails to have a proper system for supervising its Representatives, which Fit and Proper pillar is primarily threatened?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Supervision is a key internal control and governance process. The FAIS Act (Sec 8(1)(d)) places the responsibility for having adequate supervision systems squarely under the 'Operational Ability' requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 167,
    "questionText": "The Code of Conduct mandates that all actual and potential **Conflicts of Interest** must be disclosed to the client. When must this disclosure be made?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only after the transaction is complete.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "At the earliest opportunity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only if the client specifically asks.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only in the annual compliance report.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(c)) requires disclosure of conflicts of interest to be timely so the client can make an informed decision. This means disclosure must happen 'at the earliest reasonable opportunity' *before* the advice is given or the service is rendered.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 168,
    "questionText": "A Representative provides advice but fails to complete a written record detailing the needs analysis conducted with the client. Which requirement of the Code of Conduct is primarily breached?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Conflict of Interest management.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "General Disclosure requirements.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Record Keeping requirements for advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Financial Soundness requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7 and Sec 9) is clear that when advice is given, a 'Record of Advice' must be created. This record *must* include the basis for the recommendation, which is the needs analysis. Failing to record the needs analysis is a direct breach of the record-keeping requirements.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 169,
    "questionText": "The Code of Conduct requires a Representative to act with **due care, skill, and diligence**. This applies primarily to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal tax affairs.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The rendering of the financial service to the client.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's annual audit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative's social media posts.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a foundational principle of the General Code of Conduct (Sec 2, reinforced in Sec 7). It is the overarching professional standard that applies to all aspects of the financial service being rendered, from the initial contact and needs analysis to the final advice and disclosure.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 170,
    "questionText": "A Representative receives a cash incentive from a Product Supplier for exceeding a sales target, which the FSP has not properly managed through its Conflict of Interest policy. The Code of Conduct aims to ensure the Representative avoids accepting:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A salary from the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Secret or undisclosed commissions or gifts that could compromise their objectivity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A cup of coffee from a client.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A written contract of employment.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3 and Sec 4) is designed to ensure transparency and that client interests are protected. Secret or undisclosed incentives create a conflict of interest because they may (or may appear to) influence the representative to sell a product for their own gain, not the client's benefit.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 171,
    "questionText": "The principle that client interests must be prioritised over the FSP's or Representative's interests, particularly in a conflict, is fundamental to the Code of Conduct's rules on:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Intermediary Service classification.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Ethical Conduct.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD hours.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3) sets the standard for ethical conduct. A core tenet of this is that the FSP and representative must act in the client's best interest. Prioritizing the client's interests, especially when they conflict with the representative's own, is the cornerstone of this ethical duty.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 172,
    "questionText": "A client refuses to disclose their current income details, making a full needs analysis impossible. The Representative chooses to proceed with a simple investment recommendation. What must the Representative record and disclose to the client?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client has waived all rights to complain.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The advice is based on limited information, and its appropriateness may be compromised.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Representative assumes the client is high-net-worth.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP will cover any loss the client incurs.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(3)) provides a specific procedure for this scenario. The representative must clearly inform the client that the lack of information limits the scope of the needs analysis and that, as a result, the advice may not be appropriate. This must be recorded.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 173,
    "questionText": "An FSP stores all records electronically. If these records are accessed by a compliance officer, the FSP must ensure that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client is charged an access fee.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The access is auditable, secure, and adheres to privacy legislation (POPIA).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's CEO is present during the access.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The records are destroyed immediately after being reviewed.",
        "isCorrect": false
      }
    ],
    "explanation": "Electronic record keeping (FAIS Act, Sec 18) is permitted, but the FSP's 'Operational Ability' must ensure the system is secure. This includes having an audit trail to see who accessed or changed records, and ensuring all access complies with data privacy laws like the Protection of Personal Information Act (POPIA).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 174,
    "questionText": "The purpose of the FAIS Act's minimum **5-year record-keeping** requirement is primarily to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Allow the FSP to contact clients for marketing purposes.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Help the FSP calculate their quarterly profits.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Provide a regulatory audit trail to verify compliance and investigate complaints.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Allow the Representative to recall product codes easily.",
        "isCorrect": false
      }
    ],
    "explanation": "The 5-year rule (Code of Conduct, Sec 3(4) and FAIS Act, Sec 18) exists to protect clients and ensure regulatory oversight. It provides a historical audit trail so that if a client complains (even years later) or the FSCA investigates, a record exists to prove what advice was given and whether the FSP was compliant.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 175,
    "questionText": "An FSP must keep a record of the mandates given by clients, particularly for Category II FSPs (discretionary management). What is the minimum retention period for these records?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Until the mandate is revoked.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years from the date the service is terminated.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "A client mandate is a record of a financial service. Like all other records of advice, services, and transactions, the General Code of Conduct (Sec 3(4)) requires client mandates to be kept for a minimum of 5 years from the date the service was rendered or terminated.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 176,
    "questionText": "An FSP must maintain a register of all its Representatives. This register must contain, among other details, the category of financial service that the Representative is authorised to render. This ensures regulatory oversight of the Representative's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Insurance policy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Mandate and scope of service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Physical address.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Annual sales target.",
        "isCorrect": false
      }
    ],
    "explanation": "The Representative Register (FAIS Act, Sec 13(3)) is a critical compliance document. It must specify the exact mandate (scope of service) for each representative, including the product categories and subcategories they are competent and authorized to render.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 177,
    "questionText": "The record-keeping system must be able to distinguish between advice provided by different Representatives within the FSP and also distinguish it from advice from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Female and male Representatives.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Product Suppliers.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Key Individuals.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Part-time and full-time Representatives.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's records (FAIS Act, Sec 18) must be a clear and accurate account of the services *it* has rendered. It must be able to distinguish its own advice from any information or communication provided directly by the Product Supplier to the client, to ensure clear accountability.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 178,
    "questionText": "An FSP is unable to complete the required Customer Due Diligence (CDD) requirements for a new client due to the client's non-cooperation. What is the FSP's required action under the FIC Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Proceed with the transaction but file a report after 30 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "File an internal report and assume the client is low risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Not establish the business relationship and consider filing an STR.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Ask the Key Individual to waive the CDD requirement.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21) is strict: if an FSP cannot conduct the required CDD (identify and verify the client), it *must not* establish the business relationship or conclude the transaction. The failure or refusal of the client to provide CDD information is, in itself, suspicious and warrants consideration of filing a Suspicious Transaction Report (STR).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 179,
    "questionText": "Under the FIC Act, what does **Money Laundering** fundamentally refer to?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The process of investing money for high returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The process designed to conceal the origin of illegally obtained money.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The process of decreasing the client's tax burden.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The process of speeding up financial transactions.",
        "isCorrect": false
      }
    ],
    "explanation": "Money laundering is the process of making 'dirty money' (proceeds of crime) appear 'clean'. It is any act designed to conceal or disguise the true origin, location, or ownership of money obtained through illegal activities.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 180,
    "questionText": "If the FIC identifies an FSP as being non-compliant with the FIC Act, what is the FIC's potential enforcement action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The immediate suspension of the FSP's FSR Act license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The immediate withdrawal of the FSP's FAIS license.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The imposition of administrative sanctions (e.g., penalties and fines).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A mandatory review of the FSP's marketing brochure.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) grants the FIC its own enforcement powers, distinct from the FSCA. For non-compliance, the FIC can impose 'Administrative Sanctions', which include reprimands, directives to take corrective action, and significant monetary penalties (fines).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 181,
    "questionText": "A key component of the Risk Management and Compliance Programme (RMCP) is staff training. The primary purpose of this training is to equip staff to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Achieve higher sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Identify and report suspicious activities and money laundering typologies.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Improve their personal financial literacy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Recruit new employees.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) requires FSPs to train their employees on the FIC Act's provisions and their RMCP's internal controls. The primary goal of this training is to ensure all staff, especially client-facing ones, can identify red flags, typologies, and suspicious activities, and know how to report them.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 182,
    "questionText": "The FIC Act mandates that all records relating to client identification and transaction history must be retained for a minimum period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years from the date the relationship is terminated.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years from the date of the transaction.",
        "isCorrect": false
      }
    ],
    "explanation": "Similar to the FAIS Act, the FIC Act (Sec 21) mandates a minimum record-keeping period. All records obtained through the Customer Due Diligence (CDD) process and records of all transactions must be kept for at least 5 years from the date the business relationship is terminated.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 183,
    "questionText": "A Representative is unsure if a client's transaction is suspicious, but they have a persistent doubt. The FIC Act requires them to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ask the client directly why they are making the transaction.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only report if they are 100% certain that a crime has been committed.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "File an STR immediately, as suspicion is sufficient grounds for reporting.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Wait until the end of the month to see if other suspicious transactions occur.",
        "isCorrect": false
      }
    ],
    "explanation": "The threshold for reporting under the FIC Act (Sec 29) is 'suspicion'. A representative does not need proof or certainty. If they have a reasonable suspicion, doubt, or feel uneasy about a transaction, they have a legal obligation to file an STR immediately.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 184,
    "questionText": "The individual within the FSP who is ultimately responsible for ensuring the RMCP is adhered to and that FIC Act compliance is managed is the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's receptionist.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The newest Representative.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Key Individual and Senior Management/Board.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's cleaning staff.",
        "isCorrect": false
      }
    ],
    "explanation": "FIC Act compliance is a governance-level responsibility. The Act (Sec 42A) places the ultimate accountability for the RMCP and the FSP's compliance with the Act on its Senior Management or Board of Directors. In a FAIS context, this duty is overseen by the Key Individual.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 185,
    "questionText": "The FAIS Ombud's resolution process is designed to be **informal**. This means that the process is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Subject to the strict evidentiary and procedural rules of a court of law.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only for small claims.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Not subject to the strict evidentiary and procedural rules of a court of law.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Always resolved through mediation.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 3(b)) state the process is 'informal'. This means it is not a court. The Ombud is not bound by the complex and strict rules of evidence and procedure used in a civil court, allowing for a more flexible and faster resolution based on the facts and principles of fairness.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 186,
    "questionText": "What is the source of the FAIS Ombud's authority and powers to make binding determinations?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's Key Individual.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Financial Advisory and Intermediary Services Act (FAIS Act).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client's attorney.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A United Nations resolution.",
        "isCorrect": false
      }
    ],
    "explanation": "The office of the Ombud for Financial Services Providers (FAIS Ombud) is a statutory body. Its existence, mandate, and powers (including the power to issue binding determinations) are all granted to it directly by the FAIS Act (Sec 27 and Sec 28).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 187,
    "questionText": "Mr. Naidoo submits a complaint to the FAIS Ombud claiming he suffered a loss of R2 million due to poor advice. If the Ombud's monetary limit for compensation is R800,000, what will the Ombud likely do?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Resolve the entire R2 million claim.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Decline jurisdiction as the claim exceeds the limit.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Resolve the claim for R800,000 and ignore the rest.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Advise Mr. Naidoo to abandon the amount in excess of R800,000 if he wishes the Ombud to hear the case.",
        "isCorrect": true
      }
    ],
    "explanation": "The FAIS Act (Sec 27(3)) sets a monetary limit (R800,000). The Ombud cannot hear claims that exceed this value. The Ombud's office will decline jurisdiction (B) *unless* the complainant, Mr. Naidoo, formally agrees in writing to abandon the amount in excess of the limit (D).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 188,
    "questionText": "A Representative is worried about an Ombud complaint regarding their advice. Their role in the process is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Hide all relevant records.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Assist the FSP by providing accurate, complete records and full cooperation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Try to contact the Ombud directly in secret.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Change the client's original application form.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP is legally required to cooperate fully with the Ombud. The Representative, as an employee and the individual involved, has a duty to the FSP (and a regulatory duty) to be honest and cooperative, which includes providing all accurate records (Code of Conduct, Sec 16) to allow the FSP to respond to the Ombud.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 189,
    "questionText": "The FSP's internal complaint resolution procedure must be made available to the client. This procedure must be:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Kept confidential from all clients.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Fair, accessible, and transparent to the client.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only conducted by the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Limited to only 10 minutes per complaint.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16(1)) mandates that an FSP's internal complaints procedure must be transparent, visible, and accessible to clients. It must be a fair process that does not impose unreasonable barriers on clients wishing to complain.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 190,
    "questionText": "The FAIS Ombud is designed to resolve disputes between clients and FSPs. If the Ombud issues a Final Determination, who is legally bound by the decision?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only the client.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "All parties to the complaint (e.g., the FSP and the Representative).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination by the Ombud (FAIS Act, Sec 28(5)) is binding on *all parties* to the complaint. This includes the complainant (client) and the respondents (the FSP and, if named, the Representative).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 191,
    "questionText": "A Key Individual (KI) delegates the day-to-day supervision of a Representative to an experienced non-KI senior manager. Which statement is correct regarding the KI's ultimate responsibility?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The KI has successfully transferred all liability to the senior manager.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The KI remains ultimately responsible for the delegated functions and the FSP's compliance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The KI is only responsible if the senior manager is also a Representative.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSCA must approve the delegation within 7 days.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's role (FAIS Act, Sec 17(1)) is one of ultimate accountability. While a KI can *delegate* tasks (like supervision), they cannot *delegate* their legal responsibility. The KI remains accountable to the FSCA for ensuring the delegated supervision is performed correctly.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 192,
    "questionText": "The KI must meet the **Competence** requirements for the categories of financial services for which they are appointed. This means the KI must have:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A large personal investment portfolio.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Their own personal FSP license.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The necessary qualifications, experience, and passed the relevant regulatory exams (e.g., RE1).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A minimum of two passports.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper requirements for 'Competence' apply to KIs just as they do to representatives (though the specifics differ). A KI must have a relevant qualification, the required management experience, and must pass the RE1 regulatory exam for KIs.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 193,
    "questionText": "The KI is responsible for ensuring the FSP's **Conflict of Interest Management Policy** is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Kept in a secure vault.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Effectively implemented, monitored, and reviewed regularly.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only reviewed every 10 years.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Written in a foreign language.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (Sec 17(1)) includes ensuring all compliance policies are not just written, but are *effective*. This means the KI must ensure the Conflict of Interest policy is actively implemented, monitored for breaches, and reviewed regularly (at least annually) to ensure it remains relevant.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 194,
    "questionText": "If the KI fails to meet the Fit and Proper requirements, who is responsible for informing the FSCA and taking action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's administrative staff.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The KI themselves and the FSP.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The nearest Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative who has been in the job the longest.",
        "isCorrect": false
      }
    ],
    "explanation": "Both the FSP and the KI as an individual have a duty to inform the FSCA (FAIS Act, Sec 19) of any material change in their circumstances, especially one that impacts their Fit and Proper status. The FSP, upon learning its KI is non-compliant, must take action (e.g., replace the KI).",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 195,
    "questionText": "The KI must ensure the FSP has an adequate system for resolving client complaints. This is a requirement related to the KI's duty concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product design.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "FIC Act reporting.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability and client protection.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD hours.",
        "isCorrect": false
      }
    ],
    "explanation": "The internal complaints procedure is a key internal control system. The KI's oversight (Sec 17(1)) of the FSP's 'Operational Ability' includes ensuring this system is in place, effective, and fair to clients, as required by the Code of Conduct.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 196,
    "questionText": "A financial product is legally defined as a **Tier 2** product if it is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Managed on a discretionary basis.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A simpler, less complex product with lower risk to the client.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "An investment in a high-risk derivative contract.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Sold only to institutional investors.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) product categories are split into two tiers based on complexity and risk. Tier 2 products (like funeral policies, simple health benefits) are those deemed to be simpler, less complex, and carry a lower risk to the client. Tier 1 products are all others (e.g., investments, derivatives).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 197,
    "questionText": "The FSP's license will specify the **sub-categories** of financial products the FSP can advise on. This is to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP is not too large.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP is not subject to the FIC Act.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP only provides services for products where it meets the Fit and Proper requirements.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP has only one Key Individual.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP's license is not a blanket approval. It specifies the exact product categories and sub-categories the FSP is authorized for. This (FAIS Act, Sec 13) ensures that the FSP has the necessary 'Competence' (knowledge, experience) and 'Operational Ability' to handle those specific products.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 198,
    "questionText": "A derivative is a financial product whose value is *derived* from an underlying asset. Providing advice on derivatives generally requires a high level of expertise and is classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A service that is exempt from the FAIS Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A simple intermediary service.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A Tier 2 product.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A complex financial service requiring high competence (Tier 1).",
        "isCorrect": true
      }
    ],
    "explanation": "Derivatives are considered highly complex and high-risk financial products. They are classified as 'Tier 1' products, and advising on them requires a high level of specialist competence (Code of Conduct, Sec 3(2)) and the appropriate RE exams.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 199,
    "questionText": "The entity that **issues or offers** the actual financial product (e.g., insurance company, asset manager) that the FSP advises on is referred to as the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Product Supplier.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "External Auditor.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines the 'Product Supplier' as the entity that actually issues the financial product by contract. The FSP (the advisor) is the intermediary between the client and the Product Supplier.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 200,
    "questionText": "In terms of disclosure, a Representative must clearly explain the product's costs, risks, and exclusions. This duty is required to ensure the client has sufficient information to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Determine the FSP's profit margin.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Calculate the commission paid to the Representative.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Make an informed financial decision.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Write a complaint to the Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The entire purpose of the disclosure requirements in the General Code of Conduct (Sec 4(1)) is to ensure transparency. By disclosing all material information (costs, risks, features, exclusions), the representative empowers the client to make a truly informed decision about whether to purchase the product.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 201,
    "questionText": "Which of the following are defined as 'Financial Products' in terms of the FAIS Act?\n\ni. A unit trust (Collective Investment Scheme).\nii. A long-term insurance policy.\niii. A personal loan from a non-bank entity.\niv. A physical motor vehicle.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "i, ii and iii only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) provides a specific list of financial products. This list includes unit trusts (Collective Investment Schemes) (i) and long-term insurance policies (ii). Personal loans (iii) are generally regulated under the NCA, and physical goods like a motor vehicle (iv) are not financial products.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 202,
    "questionText": "'First Advice (Pty) Ltd' suspects a representative, Ms. Pillay, of gross negligence and *immediately* suspends her pending a full internal investigation. What is the mandatory regulatory action the FSP must take in terms of the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Complete the internal investigation before notifying anyone.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Notify the FSCA immediately and provide reasons for the suspension.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Inform the FAIS Ombud of the potential complaint.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Remove Ms. Pillay from the Representative register immediately.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) requires an FSP to *immediately* notify the FSCA (the Authority) if it suspends a representative. The FSP must also provide the reasons for the suspension. This ensures the regulator is aware of potential misconduct right away, even before an investigation is complete. Debarment (D) only follows after a fair process confirms the non-compliance.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 203,
    "questionText": "Which ONE of the following persons is likely EXEMPT from the FAIS Act and does NOT need to be a licensed FSP?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An independent broker who provides advice on short-term insurance for a commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An employee of a bank (a product supplier) who provides factual information *only* on the bank's own products.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A person who manages a client's investments on a discretionary basis (Category II).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A representative who provides advice on retirement annuities.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides exemptions. A Product Supplier (like a bank) and its employees are generally exempt from the FAIS Act *only* when providing factual information or advice on their *own* products. A, C, and D are all activities that clearly require licensing under FAIS.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 204,
    "questionText": "An FSP's license requires it to meet specific **capital adequacy** requirements as part of Financial Soundness. Which regulatory body is responsible for monitoring and enforcing this requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The South African Revenue Service (SARS).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Financial Intelligence Centre (FIC).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Financial Sector Conduct Authority (FSCA).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSCA is the regulator responsible for issuing FSP licenses and enforcing the FAIS Act, including all Fit and Proper requirements. 'Financial Soundness' (which includes capital adequacy) is a core requirement (Sec 8) that the FSCA monitors and enforces.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 205,
    "questionText": "A Representative provides a client with a recommendation to increase their monthly contributions to an existing retirement annuity. This action constitutes:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An intermediary service only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A factual disclosure.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product administration.",
        "isCorrect": false
      }
    ],
    "explanation": "According to the FAIS Act (Sec 1, Definitions), 'advice' includes any recommendation, guidance, or proposal of a financial nature furnished to a client. Recommending an *action* (to increase contributions) regarding a financial product fits this definition.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 206,
    "questionText": "Thabo was appointed as a Representative on 1 September 2024 to advise on Tier 1 products. He fails to pass the RE5 examination by 31 August 2026. What is the mandatory regulatory consequence?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "He is automatically transferred to a Tier 2 product role.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "He can continue rendering services as long as he is under supervision.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "He must be immediately debarred and removed from the Representative register.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP must apply to the FSCA for a 6-month extension.",
        "isCorrect": false
      }
    ],
    "explanation": "The 24-month (two-year) deadline from the date of first appointment is final. Failure to pass the RE5 by this date means the representative is no longer competent. The FSP *must* immediately debar them and remove them from the register. No extensions are automatic, and supervision cannot continue.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 207,
    "questionText": "The overarching goal of the FAIS Act is to regulate the provision of financial advice and intermediary services. Which of the following are primary objectives of the Act?\n\ni. Protect clients and ensure they are treated fairly.\nii. Professionalise the financial services industry.\niii. Ensure all financial products provide a guaranteed return.\niv. Regulate the prudential soundness of banks.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "i, ii and iv only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The preamble and definitions of the FAIS Act make it clear that its primary purpose is market conduct. This includes protecting clients (i) and professionalizing the industry through standards like Fit and Proper (ii). It does not guarantee returns (iii) or regulate the prudential soundness of banks (iv - that is the role of the Prudential Authority).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 208,
    "questionText": "If a person is **only** responsible for the execution of sales relating to Tier 1 financial products, under the RE5 mandate, they are:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Required to write the RE5 within two years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Required to be under supervision for 5 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Not required to write the RE5 examination.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Required to be approved by the FSCA every year.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 examination is a competence requirement for representatives who provide 'advice'. A person who *only* performs 'execution of sales' (an intermediary service) and does not provide any advice is exempt from the RE5 requirement, regardless of whether the product is Tier 1 or Tier 2.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 209,
    "questionText": "Ms. Naidoo, a Representative, failed to disclose a previous debarment by a former FSP during her current appointment. Which Fit and Proper requirement is primarily compromised?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) mandate 'Honesty and Integrity'. A previous debarment is a material fact. Deliberately concealing this fact during an appointment process is an act of dishonesty and a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 210,
    "questionText": "The FSP must have robust procedures for the regular assessment of its risk exposure, including compliance risks, market risks, and operational risks. This is a requirement related to the maintenance of its:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "Risk management is a core function of 'Operational Ability' (FAIS Act, Sec 8(1)(d)). An FSP must have the operational systems and procedures in place to identify, assess, monitor, and mitigate all risks associated with its business, including compliance, legal, and operational risks.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 211,
    "questionText": "Mr. Khumalo was appointed 3 years ago and is still working under supervision for a Category I product. Which ONE of the following statements is correct regarding his situation?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "He must be debarred immediately as the 2-year deadline for RE5 has passed.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "He can continue under supervision indefinitely as long as his KI signs off.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "He must be debarred immediately as the 3-year supervision limit has been exceeded.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "He can continue under supervision, but must achieve competence before the 5-year maximum period expires.",
        "isCorrect": true
      }
    ],
    "explanation": "The maximum period for supervision is 60 months (5 years). The 2-year deadline is for the RE5 exam (which we assume he passed). Since he is only 3 years in, he has 2 years left to gain the required experience. If he fails to do so by the 5-year mark, he must be debarred.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 212,
    "questionText": "What is the primary purpose of the FSP being required to have adequate **Professional Indemnity (PI) Insurance**?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To cover the FSP's annual operating costs.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To ensure the FSP can compensate clients for negligence or errors in advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "To pay the salary of the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "To satisfy the FIC Act's reporting requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "PI Insurance is a key component of 'Operational Ability' (FAIS Act, Sec 8(1)(d)). Its sole purpose is to protect clients. It ensures that if a client suffers a financial loss due to the FSP's negligence, error, or omission, there is a dedicated insurance fund to pay that client's claim.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 213,
    "questionText": "Ms. Govender, a Representative, failed to attain the minimum required CPD hours for the current cycle. This failure directly impacts which component of the Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (Ongoing knowledge).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Management Oversight.",
        "isCorrect": false
      }
    ],
    "explanation": "Continuous Professional Development (CPD) (Fit & Proper, Sec 29) is the requirement for maintaining 'Competence' *after* initial qualification. Failing to complete CPD hours means the representative no longer meets the ongoing competence requirement and is not Fit and Proper.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 214,
    "questionText": "The requirement for FSP staff to be of 'good standing' means they must maintain compliance with which of the following requirements?\n\ni. Honesty\nii. Integrity\niii. Financial Soundness\niv. Operational Ability",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii and iv",
        "isCorrect": false
      }
    ],
    "explanation": "'Good standing' (FAIS Act, Sec 8(1)(a)) is a general term that encompasses the personal character attributes of a representative. It primarily refers to their adherence to the requirements of 'Honesty' (i), 'Integrity' (ii), and 'Financial Soundness' (iii). 'Operational Ability' (iv) refers to the FSP's systems and processes, not an individual's character.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 215,
    "questionText": "If the FSP decides to debar a Representative, the FSP must inform the FSCA and update the register. If the FSP fails to do so, what is the regulatory consequence?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The debarment is still effective but the FSP must pay a fine.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative remains legally authorised to render financial services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's Key Individual is immediately suspended.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FAIS Ombud automatically takes over the FSP's management.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSCA maintains the central register of all authorized representatives. A debarment is only legally effective once the FSCA has been notified and the register is updated (FAIS Act, Sec 14). If the FSP fails to notify the FSCA, the representative, in the eyes of the regulator, remains authorized.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 216,
    "questionText": "Mr. Venter, a Representative, is found to be facing criminal charges related to theft. This situation immediately calls into question his compliance with which Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper requirements (Sec 7) explicitly list offences involving 'theft' and 'dishonesty' as qualifier events. Being charged with such a crime, let alone convicted, directly compromises the representative's ability to meet the 'Honesty and Integrity' standard.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 217,
    "questionText": "Ms. Pule, a Representative, advises a client to switch from Product A to Product B. Both products are suitable, but Product B pays Ms. Pule a 50% higher commission. She justifies the switch based on minor feature differences. This is a clear breach of which principle?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping adherence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure of product features.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Prioritising client interests (Conflict of Interest).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Fulfilling CPD requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a classic 'Conflict of Interest' (General Code, Sec 3). The representative is prioritizing her own financial gain (higher commission) over the client's interests. Even if the products are 'equally suitable', the advice is tainted by the conflict. This also relates to replacement advice (Sec 7(2)), which must be in the client's best interest.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 218,
    "questionText": "The Code of Conduct requires a Representative to inform the client of the **risks and limitations** of any recommended financial product. This is a component of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping requirements.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure requirements.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness requirements.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "To make an informed decision, a client must understand both the benefits and the downsides. The General Code of Conduct (Sec 4(1)) mandates that 'Disclosure' must include all material information, which specifically includes the risks, limitations, and potential disadvantages of a product.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 219,
    "questionText": "To ensure a recommendation meets the **suitability** requirement, the Representative must base the advice primarily on:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier's rating.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's financial situation, needs, and objectives.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Representative's personal experience with the product.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The amount of commission earned by the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The concept of 'suitability' (General Code, Sec 7 & 8) is central to the FAIS Act. Advice can only be suitable if it is based on a thorough needs analysis that identifies the client's specific financial situation, their product experience, their needs, and their long-term objectives.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 220,
    "questionText": "A key regulatory principle underpinning the Code of Conduct, now formalized under the Conduct Standards, is **Treating Customers Fairly (TCF)**. The core objective of TCF is to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Clients are never charged fees.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Delivery of fair outcomes to clients.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP achieves maximum profit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The elimination of all financial risk.",
        "isCorrect": false
      }
    ],
    "explanation": "Treating Customers Fairly (TCF) is a regulatory framework (embedded in the Code of Conduct, Sec 3) that moves beyond simple rule-following. It requires FSPs to structure their business and conduct to *deliver* six specific fair outcomes to clients (e.g., suitable advice, clear information, fair treatment).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 221,
    "questionText": "If replacement advice is given, the Representative must clearly disclose the potential for the client to incur a new cost, such as a new **initial fee** or loss of a bonus on the existing product. This is required under the rules for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record keeping.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Replacement advice (Suitability/Disclosure).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Intermediary Services.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(2)) has specific, strict rules for 'replacement' advice. The representative *must* provide a detailed comparison that explicitly discloses all financial implications, including any new initial fees, penalties on the old product, or loss of vested benefits/bonuses.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 222,
    "questionText": "A Representative is discussing a product's past performance with a client. Which ONE of the following statements is correct regarding this disclosure?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative must state that past performance is not a guarantee of future performance.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The Representative may only show the single best-performing year.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Representative is prohibited from ever discussing past performance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative must guarantee that future performance will be similar.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) states that communications must not be misleading. When quoting past performance, it is mandatory to include a clear and prominent warning that past performance is not an indicator or guarantee of future performance (A).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 223,
    "questionText": "For an FSP, the record of advice should be maintained in a format that ensures **accessibility** and can be reproduced in an accurate medium, such as paper or electronic. This requirement is primarily to facilitate:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Client marketing by the Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Auditing and monitoring by the FSCA.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The payment of commission to the Representative.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's social media strategy.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requires records to be 'readily accessible' and reproducible. The primary purpose of this is to allow the regulator (FSCA) and the Ombud to inspect these records quickly and efficiently to conduct audits, monitor compliance, and investigate client complaints.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 224,
    "questionText": "A compliance officer at 'SafeInvest FSP' discovers that records of an advice transaction, completed 3 years ago, are missing from the system and there is no backup. This is a direct breach of the minimum retention period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) and FAIS Act (Sec 18) mandate that all records of advice must be kept for a minimum of 5 years from the date the service was rendered. Losing a record after only 3 years is a clear breach of this requirement.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 225,
    "questionText": "When a Representative records the advice provided, they must ensure the record clearly reflects **why** the product or service recommended is suitable for the client. This is linked to the need for a documented:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Conflict of Interest disclosure.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Product Supplier's annual report.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Needs analysis and reasoning for the recommendation.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Representative's CPD log.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Record of Advice' (Code of Conduct, Sec 3(4)) is the FSP's primary proof of compliance. It must contain the basis for the recommendation, which is the documented needs analysis (client's situation, needs, objectives) and the representative's reasoning for why the chosen product is suitable.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 226,
    "questionText": "The record-keeping period for a single advice transaction (not an ongoing service) begins on the date that the financial service:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client first contacted the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Was rendered to the client.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP submitted its annual compliance report.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative passed their RE5 exam.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) states that the 5-year clock starts from the 'date on which the service was rendered'. For a single transaction, this is the date the advice was given or the transaction was concluded.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 227,
    "questionText": "The Key Individual delegates record-keeping duties to a junior administrator. Which ONE of the following statements is correct regarding the KI's regulatory responsibility?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The KI's responsibility has been successfully transferred to the administrator.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The KI remains ultimately responsible for the adequacy and maintenance of the records.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The KI is responsible only for physical records, not electronic ones.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The KI must review the records once every 5 years.",
        "isCorrect": false
      }
    ],
    "explanation": "A Key Individual can delegate tasks but not their legal accountability. The KI is responsible for the FSP's 'Operational Ability' (which includes record keeping, per Sec 18). Therefore, the KI remains ultimately responsible for ensuring the administrator performs the delegated task correctly and that the FSP's records are compliant.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 228,
    "questionText": "The FSP must ensure that its Risk Management and Compliance Programme (RMCP) is implemented and reviewed. This is the responsibility of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Financial Intelligence Centre (FIC).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Board of Directors and Key Individual of the FSP.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 42A) places the ultimate responsibility for the approval, implementation, and review of the RMCP on the FSP's highest governing body, which is its Board of Directors or Senior Management (overseen by the Key Individual in a FAIS context).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 229,
    "questionText": "Under the FIC Act, what is the primary purpose of identifying and verifying the client's identity (CDD)?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To confirm their employment status.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To check their credit score.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "To prevent identity fraud and ensure the FSP knows its client (KYC).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "To determine the suitability of the financial product.",
        "isCorrect": false
      }
    ],
    "explanation": "Customer Due Diligence (CDD) (FIC Act, Sec 21) is the formal process of 'Know Your Customer' (KYC). Its primary purpose is to allow the FSP to establish with reasonable certainty that its clients are who they claim to be, thereby preventing the use of anonymous or fraudulent identities for money laundering.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 230,
    "questionText": "A Representative notices that a new client has provided documentation that appears to be fraudulent. Which FIC Act report is the Representative obligated to file?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compliance Report (CR).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Suspicious or Unusual Transaction Report (STR).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Property of a Terrorist Report (POTR).",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires an STR for any 'suspicious or unusual' activity. An attempt to open an account or conduct a transaction using fraudulent documentation is a clear red flag for suspicious activity (e.g., identity theft, proceeds of crime) and must be reported via an STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 231,
    "questionText": "An FSP files a STR regarding a client. According to the FIC Act, the FSP must **NOT** communicate the fact that a report has been filed to the client. This is enforced by the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Confidentiality Clause.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "No-Report Rule.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Tipping-Off Prohibition.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Information Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29(3)) contains the 'Tipping-Off Prohibition'. This makes it a criminal offence to disclose to the client (or any unauthorized person) that an STR has been or is going to be filed, as this could compromise the investigation.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 232,
    "questionText": "The FSP establishes a relationship with a high-profile government official who qualifies as a **Politically Exposed Person (PEP)**. The FSP must apply:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence (SDD).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Standard Due Diligence only.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Enhanced Due Diligence (EDD) and obtain senior management approval.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "No Due Diligence.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) classifies PEPs as high-risk due to their potential exposure to corruption. The Act mandates that FSPs must apply 'Enhanced Due Diligence' (EDD) to all PEPs, which includes getting senior management approval and verifying their source of wealth/funds.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 233,
    "questionText": "The FSP's adoption of the **Risk-Based Approach (RBA)** to compliance means that it should allocate its resources to controls in a manner that is proportional to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The volume of transactions.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The money laundering and terrorist financing risk identified.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The number of employees.",
        "isCorrect": false
      }
    ],
    "explanation": "The Risk-Based Approach (RBA) (FIC Act, Sec 42A) requires an FSP to identify and assess its unique ML/TF risks (based on clients, products, geography). The FSP must then design and apply controls that are *proportional* to those specific risks, focusing its resources on the highest risk areas.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 234,
    "questionText": "Which of the following bodies is responsible for imposing administrative sanctions (e.g., fines) on FSPs for failure to comply with FIC Act requirements?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The South African Revenue Service (SARS).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Financial Sector Conduct Authority (FSCA).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Financial Intelligence Centre (FIC).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act is the domain of the Financial Intelligence Centre (FIC). The Act (Sec 45B) empowers the FIC itself (not the FSCA or Ombud) to impose administrative sanctions, including monetary fines, for non-compliance with the FIC Act.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 235,
    "questionText": "Which of the following are requirements for an FSP's internal complaint resolution procedure?\n\ni. It must be transparent and accessible to clients.\nii. It must be reduced to writing.\niii. It must provide for the resolution of complaints in a fair and timely manner.\niv. It must be pre-approved by the FAIS Ombud.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii, and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "ii, iii, and iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16) mandates this procedure. It must be transparent and accessible (i), in writing (ii), and handle complaints fairly and timeously (iii) (e.g., within the 6-week period). It does not need to be pre-approved by the Ombud (iv).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 236,
    "questionText": "What is the key communication requirement for the FSP's final response to a client's internal complaint?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It must be sent via registered mail only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It must be in writing, set out the FSP's final decision and reasons, and advise the client of their right to approach the Ombud.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It must be approved by the FAIS Ombud before sending.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It must include a discount voucher for future services.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 6(b)) and Code of Conduct require the FSP's final decision to be communicated to the client in writing. This response must detail the final decision, provide reasons for it, and inform the client of their right to refer the complaint to the FAIS Ombud.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 237,
    "questionText": "The FAIS Ombud resolves disputes in a manner that is procedurally fair, informal, and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Based strictly on civil court rules.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Time-consuming.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Quick and efficient (expeditious).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Always favouring the client.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(1)) and Ombud Rules (Rule 3) define the Ombud's process. It is designed to be 'informal, fair, and expeditious'. 'Expeditious' means quick and efficient, offering a faster alternative to the courts.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 238,
    "questionText": "Mr. Van Wyk received the FSP's final rejection of his complaint on 1 March. What is the latest date by which he must submit the complaint to the FAIS Ombud?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "30 days from 1 March.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "6 weeks from 1 March.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "6 months from 1 March.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "1 year from 1 March.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Ombud Rules (Rule 7(3)) provide a 6-month prescription period. A complainant has six months from the date of the FSP's final response (or from the expiry of the 6-week FSP response period) to lodge their complaint with the Ombud.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 239,
    "questionText": "If an FSP disagrees with the FAIS Ombud's Final Determination, what is the FSP's regulatory course of action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ignore the determination if the amount is too high.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Appeal the decision to the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Lodge an application for reconsideration with the Financial Services Tribunal.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Submit the determination to the FIC for review.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination by the Ombud (FAIS Act, Sec 28(5)) is legally binding. The *only* formal recourse for an aggrieved party (FSP or client) is to apply for a reconsideration of the decision to the Financial Services Tribunal (FST), as established by the FSR Act.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 240,
    "questionText": "The FSP's internal complaint resolution procedure must inform the client that they have the right to refer the matter to the Ombud if they are dissatisfied with the internal decision or if the FSP has failed to respond within:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "30 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Six weeks.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "90 days.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "2 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 6) establish the 6-week (42-day) period. An FSP has six weeks to resolve an internal complaint. If they fail to do so, or if the client is unhappy with the resolution, the client's right to approach the Ombud is triggered.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 241,
    "questionText": "The Key Individual (KI) must ensure that the FSP’s **Conflict of Interest Management Policy** is effective and followed by all staff. This falls under the KI's duty concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Oversight of Operational Ability and Conduct.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "CPD completion.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product design.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (Sec 17(1)) includes ensuring the FSP's 'Operational Ability' (its internal controls) and its 'Conduct' (adherence to the Code) are compliant. The Conflict of Interest policy is a key control that governs conduct, falling squarely under the KI's oversight.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 242,
    "questionText": "A Key Individual (KI) is appointed for a Category I license. The KI fails to attend any CPD activities for a full year. Which Fit and Proper pillar is immediately compromised?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence (Ongoing knowledge).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI, just like a representative, must meet ongoing Fit and Proper requirements (Sec 17(1)). Failure to complete mandatory CPD hours is a direct breach of the 'Competence' requirement, as they are no longer maintaining their regulatory and product knowledge.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 243,
    "questionText": "The KI must ensure that the FSP maintains the required **Operational Ability**. This means the KI must oversee the adequacy of the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing budget and sales pitch.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "IT systems, security, and staffing structure.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Personal investment portfolio.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product Supplier relationships.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) refers to the FSP's internal infrastructure. The KI is responsible for ensuring this infrastructure (which includes IT, data security, BCP, internal controls, and having sufficient competent staff) is adequate to run the business compliantly.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 244,
    "questionText": "The KI is responsible for the FSP's compliance. They must ensure that the FSP's **annual compliance report** is accurately prepared and submitted to the FSCA:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Upon request from the client.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "By the specified regulatory deadline.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only if the FSP made a profit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Every six months.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 19(2)) mandates the submission of a compliance report to the FSCA at regular intervals (annually). The KI, as the person accountable for compliance, is responsible for ensuring this report is accurate and submitted by the deadline.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 245,
    "questionText": "Which scenario best illustrates the KI's failure to oversee the **Representative Register** as required by the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The KI ensures all Representative RE5 exams are passed on time.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The KI appoints a new Representative without checking their Fit and Proper status.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The KI delegates the client complaint handling process to the Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The KI fails to file the FSP's tax return on time.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI has a direct duty (FAIS Act, Sec 13(1)) to ensure that *no person* is appointed as a representative unless they meet the Fit and Proper requirements *at the time of appointment*. Appointing someone without checking this is a direct failure of this specific oversight duty.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 246,
    "questionText": "Which ONE of the following is an example of a **Category II** financial service?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Rendering advice on a short-term insurance policy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Administering a health service benefit.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Providing discretionary investment management services.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only executing a client's instruction without advice.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines the license categories. Category I covers most advice and intermediary services. Category II is specifically for FSPs that manage investments on a *discretionary* basis, meaning they make investment decisions on behalf of the client without seeking instruction for each transaction.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 247,
    "questionText": "A Representative advises a client to switch all their savings into an aggressive high-growth equity fund, despite the client stating their risk tolerance is moderate. This is a failure of the Representative's duty regarding:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suitability and Appropriateness.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Conflict of Interest disclosure.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3(2) and Sec 8) requires advice to be suitable. This means the product's risk profile must align with the client's risk tolerance. Recommending a high-risk product to a moderate-risk client is a classic example of unsuitable advice.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 248,
    "questionText": "A Representative must have sound knowledge of the financial products they advise on. This is to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Compliance with the KI's personal goals.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP can charge the highest possible fees.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The advice provided is accurate and appropriate.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Product Supplier meets its sales targets.",
        "isCorrect": false
      }
    ],
    "explanation": "Product knowledge is a key component of 'Competence' (FAIS Act, Sec 13(1)). A representative cannot provide accurate or appropriate (suitable) advice if they do not fundamentally understand the features, costs, and risks of the products they are recommending.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 249,
    "questionText": "Which risk refers to the difficulty or cost associated with converting an investment back into cash quickly?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Credit Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Liquidity Risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Market Risk.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Compliance Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Liquidity Risk' is the specific term for the risk that an investor may not be able to sell or redeem their investment quickly, or may have to do so at a significant loss (a low price) due to a lack of ready buyers or due to policy penalties.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 250,
    "questionText": "In terms of disclosure, a Representative must clearly explain all material aspects of a product. This includes all the following EXCEPT:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The key features and benefits of the product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The costs and charges associated with the product.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Product Supplier's annual profit margin.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Any significant exclusions or risks of the product.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) requires disclosure of all material facts, including features (A), costs (B), and risks/exclusions (D). The supplier's internal profit margin (C) is not a required disclosure to the client.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 251,
    "questionText": "A newly appointed representative, Mr. Skhosana, who advises on Category I products, must pass the RE5 exam within two years of his date of first appointment. If he fails to do so, what immediate action is required by the FSP?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Pay a penalty to the FSCA for the representative's failure.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Debar him and remove him from the FSP register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Transfer him to a non-FAIS related role.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Place him under double supervision indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "Failure to pass the RE5 within the 24-month deadline (FAIS Act, Sec 13(1)(a)) is a failure to meet the 'Competence' requirement. The representative is no longer Fit and Proper. The mandatory action for the FSP is to debar the representative and remove them from the register.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 252,
    "questionText": "A Representative helps a client complete a claim form for an insurance policy. Under the FAIS Act, this activity is most accurately classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Intermediary Service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product Design.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Key Individual Management.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'Intermediary Service' as any act *other than advice* performed on behalf of a client in relation to a financial product. Assisting with claims (processing, submission) is a specifically listed example of an intermediary service.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 253,
    "questionText": "Which objective is **NOT** a primary purpose of the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Promoting the fair treatment of clients.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Establishing professional standards for FSPs.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Regulating the prudential soundness and capital requirements of banks.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Providing for the appointment of an Ombud for FSPs.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act is *market conduct* legislation. It regulates *how* FSPs interact with clients (A, B, D). The *prudential soundness* (e.g., capital adequacy) of banks (C) is the responsibility of the Prudential Authority (PA) under the 'Twin Peaks' model, not the FAIS Act.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 254,
    "questionText": "An FSP operating in Category I (advice and intermediary services) must maintain minimum financial resources. This is necessary to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP can afford expensive marketing campaigns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compliance with the Financial Soundness requirement.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP can charge higher client fees.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Compliance with the FIC Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8) requires all FSPs to be 'Fit and Proper', which includes 'Financial Soundness'. This requirement (detailed in the Fit & Proper rules) mandates that FSPs hold minimum levels of liquid assets and capital to ensure they are solvent and can meet their obligations.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 255,
    "questionText": "An FSP wishes to extend its license to include a new category of financial product. What is the mandatory step the FSP must take before commencing services in the new category?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Inform the FSCA within 30 days of starting the new service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Apply for a variation of its license from the FSCA.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only update the FSP's internal compliance manual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Appoint a new Key Individual.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP cannot render services outside its license conditions (FAIS Act, Sec 8(2)). To add a new category, the FSP must apply to the FSCA for a 'variation of license'. This is a formal application process where the FSP must prove it meets the Fit and Proper requirements for that new category.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 256,
    "questionText": "A person who provides a recommendation, guidance, or proposal of a financial nature to a client about a financial product is rendering:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An excluded activity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Intermediary Service only.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Factual information.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the core definition of 'advice' as per the FAIS Act (Sec 1). Any 'recommendation, guidance or proposal of a financial nature' that relates to a financial product is considered advice and is regulated by the Act.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 257,
    "questionText": "If a Representative is debarred by the FSP for failure to comply with Fit and Proper requirements, the FSP must immediately remove the Representative's name from its register. The purpose of this mandatory removal is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Punish the Representative.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Prevent the person from continuing to render financial services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Transfer the person to the FSCA's employ.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Waive the FSP's record-keeping obligations.",
        "isCorrect": false
      }
    ],
    "explanation": "Debarment (FAIS Act, Sec 14) and removal from the register (Sec 13(2)) formally revoke a person's authorization. The primary purpose is to protect the public by ensuring that an individual who is not Fit and Proper is immediately prohibited from rendering any financial services.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 258,
    "questionText": "The FSP must ensure that its staff complies with the **subordinate legislation** under the FAIS Act. Which ONE of the following is the most important example of this?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The General Code of Conduct.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The National Credit Act.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Consumer Protection Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Labour Relations Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act is the primary statute. 'Subordinate legislation' refers to the specific regulations and codes issued *under* the Act. The 'General Code of Conduct for Authorised FSPs and Representatives' is the most important piece of subordinate legislation, setting out the detailed rules for how FSPs must behave.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 259,
    "questionText": "A Representative provides advice knowing that the product is unsuitable for the client, merely to earn a high commission. This act constitutes a serious breach of which Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      }
    ],
    "explanation": "Knowingly giving unsuitable advice for personal gain (commission) is a profound act of bad faith. It violates the representative's core duty to the client and is a severe breach of the 'Honesty and Integrity' requirement (Fit & Proper, Sec 7), as it constitutes dishonest and unethical conduct.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 260,
    "questionText": "A Representative must possess the required **qualification** for the specific financial services they render. This is a fundamental component of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence requirement.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 26) detail the 'Competence' pillar. This pillar is comprised of three main parts: 1) having a recognized Qualification, 2) passing the Regulatory Exams, and 3) gaining the required Experience.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 261,
    "questionText": "An FSP must have a documented process to ensure it can comply with all legal requirements. This falls under the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(d)) defines 'Operational Ability' as having the necessary infrastructure to manage the business. This includes having a compliance framework, internal controls, and documented processes to ensure that all legal and regulatory requirements are met.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 262,
    "questionText": "The supervision of a representative must be documented and structured. Which ONE of the following best describes the primary goal of this supervision?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ensure the representative never takes a holiday.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Provide the representative with the necessary experience to become fully competent.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Limit the FSP's tax liability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Ensure the representative only advises on low-risk products.",
        "isCorrect": false
      }
    ],
    "explanation": "Supervision (Fit & Proper, Sec 25) is the mechanism used to bridge the gap between having a qualification/exam and being fully competent. Its goal is to allow the new representative to gain the required practical 'Experience' in a safe, controlled environment under the guidance of a competent person.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 263,
    "questionText": "If the FSCA issues a notice of intention to suspend an FSP's license due to persistent non-compliance, what is the FSP's best course of action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Immediately close the business and sell all assets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Lodge an appeal with the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Submit representations to the FSCA to prove compliance or justify non-compliance.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Change the FSP's name and re-apply for a new license.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14) requires procedural fairness. A 'notice of intention' is not the final action; it is the FSP's opportunity to respond. The FSP must submit formal representations to the FSCA, providing evidence of compliance or a plan to rectify the non-compliance, to argue against the suspension.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 264,
    "questionText": "Which ONE of the following statements is correct regarding the FSP's obligation to ensure its Representatives remain Fit and Proper?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's responsibility ends once the Representative is initially appointed.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must continually monitor the Representative's compliance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP only checks compliance during the annual audit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The responsibility for ongoing compliance lies solely with the Representative.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit and Proper requirements (FAIS Act, Sec 8(1)(a)) are *ongoing*. The FSP (through its KI) has a continuous legal duty to monitor its representatives to ensure they *remain* Fit and Proper (e.g., maintain competence via CPD, remain financially sound, and uphold honesty and integrity) at all times.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 265,
    "questionText": "The FSP must maintain adequate physical and electronic systems to protect client data and prevent system failure. This is part of the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) refers to the FSP's infrastructure. This includes its technological systems, data security measures, and business continuity plans to ensure the business can operate securely and reliably.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 266,
    "questionText": "The FSP must ensure it has adequate resources to absorb potential unexpected losses. This addresses the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Financial Soundness' requirements (Fit & Proper, Sec 4) are not just about paying daily bills. They require the FSP to have sufficient capital adequacy (assets in excess of liabilities) to be able to absorb unexpected shocks or losses and remain solvent, thus protecting clients.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 267,
    "questionText": "The Code of Conduct requires the Representative to determine a financial product's **suitability**. Which factor is most essential in this determination?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The product's age.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The product's profit margin for the FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The client's risk profile and investment goals.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The popularity of the product on the market.",
        "isCorrect": false
      }
    ],
    "explanation": "Suitability (General Code, Sec 7 & 8) is the process of matching the client to the product. This cannot be done without first establishing the client's own risk profile (their tolerance and capacity for loss) and their financial goals (what they are trying to achieve).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 268,
    "questionText": "A Representative fails to disclose the specific financial services category (e.g., Category I) for which their FSP is appointed. This violates the mandatory requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record keeping.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Status disclosure.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(a) and Sec 4) requires the representative to provide the client with a 'Status Disclosure'. This disclosure must include details of the FSP's license, including the categories of service it is authorized to provide.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 269,
    "questionText": "All information provided to the client by a Representative, including written and verbal communication, must be accurate, clear, and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Extremely detailed and technical.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Approved by the KI.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Not misleading.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only delivered in English.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a core principle of disclosure under the General Code of Conduct (Sec 4(1)). All communications, marketing, and advice must be 'factual, clear, and not misleading' to allow clients to make informed decisions.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 270,
    "questionText": "An FSP's Conflict of Interest Management Policy must include procedures for managing identified conflicts. This management process involves which of the following steps?\n\ni. Avoidance\nii. Mitigation\niii. Disclosure\niv. Reporting to the FAIS Ombud",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii, and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "ii and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(c)) provides a clear hierarchy for managing conflicts. The FSP's policy must detail the procedures for: 1) Identifying conflicts, 2) *Avoiding* them, or if not possible, *Mitigating* them, and 3) *Disclosing* them to the client. Reporting to the Ombud (iv) is not part of the management process.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 272,
    "questionText": "The Code of Conduct requires that the Representative discloses their relationship with the Product Supplier (e.g., whether they are independent or tied). This is to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP can charge a higher fee.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client understands the potential for bias in the advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Product Supplier is compliant with the FIC Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative earns a higher salary.",
        "isCorrect": false
      }
    ],
    "explanation": "This disclosure (General Code, Sec 4(1)) is a key part of managing conflicts of interest. If a representative is 'tied' to one supplier, their advice is not independent. The client has a right to know this, as it informs them about the potential for bias in the recommendation.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 274,
    "questionText": "The minimum 5-year record-keeping period for a financial product commences from the date the financial service was rendered, or for ongoing services, from the date the service:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Is renewed.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Is first initiated.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Ceased (i.e., policy matured or client terminated).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP last completed an audit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18) and Code of Conduct (Sec 3(4)) specify that for ongoing products (like an investment or long-term policy), the 5-year retention period only begins *after* the product has been terminated or the service has ceased.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 276,
    "questionText": "Which of the following documents is subject to the minimum 5-year record-keeping period?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal grocery receipts.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Internal staff meeting minutes not related to compliance.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Records of all client complaints and their resolution.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's internal staff newsletter.",
        "isCorrect": false
      }
    ],
    "explanation": "The 5-year rule (Code of Conduct, Sec 3(4) and FAIS Act Sec 18) applies to all records related to the provision of financial services and compliance with the Act. This explicitly includes the FSP's complaints register and all records of how client complaints were handled.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 277,
    "questionText": "The FSP's record of advice must include details regarding the **fee or commission** received by the FSP and/or the Representative. This is to ensure compliance with the requirements for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act reporting.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Disclosure and transparency.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD completion.",
        "isCorrect": false
      }
    ],
    "explanation": "The Record of Advice (Code of Conduct, Sec 3(4)) must document that all mandatory disclosures were made. The disclosure of remuneration (fees and commissions) is a key requirement for transparency, and the record must prove this disclosure took place.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 278,
    "questionText": "The FIC Act requires all Accountable Institutions (AIs), including FSPs, to focus on combating money laundering and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax evasion.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Terrorist financing.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Insider trading.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Credit fraud.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 3) has two main pillars: combating Money Laundering (ML) and combating the Financing of Terrorism (CFT). All FSP controls and reporting duties are aimed at identifying and preventing both of these illicit activities.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 279,
    "questionText": "The FSP must file a **Cash Threshold Report (CTR)** for a cash transaction if it meets or exceeds the prescribed amount. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "This report is only required if the FSP suspects money laundering.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "This report is mandatory and must be filed regardless of suspicion.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "This report is only required if the client is a foreign resident.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "This report is only required if the transaction is for a Tier 1 product.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 28) distinguishes between STRs (suspicion-based) and CTRs (threshold-based). A CTR is a mandatory, objective report. If a cash transaction exceeds the set limit (R49,999.99), it *must* be reported, even if there is no suspicion of wrongdoing.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 280,
    "questionText": "A compliance officer is reviewing the FSP's RMCP. The RMCP should include a method for assessing risk factors related to the client's **country of origin**. This is an application of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Standard Due Diligence rule.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Cash Threshold Reporting rule.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Risk-Based Approach (RBA).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Tipping-Off Prohibition.",
        "isCorrect": false
      }
    ],
    "explanation": "The Risk-Based Approach (RBA), which is the foundation of the RMCP (Sec 42A), requires an FSP to assess its risks. One of the key risk factors is 'geographic risk'. The RMCP must therefore include a process for identifying and risk-rating clients based on their country of origin (e.g., is it a high-risk jurisdiction?).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 281,
    "questionText": "If a client is a company, the FSP must identify and verify the identity of the **Beneficial Owner** (BO). Which ONE of the following statements best describes the BO?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The natural person who is the company's CEO.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The natural person who ultimately owns or controls the company.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The legal entity that owns the company's shares.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The natural person who manages the company's social media.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21B) requires FSPs to identify the 'Beneficial Owner'. This is not necessarily the CEO, but the *natural person* (human) who ultimately controls the company or benefits from its assets, often through holding a controlling percentage of shares (e.g., 25% or more).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 282,
    "questionText": "The obligation to file a **Suspicious or Unusual Transaction Report (STR)** to the FIC rests upon the FSP when:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The transaction amount exceeds R25,000.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP has any reasonable suspicion that a transaction is related to a crime.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client refuses to disclose their income details.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The transaction is for a Category I product.",
        "isCorrect": false
      }
    ],
    "explanation": "The trigger for an STR (FIC Act, Sec 29) is 'suspicion'. It is not tied to a monetary amount. If the FSP or any of its staff has a reasonable suspicion that a transaction (or attempted transaction) is related to the proceeds of crime or terrorist financing, they have a legal duty to file an STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 283,
    "questionText": "The FIC Act requires FSPs to verify a client's identity **before** establishing a business relationship. This is a crucial element of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping policy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Customer Due Diligence (CDD) requirement.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Disclosure of Remuneration rule.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Suitability of Advice rule.",
        "isCorrect": false
      }
    ],
    "explanation": "'Customer Due Diligence' (CDD) (FIC Act, Sec 21) is the formal process of identifying and verifying the client (also known as KYC). The Act is explicit that this must be done *before* the business relationship is established or a transaction is concluded.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 284,
    "questionText": "Which penalty for non-compliance with the FIC Act is most severe for a Key Individual?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A written warning.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Reputational damage.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Criminal prosecution leading to fines or imprisonment.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A mandatory re-write of the RE5 exam.",
        "isCorrect": false
      }
    ],
    "explanation": "While administrative sanctions (fines) under Sec 45B are severe, the FIC Act also contains criminal offences (e.g., for tipping-off or willful non-compliance). These can lead to criminal prosecution of the responsible individuals (like the KI), resulting in massive fines and/or imprisonment, which is the most severe consequence.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 286,
    "questionText": "An FSP's final response to a client's internal complaint must be in writing. Choose the INCORRECT statement. The response must also:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Set out the FSP's final decision.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Provide the reasons for the decision.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Advise the client of their right to approach the Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Guarantee that the Ombud will agree with the FSP's decision.",
        "isCorrect": true
      }
    ],
    "explanation": "The FSP's final response (Ombud Rules, Rule 7) must include the decision (A), the reasons (B), and the client's right to escalate to the Ombud (C). The FSP can make no guarantee (D) about the Ombud's decision, as the Ombud is an independent body.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 287,
    "questionText": "The FAIS Ombud's jurisdiction is limited to complaints arising from the rendering of financial services in terms of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Consumer Protection Act (CPA).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Advisory and Intermediary Services Act (FAIS Act).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Insolvency Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "National Credit Act (NCA).",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud is the *FAIS* Ombud. Its mandate and jurisdiction, as established by the FAIS Act (Sec 27(1)), are specifically limited to resolving disputes where a client alleges a contravention of the FAIS Act or Code of Conduct by an FSP or representative.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 288,
    "questionText": "When a complaint is lodged with the FAIS Ombud, what is the mandatory attitude required of the FSP toward the investigation process?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ignore the investigation to show disagreement.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Engage only through a high-cost attorney.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Cooperate fully and furnish all information required.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Pay the client a settlement immediately.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 11) and FAIS Act (Sec 27) impose a legal duty on all parties to a complaint to 'cooperate fully' with the Ombud's investigation. This includes providing all requested information and records in a timely manner.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 289,
    "questionText": "If an FSP fails to comply with a Final Determination made by the FAIS Ombud, the determination can be enforced as if it were a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simple internal reprimand.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Civil court judgment.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Recommendation from the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Mediation settlement.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 28(5)) gives the Ombud's Final Determination its power. If not appealed, it is legally 'deemed to be a judgment of a civil court', and the client can use it to attach the FSP's assets to get payment.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 290,
    "questionText": "The FAIS Ombud's mandate does **NOT** extend to disputes involving which ONE of the following?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The suitability of advice given by a representative.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The failure to disclose commission.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A claim that exceeds the Ombud's monetary limit.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The failure of an FSP to keep records.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(3)) sets a jurisdictional monetary limit (currently R800,000). If a client's claim exceeds this amount, the Ombud does not have the jurisdiction to hear the complaint (unless the client abandons the excess). All other options (A, B, D) are FAIS Act breaches and fall within the Ombud's jurisdiction.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 291,
    "questionText": "For a licensed FSP, the Key Individual (KI) is the person responsible for the **management and oversight** of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSP's entire business, including manufacturing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Specific financial services that the FSP is licensed to provide.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product Supplier's annual sales targets.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's personal tax affairs.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines the KI's role as being responsible for managing and overseeing the 'rendering of financial services' – that is, the specific activities for which the FSP is licensed under the FAIS Act. Their responsibility does not extend to non-financial aspects of the business.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 292,
    "questionText": "The KI discovers that the FSP's internal compliance system for monitoring Representatives' CPD is outdated. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The KI must report the compliance system failure to the FIC.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The KI has a duty to take steps to upgrade the system as part of ensuring Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The KI can ignore the issue if the FSP is meeting sales targets.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The KI must ask the Compliance Officer to handle the CPD monitoring manually indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI has an oversight duty (Sec 17(1)) for the FSP's 'Operational Ability'. An outdated compliance monitoring system is a failure of this ability. The KI must take corrective action to ensure the FSP has an effective system to monitor the competence (CPD) of its representatives.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 293,
    "questionText": "A KI must meet the **Competence** requirements for the categories of services the FSP provides. This includes having demonstrated:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Experience in civil law.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Regulatory knowledge through the RE1 examination.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A minimum of R500,000 personal savings.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Membership in an external industry body.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Competence' requirements (Fit & Proper, Sec 26) for a Key Individual include having management experience, a recognized qualification, and, crucially, passing the *Key Individual* regulatory exam, which is the RE1.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 294,
    "questionText": "The KI must ensure that the FSP's annual financial statements demonstrate compliance with the **Financial Soundness** requirements. This is a duty related to the KI's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing skills.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Oversight of financial management.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Record keeping for client complaints.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Client communication skills.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI is responsible for the overall management of the FSP's compliance (Sec 17/19). This includes oversight of the FSP's adherence to the Fit and Proper requirements, one of which is 'Financial Soundness'. The KI must ensure the FSP's finances are properly managed to meet these requirements.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 295,
    "questionText": "The KI is responsible for the overall operational management of the FSP. This includes ensuring that the FSP's **internal controls** are designed to meet all FAIS Act obligations, particularly concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product pricing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compliance and risk mitigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The KI's remuneration.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's holiday schedule.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (Sec 17(1)) is focused on the FSP's 'Operational Ability'. A core part of this is establishing and maintaining a framework of internal controls designed to mitigate risks and ensure the FSP and its staff comply with all aspects of the FAIS Act.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 296,
    "questionText": "A **Category I** FSP is licensed to render advice and intermediary services, but is EXCLUDED from performing which ONE of the following services (unless it obtains a separate license category)?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Advice on Long-term insurance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Advice on Investments.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Discretionary financial service (Category II).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Advice on Tier 2 simple products.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines the license categories. Category I is for standard advice and intermediary services (A, B, D). Category II is a separate, specialist license for FSPs that manage client assets on a *discretionary* basis. A Cat I FSP cannot perform Cat II services without that license.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 297,
    "questionText": "To determine a product's suitability, a Representative must assess the product's **risk profile** against the client's risk tolerance. The product's risk profile is generally defined by its:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Geographical location.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Potential for fluctuation in value (volatility).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product Supplier's name.",
        "isCorrect": false
      }
    ],
    "explanation": "A product's 'risk profile' refers to its inherent risk. A key measure of this is volatility—the potential for its value to fluctuate up or down. As per the Code of Conduct (Sec 3(2)), a representative must understand this risk to match it to the client's risk tolerance.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 298,
    "questionText": "A Representative is competent to advise on life insurance but advises a client on a highly complex derivative product outside their mandated category. Which requirement is breached?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Product Knowledge and Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP and its representatives must be competent for the specific products they advise on (FAIS Act, Sec 13(1)). Advising on a product outside one's mandated category (which is based on competence) is a direct breach of the 'Competence' requirement, as the representative lacks the required product knowledge and authorization.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 299,
    "questionText": "The FSP must distinguish between **Tier 1** and **Tier 2** products when onboarding a representative. Choose the correct statement.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tier 1 products are low-risk, like funeral policies.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Tier 1 products are higher complexity and require the Representative to pass the RE5.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tier 2 products are high-risk, like derivatives.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Tier 2 products always provide guaranteed returns.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) and Fit & Proper rules differentiate products by complexity. Tier 1 products (investments, most insurance) are more complex. Because of this, they trigger more stringent competence requirements, most notably the mandatory RE5 examination. Tier 2 products (C) are simple and low-risk (A).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 300,
    "questionText": "When a Representative explains the features of a financial product, they must ensure the client understands the product's **exclusions**. This is a requirement for adequate:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suitability analysis.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Disclosure.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Record keeping.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) requires full and fair 'Disclosure'. To ensure a client is not misled, this disclosure *must* include all material aspects, especially negative ones like risks, limitations, and specific exclusions (what the product *does not* cover).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 327,
    "questionText": "An FSP's register of Representatives must include details of any **debarment** action taken against the Representative. This record keeping duty is required for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requires all records related to the Act's compliance to be kept for 5 years. This includes the representative register, which must contain all details of appointments *and* terminations/debarments, providing a 5-year compliance history.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 341,
    "questionText": "The Key Individual (KI) must ensure the FSP has adequate systems for the ongoing monitoring of compliance with the **FIC Act**. This is an element of the KI's duty concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability (Controls).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight (Sec 17(1)) covers compliance with *all* applicable laws. The systems and controls for monitoring FIC Act compliance are part of the FSP's 'Operational Ability' (its internal control framework), which the KI is responsible for managing.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 346,
    "questionText": "Which product is typically classified as a **Tier 2** product, meaning the representative is exempt from the RE5 examination?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A Complex Investment in Offshore Bonds.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An investment in a local Unit Trust.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A simple funeral policy.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A derivative contract.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) and Fit & Proper rules classify products by complexity. Tier 2 products are simple and low-risk. A funeral policy (Subcategory 1.1) is the primary example of a Tier 2 product, and representatives advising *only* on these are exempt from the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 327,
    "questionText": "Which of the following records must be kept for a minimum of 5 years?\n\ni. Records of advice given to clients.\nii. Records of representative debarments.\niii. The client complaint register.\niv. Records of staff CPD and qualifications.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i, ii and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii and iv",
        "isCorrect": true
      }
    ],
    "explanation": "Under the FAIS Act (Sec 18) and General Code of Conduct (Sec 3(4)), all records relating to the Act's compliance must be kept for 5 years. This includes advice (i), representative compliance records like debarments (ii), the complaints register (iii), and records of competence like CPD (iv).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 341,
    "questionText": "Choose the INCORRECT statement. A Key Individual's oversight duties include ensuring:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP remains financially sound.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP has adequate operational ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "All Representatives meet their monthly sales targets.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's representatives remain competent.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duties (Sec 17(1)) relate to *compliance* with the FAIS Act. This includes ensuring Financial Soundness (A), Operational Ability (B), and Representative Competence (D). Sales targets (C) are a business management issue, not a regulatory compliance duty for the KI.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 346,
    "questionText": "Which of the following products are generally classified as **Tier 1**, requiring a representative to pass the RE5?\n\ni. Funeral policies\nii. Retirement Annuities\niii. Health Service Benefits\niv. Collective Investment Schemes (Unit Trusts)",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "ii and iv only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "i, ii, and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "ii, iii, and iv only",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) product tiers are based on complexity. Tier 2 products are simple, like Funeral policies (i) and Health Service Benefits (iii). Tier 1 products are more complex, like Retirement Annuities (ii) and Unit Trusts (iv), and thus require the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 351,
    "questionText": "Mr. Naidoo is a representative who is mandated only to perform **intermediary services**. Which ONE of the following activities is he permitted to perform?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Recommending a specific product to a client.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Giving investment guidance based on a client's risk profile.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Executing a transaction or instruction on behalf of a client.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Determining product suitability for a client.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1 Definitions) clearly separates 'advice' (A, B, D) from 'intermediary services'. Intermediary services are actions taken *other than advice*, such as processing paperwork, collecting premiums, or executing a direct client instruction.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 352,
    "questionText": "A Representative fails the RE5 for a Tier 1 product two years and one month after their date of first appointment. The FSP's failure to remove the representative immediately is a breach of the requirements for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Fit and Proper (Competence).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 exam is a key 'Competence' requirement (FAIS Act, Sec 13(1)(a)). The deadline is 24 months. At 24 months and 1 day, the representative is no longer competent and thus not Fit and Proper. The FSP's failure to debar them is a breach of its duty to ensure its representatives are competent.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 353,
    "questionText": "Which of the following activities is regulated as a **financial product** under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A long-term insurance policy.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "A legal contract for a non-financial service.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "General advice published in a newspaper.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A simple banking deposit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1 Definitions) provides a specific list of what constitutes a 'financial product'. A 'long-term insurance policy' is explicitly included in this definition. Simple banking deposits (D) and general media advice (C) are often excluded or treated differently.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 354,
    "questionText": "The FSP must have adequate measures to mitigate the risk of its representatives acting outside of the scope of their mandates. This control falls under the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD completion.",
        "isCorrect": false
      }
    ],
    "explanation": "Supervision and internal controls over representatives are key components of an FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)). The FSP must have systems in place to manage its staff and ensure they comply with their mandates.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 355,
    "questionText": "Which ONE of the following statements is correct regarding the General Code of Conduct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It is a voluntary guideline for FSPs to consider.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It is legally binding subordinate legislation under the FAIS Act.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It only applies to Key Individuals, not Representatives.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It is written and enforced by the FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct is 'subordinate legislation' issued *under* the authority of the FAIS Act. It is not voluntary; it has the full force of law, and a breach of the Code is a breach of the Act. It is enforced by the FSCA (not the Ombud, who resolves disputes).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 356,
    "questionText": "If a Representative resigns due to personal reasons, the FSP must inform the FSCA within a specific timeframe and update the register. This notification is required to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative continues to be covered by the FSP’s PI insurance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSCA is aware of who is authorized to render financial services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's license remains valid.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative pays their annual CPD fee.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSCA maintains the central register of all authorized representatives (FAIS Act, Sec 13/14). The FSP has a duty to notify the FSCA 'immediately' of any change to a representative's status (including resignation) so the central register remains accurate and the public is protected from unauthorized individuals.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 357,
    "questionText": "A Representative provides a new client with a comparison quote of two suitable products, clearly stating the features, costs, and benefits of each. This is considered:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Factual information only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "An intermediary service.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A conflict of interest.",
        "isCorrect": false
      }
    ],
    "explanation": "Providing a comparison that leads to a recommendation, or is itself a 'proposal of a financial nature' (FAIS Act, Sec 1 Definitions) designed to help the client make a decision, constitutes 'advice'. It goes beyond merely stating facts and involves analysis and comparison for a specific client.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 358,
    "questionText": "A person appointed to render financial services for funeral and friendly society benefits (Subcategory 1.1) is *NOT* required to write the RE5 examination because these products are classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "High-risk products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Tier 1 products.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Tier 2 products.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Discretionary products.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) are tiered. Funeral policies are classified as 'Tier 2' products due to their simplicity and lower risk. The RE5 examination is only mandatory for representatives who render services for more complex 'Tier 1' products.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 359,
    "questionText": "A Representative is convicted of a serious crime involving financial dishonesty (theft). The Representative is immediately debarred due to a failure to meet the requirements for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) for 'Honesty and Integrity' explicitly state that a person is not Fit and Proper if they have been convicted of a serious offence involving dishonesty. This is an automatic disqualifier.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 360,
    "questionText": "An FSP's internal systems fail, leading to the loss of several days' worth of new client data. This indicates a weakness in the FSP's compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability (Data backup and business continuity).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having adequate technological systems, data security, and business continuity plans (BCP). A system failure that results in data loss indicates a critical failure in these operational controls, specifically data backup and recovery.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 361,
    "questionText": "A Representative has passed the RE5 and attained the required qualification. The final element of **Competence** that must be fulfilled is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Achieving the maximum sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Completing the minimum required experience under supervision.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Paying the annual FSCA levy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Completing a degree in business management.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (Fit & Proper, Sec 20) is defined by three components: 1) Qualification (the certificate/degree), 2) Regulatory Exam (the RE5), and 3) Experience (the on-the-job training acquired under supervision). All three must be completed.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 362,
    "questionText": "The FSP must have a documented process for the management and disposal of records. This is a requirement related to the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability (Record Management).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "Record management, including storage, retrieval, and secure disposal, is a key administrative and control process. This function falls under the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) to manage its systems and processes compliantly.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 363,
    "questionText": "Which action is required of a Representative annually to demonstrate their ongoing compliance with the Honesty, Integrity, and Financial Soundness requirements?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Passing the RE5 again.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Submitting a signed declaration to the FSP.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Having a mandatory external audit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Submitting their tax returns to the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "Fit and Proper is an ongoing duty. To monitor this, FSPs must require their representatives to sign a declaration at least annually, confirming that they still meet the personal character requirements of 'Honesty and Integrity' and 'Financial Soundness' (Fit & Proper, Sec 7 & 4).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 364,
    "questionText": "The FSP has a duty to take reasonable steps to ensure all Representatives are of 'good standing'. This means the FSP must verify:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Their academic performance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Their credit history and lack of disqualifying convictions.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Their vehicle registration details.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Their social media activity.",
        "isCorrect": false
      }
    ],
    "explanation": "'Good standing' (FAIS Act, Sec 8(1)(a)) refers to the personal character requirements. This primarily includes 'Honesty and Integrity' (which is checked by verifying no disqualifying criminal convictions) and 'Financial Soundness' (which is checked via credit history).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 365,
    "questionText": "An FSP delegates the compliance monitoring function to a third party. The responsibility for the compliance function remaining adequate and effective rests with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The third-party compliance provider only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP's Key Individual.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representatives.",
        "isCorrect": false
      }
    ],
    "explanation": "Outsourcing a function (like compliance) is a component of 'Operational Ability' (FAIS Act, Sec 8(1)(d)). While the task is delegated, the FSP (and its KI) remains ultimately accountable to the regulator for ensuring the outsourced function is performed effectively and compliantly.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 366,
    "questionText": "The FSP must maintain adequate liquidity and capital. This requirement ensures that the FSP can:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Easily change its business model.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Meet its liabilities and obligations as they fall due.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Pay commission to the Representative on time.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Avoid all financial risk.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the definition of 'Financial Soundness' (Fit & Proper, Sec 4). Maintaining adequate capital and liquidity ensures the FSP is a 'going concern' and has the financial resources to meet all its financial obligations (like paying debts and claims) as they fall due.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 367,
    "questionText": "The Code of Conduct requires that the Representative obtains sufficient information from the client to determine the recommended product's suitability. This information must relate to the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Personal preferences and hobbies.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial situation, needs, and objectives.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Political affiliation.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Family tree and history.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the core of the 'needs analysis' (General Code, Sec 7 & 8). To provide suitable advice, the representative *must* obtain sufficient information regarding the client's financial situation (assets, income), financial needs, and investment objectives.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 368,
    "questionText": "The Representative's status disclosure must inform the client about the FSP's license. This disclosure must include details of the license's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Annual renewal date.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Categories and sub-categories of services authorized.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Key Individual’s salary.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Cost of the license.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Status Disclosure' (General Code, Sec 3(1)(a) and Sec 4) must tell the client exactly what the FSP is licensed to do. This includes listing the specific categories and sub-categories of financial services and products the FSP is authorized to provide.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 369,
    "questionText": "A Representative receives a cash payment of R5,000 directly from a Product Supplier for exceeding a sales quota. The Representative fails to declare this to the FSP. This represents an unmanaged conflict of interest because it:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Violates the FIC Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Is a private arrangement.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Could inappropriately influence the advice given to the client.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Is part of the Representative's normal salary.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a conflict of interest (General Code, Sec 3(1)(c)). The payment (an incentive) could influence the representative to recommend that supplier's product, even if it's not the best one for the client. By failing to declare it, the FSP cannot manage this conflict, and the representative's objectivity is compromised.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 370,
    "questionText": "The Code of Conduct mandates that when replacement advice is given, the Representative must provide the client with a written comparison... This is to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP can charge a higher fee.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client makes a fully informed decision.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP avoids litigation.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Product Supplier is compliant.",
        "isCorrect": false
      }
    ],
    "explanation": "The replacement rules (General Code, Sec 7(2)) are strict because replacing a policy can be harmful. The mandatory comparison of all costs, fees, benefits, and disadvantages is to ensure the client has all the information needed to make a fully informed decision about the switch.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 371,
    "questionText": "A Representative is marketing a new product. The marketing materials must accurately reflect the performance data, risks, and exclusions, ensuring the information is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Highly technical.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Guaranteed.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Factual and not misleading.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Brief and concise.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) requires all communications, including marketing materials, to be 'factual, clear, and not misleading'. This means all claims must be accurate, and risks/exclusions must be presented clearly.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 372,
    "questionText": "The FSP must take reasonable steps to ensure that the client is aware of the contact details of the **FAIS Ombud**. This is a requirement related to the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Right to privacy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Right to complain.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Right to cancel the policy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Right to a guaranteed return.",
        "isCorrect": false
      }
    ],
    "explanation": "As part of fair client relations (General Code, Sec 3(1) and Sec 16), the FSP must disclose its own complaints procedure *and* the client's right to escalate the complaint. This includes providing the contact details for the FAIS Ombud, ensuring the client knows their 'right to complain'.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 373,
    "questionText": "Which of the following records must be kept for a minimum of 5 years?\n\ni. Records of advice given to clients.\nii. Representative's debarment records.\niii. The client complaint register.\niv. Records of staff CPD and qualifications.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i, ii and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii and iv",
        "isCorrect": true
      }
    ],
    "explanation": "Under the FAIS Act (Sec 18) and General Code of Conduct (Sec 3(4)), all records relating to the Act's compliance must be kept for 5 years. This includes advice (i), representative compliance records like debarments (ii), the complaints register (iii), and records of competence like CPD (iv).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 374,
    "questionText": "The FSP's **internal compliance reports and audit findings** are considered records that must be retained for the minimum statutory period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "7 years.",
        "isCorrect": false
      }
    ],
    "explanation": "Internal compliance reports are critical records demonstrating the FSP's 'Operational Ability' and its monitoring of compliance. Under the FAIS Act (Sec 18), these, like all other compliance and service-related records, must be kept for a minimum of 5 years.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 375,
    "questionText": "A Representative fails to file the client's signed acknowledgment of the Conflict of Interest disclosure. This omission directly compromises the FSP’s ability to prove compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suitability analysis.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Disclosure and Record Keeping requirements.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "FIC Act CDD.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct requires disclosure of conflicts. The 'Record of Advice' (Sec 3(4)) is the *proof* that this disclosure happened. Without the signed record, the FSP has no evidence to show an auditor or the Ombud that it complied with its disclosure *and* record-keeping duties.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 376,
    "questionText": "The minimum 5-year record-keeping period applies to records of financial service rendered, as well as to records of the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Identity and contact details.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Personal hobbies.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Representative's salary.",
        "isCorrect": false
      }
    ],
    "explanation": "The 5-year rule (Code of Conduct, Sec 3(4)) applies to all records related to the client and the service. This includes the client's personal information (like identity and contact details) that was obtained to provide the service and is part of the client's file.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 377,
    "questionText": "If the FSP stores its records electronically, the system must include appropriate security measures against fire, theft, or data loss. This is required under the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability requirements.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence requirements.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "The requirement to keep records safe and secure (FAIS Act, Sec 18) is a component of the FSP's 'Operational Ability'. This pillar covers all systems, processes, and controls, including IT security and business continuity plans (e.g., backups to protect against fire/theft).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 378,
    "questionText": "The purpose of the FIC Act's Customer Due Diligence (CDD) requirement is to ensure the FSP:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Achieves high sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Knows the identity of its client.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Pays its taxes on time.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Complies with the FAIS Act.",
        "isCorrect": false
      }
    ],
    "explanation": "Customer Due Diligence (CDD) (FIC Act, Sec 21) is the process of 'Know Your Customer' (KYC). Its primary purpose is to enable the FSP to identify and verify, with reasonable certainty, the identity of the person or entity it is doing business with, to prevent anonymity in the financial system.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 379,
    "questionText": "If a Representative suspects a transaction is related to the financing of terrorist activities, the FSP must immediately file a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Client Complaint Report (CCR).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Suspicious or Unusual Transaction Report (STR).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Tipping-Off Prohibition Report.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) mandates the reporting of any suspicion related to the proceeds of crime *or* the financing of terrorism. A suspicion of terrorist financing is one of the most serious triggers for an immediate STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 380,
    "questionText": "Under the **Risk-Based Approach (RBA)**, the FSP's controls should focus most heavily on areas identified as presenting the highest risk of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Client dissatisfaction.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Money laundering and terrorist financing.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Record keeping failure.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Low Representative competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) is the cornerstone of the FIC Act. It requires an FSP to identify *its* specific risks for *money laundering and terrorist financing* (ML/TF) and then apply its compliance resources and controls proportionately, focusing most heavily on the highest ML/TF risk areas.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 381,
    "questionText": "The **Tipping-Off Prohibition** under the FIC Act ensures the Representative does not inform the client that an STR has been filed. This rule is necessary to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Protect the client's reputation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Ensure the success of the investigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Maintain the FSP's profitability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Allow the FSP to pay a fine.",
        "isCorrect": false
      }
    ],
    "explanation": "Tipping-off (FIC Act, Sec 29(3)) is a criminal offence. Its purpose is to protect the integrity of a potential investigation. Alerting the suspect would 'prejudice' the investigation by giving them an opportunity to move funds, destroy evidence, or flee.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 382,
    "questionText": "When identifying a client that is a trust, the FSP must take reasonable steps to verify the identity of the trustees and the **Beneficial Owner** (the natural person who ultimately benefits or controls the trust). This is a requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Money Laundering Reporting.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Customer Due Diligence (CDD).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Cash Threshold Reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "Identifying the Beneficial Owner (FIC Act, Sec 21B) is a fundamental part of 'Customer Due Diligence' (CDD) for legal entities like trusts. The FSP must 'know' not just the trust itself, but the *natural persons* who own, control, or benefit from it.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 384,
    "questionText": "The FSP's **RMCP** must be a comprehensive document that is routinely subjected to testing to ensure its:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Effectiveness in detecting and preventing money laundering.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing reach.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Minimal cost.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) is the FSP's 'program' for fighting financial crime. The FSP must regularly test this program to ensure its internal controls are *effective* in achieving the Act's goals: identifying, assessing, mitigating, and reporting money laundering and terrorist financing risks.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 385,
    "questionText": "The FSP's internal complaint handling procedure must adhere to the principle that all complaints should be handled:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "With bias toward the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Fairly and diligently.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only by the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Within 24 hours.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16(1)) requires the FSP's internal complaints process to be fair, accessible, and transparent. This aligns with the core FAIS duty to act 'fairly' and with 'diligence' in all client dealings, including complaints.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 386,
    "questionText": "If an FSP fails to respond to a written complaint within **six weeks**, the client can refer the complaint to the Ombud on the grounds of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Unsuitability of advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Failure to resolve the complaint within the required period.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Failure to comply with the FIC Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Breach of contract.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(1)) set the 6-week (42-day) period. A client can approach the Ombud if they are unhappy with the FSP's *decision*, or if the FSP *fails to make a decision* within that 6-week timeframe.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 387,
    "questionText": "The FAIS Ombud's authority to resolve disputes is limited to issues that relate to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP’s annual tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A Representative's failure to adhere to the FAIS Act.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Product Supplier's investment returns.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Complaints exceeding the monetary limit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Ombud's jurisdiction (FAIS Act, Sec 27(1)) is specifically limited to complaints alleging a contravention of the FAIS Act or Code of Conduct by an FSP or representative, which resulted in a financial loss for the client.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 388,
    "questionText": "After the client receives the FSP's final response, what is the maximum time a client has to lodge the complaint with the FAIS Ombud?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "30 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "6 weeks.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "6 months.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "1 year.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(3)) set a strict prescription period. The client has a maximum of six months from the date of the FSP's final response to refer the matter to the FAIS Ombud. If they miss this deadline, the Ombud may refuse to hear the complaint.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 389,
    "questionText": "If the FAIS Ombud finds in favour of the client, which ONE of the following statements is correct regarding the Ombud's determination?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP can ignore the determination if it is for a small amount.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The determination is 'deemed to be a civil judgment' and is legally enforceable.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSCA must first approve the determination before it becomes binding.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Ombud must refer the determination to the FIC for criminal charges.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination by the Ombud (FAIS Act, Sec 28(5)) is not a mere recommendation; it is a legally binding finding. It is 'deemed to be a civil judgment' and can be enforced as such if the FSP fails to comply.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 390,
    "questionText": "The FAIS Ombud will typically **NOT** investigate a matter if the client has already instituted legal proceedings regarding the same complaint in a civil court. This is due to the principle of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Jurisdictional overlap.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Finality of judicial process.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Monetary limit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Complaint complexity.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud (FAIS Act, Sec 27(3)) is an *alternative* to the courts. If a client has already chosen to pursue the matter in civil court, the Ombud will not investigate the same matter, as this would create a jurisdictional overlap (lis pendens) and potential for conflicting rulings.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 392,
    "questionText": "Which action by a KI would result in the FSP being in immediate breach of its Operational Ability license condition?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Selling a Category I product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Failing to replace the fire alarm system in the KI's home.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Failing to implement the FSP's documented disaster recovery plan after a fire.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Ensuring all Representatives have passed the RE5.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having a business continuity plan (BCP) or disaster recovery plan. Simply *having* the plan is not enough; the FSP must be able to *implement* it. A failure to execute the plan after a disaster is a critical failure of operational ability.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 393,
    "questionText": "The KI is responsible for overseeing that all Representatives on the FSP's register possess the necessary:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Salesmanship skills.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Fit and Proper status.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing qualifications.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "External audit reports.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's core oversight duty (FAIS Act, Sec 13(1)) regarding representatives is to ensure that every person on the register meets, and continues to meet, all the 'Fit and Proper' requirements (Honesty, Competence, Financial Soundness, etc.).",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 394,
    "questionText": "The KI must ensure that the FSP’s annual compliance report includes confirmation that all representatives have submitted their annual declarations regarding:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Their personal tax payments.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Their ongoing Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client's annual satisfaction rating.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The KI's qualification status.",
        "isCorrect": false
      }
    ],
    "explanation": "The annual compliance report (Sec 19(2)) is the KI's report to the FSCA on the FSP's compliance. A key part of this is confirming that the FSP has monitored its representatives, which includes receiving their annual declarations confirming their continued 'Honesty and Integrity' and 'Financial Soundness'.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 395,
    "questionText": "The KI must take reasonable steps to ensure that the FSP maintains adherence to the Financial Soundness requirement throughout the year by monitoring the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Daily social media activity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Monthly financial accounts and liquidity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Representative CPD completion.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Office supplies inventory.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight of 'Financial Soundness' (Sec 17(1)) is an active, ongoing duty. This requires the KI to have a process for regularly monitoring the FSP's financial position (e.g., reviewing monthly management accounts) to ensure it continuously meets the required capital and liquidity thresholds.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 397,
    "questionText": "To determine a product's suitability, a Representative must conduct a thorough needs analysis. Which ONE of the following is a mandatory component of this analysis?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's risk tolerance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's financial soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FIC Act reporting status.",
        "isCorrect": false
      }
    ],
    "explanation": "The needs analysis (Code of Conduct, Sec 3(2) & 8) is the foundation for 'suitability'. A key component of this analysis is determining the client's 'risk tolerance' (their willingness and capacity to take risks) so that the recommended product's risk profile can be matched to it.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 398,
    "questionText": "A Representative advises on a life policy but fails to adequately explain the impact of increasing premiums over time. This indicates a breach of the Fit and Proper requirement related to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (Product Knowledge).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (FAIS Act, Sec 13(1)) includes having detailed 'product knowledge'. Failing to understand or explain a material aspect of the product, like its premium structure, is a failure of this product knowledge and a breach of the competence requirement.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 399,
    "questionText": "A defined contribution retirement fund is a financial product where the client bears the primary risk of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier defaulting on a guarantee.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Investment returns being lower than expected.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP being shut down by the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative providing poor advice.",
        "isCorrect": false
      }
    ],
    "explanation": "In a 'defined contribution' fund, the contributions are fixed, but the final benefit is *not* guaranteed. The benefit depends entirely on the investment performance of the underlying assets. Therefore, the *client* (the member of the fund) bears the full investment risk.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 400,
    "questionText": "In terms of disclosure, the Representative must clearly state whether they are acting as a representative of the FSP or as an independent financial adviser. This informs the client of the nature of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Remuneration received.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Relationship with the FSP.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD hours completed.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) requires disclosure of the FSP's status. This includes disclosing the nature of the representative's relationship with the FSP and any relationship the FSP has with product suppliers (e.g., if they are tied or independent). This helps the client understand potential biases.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 401,
    "questionText": "Mr. Khumalo, an employee of a licensed FSP, is compiling and submitting a client's application form for an investment policy. This specific activity, without providing any recommendation, is classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Intermediary service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Factual information provision.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Excluded business.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'Intermediary Service' as any act *other than advice* that results in a client entering into a financial product. Assisting with or submitting an application form is a clear example of an intermediary service.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 402,
    "questionText": "A Representative is appointed on 1 July 2024 to advise on an Investment Linked Policy (Tier 1). If they fail to pass the RE5 by 30 June 2026, which ONE of the following actions must the FSP take?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Transfer them to an administrative role.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately remove them from the Representative register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Allow them an automatic 3-month extension.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Allow them to continue under increased supervision.",
        "isCorrect": false
      }
    ],
    "explanation": "The deadline (FAIS Act, Sec 13(1)(a)) is 24 months (two years) from the date of first appointment. 30 June 2026 is the last day of this period. If the representative fails to pass by this date, they no longer meet the 'Competence' requirement, are not Fit and Proper, and must be immediately debarred and removed from the register.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 403,
    "questionText": "Which ONE of the following statements best describes the primary purpose of the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To ensure tax compliance for all financial institutions.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To set minimum product pricing for financial products.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "To regulate market conduct, establish professional standards, and protect clients.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "To guarantee all client investments and deposits.",
        "isCorrect": false
      }
    ],
    "explanation": "The primary purpose of the FAIS Act is to regulate the *market conduct* of FSPs. It does this by setting professional standards (like the Fit and Proper requirements) and providing a Code of Conduct, all aimed at ensuring the fair treatment and protection of clients (consumers).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 404,
    "questionText": "An FSP's license requires it to ensure all representatives have valid professional indemnity cover. This forms part of the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "Professional Indemnity (PI) insurance is a key risk management control. The requirement to have such controls and risk-mitigation measures in place falls under the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) to manage its business and protect clients.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 405,
    "questionText": "Which of the following activities is excluded from the definition of a 'financial service' under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Advising a client on the merits of two different unit trusts.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Providing a client with a written recommendation for a replacement policy.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Providing advice on the client's current retirement tax liability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Rendering intermediary services on a long-term insurance policy.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1 Definitions) regulates advice on *financial products*. While tax advice may be financial in nature, it is generally considered a separate professional service (e.g., by a tax practitioner) and is excluded *unless* it is given in the context of advising on a financial product.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 406,
    "questionText": "If the FSCA withdraws an FSP's license due to critical non-compliance, which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP must pay a fine to the FSCA and can then continue operating.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must immediately stop rendering all financial services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP must transfer all clients to another FSP within 24 hours.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP must appeal the decision to the FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The withdrawal of a license (FAIS Act, Sec 14) means the FSP is no longer authorized. The immediate and mandatory consequence is that the FSP must cease all regulated financial services activities. It cannot legally operate without a license.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 407,
    "questionText": "A **Category II** FSP is licensed to provide:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only intermediary services.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Discretionary financial services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only advice on Category I products.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Advice on Tier 2 products only.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines the FSP license categories. Category II is a specialist license for FSPs that manage client assets on a *discretionary* basis (i.e., they have a mandate to make investment decisions on behalf of the client without prior approval for each transaction).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 408,
    "questionText": "A Representative renders financial services related to a Tier 2 product. If they later decide to move to a Tier 1 product, what regulatory requirement immediately changes?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The minimum record-keeping period increases to 10 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "They are required to pass the RE5 examination.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "They must be appointed as a Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's license automatically extends to Category II.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) for Tier 2 products exempt the representative from the RE5. However, the moment they are appointed to render services for a Tier 1 product, this exemption falls away, and they become subject to the requirement to pass the RE5 (usually within 24 months of that new appointment).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 409,
    "questionText": "A Representative is found to have falsified their Continuous Professional Development (CPD) records during an audit. This act is a breach of which core Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      }
    ],
    "explanation": "While CPD itself relates to 'Competence', the act of *falsifying* records is an act of fraud and deceit. This is a severe breach of the 'Honesty and Integrity' requirement (Fit & Proper, Sec 7) and would likely lead to debarment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 410,
    "questionText": "The FSP is required to appoint a Compliance Officer whose primary role is to assess and report on the FSP's adherence to regulatory requirements. This is a measure to reinforce the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability (Governance).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "A compliance function is a key governance and internal control structure. The requirement to have this function (either internal or external) falls under the 'Operational Ability' pillar (FAIS Act, Sec 8(1)(d)), which covers the FSP's ability to govern and control its operations compliantly.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 411,
    "questionText": "A Representative appointed under supervision must receive adequate guidance and training. Which ONE of the following statements is correct regarding the supervisor?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The supervisor must be the FSP's external Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The supervisor must have at least 10 years of experience.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The supervisor must be a Key Individual or a competent Representative delegated by the KI.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The supervisor must be an external auditor.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 25) state that supervision must be carried out by a person who is 'competent' to do so. This is typically the FSP's Key Individual or another senior, competent representative who has been formally delegated this task by the KI.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 412,
    "questionText": "An FSP fails to have an up-to-date and easily accessible register of all its Representatives. This is a breach of which Fit and Proper pillar?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "Maintaining the representative register is a key administrative and compliance-monitoring duty (FAIS Act, Sec 13). The systems and processes for maintaining this register fall under the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 413,
    "questionText": "What is the primary objective of the **Continuous Professional Development (CPD)** requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To increase the FSP's profit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To ensure Representatives maintain and update their required professional knowledge and skills.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "To pay the annual FSCA levy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "To avoid debarment for honesty reasons.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is the mechanism for ensuring *ongoing* competence. Its primary objective is to ensure that representatives stay current with changes in legislation, products, and the market, thereby maintaining their professional knowledge and skills to serve clients properly.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 414,
    "questionText": "The Fit and Proper requirements regarding **Honesty and Integrity** apply to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only the FSP entity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP, its Key Individuals, and all Representatives.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only the clients.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(a)) is clear that the Fit and Proper requirements, including Honesty and Integrity, apply to the FSP as an entity, its Key Individuals (as its 'mind and management'), and all of its appointed Representatives who render financial services.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 415,
    "questionText": "If a Representative is removed from the FSP register for non-compliance (debarment), what is the FSP's primary regulatory obligation regarding the public record?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP must publish the debarment in a national newspaper.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must inform the FSCA immediately and update its register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP must inform the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP must ensure the representative keeps all client files.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's internal register and the FSCA's central public register must be aligned. Upon debarment (FAIS Act, Sec 14), the FSP must immediately update its own register (Sec 13) and immediately notify the FSCA so the central (public) register can also be updated.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 416,
    "questionText": "The requirement that an FSP maintains sufficient financial resources to absorb potential losses is defined as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Client Liquidity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the definition of 'Financial Soundness' (Fit & Proper, Sec 4). It includes capital adequacy requirements, which ensure the FSP has a financial buffer to absorb unexpected losses and remain solvent, thus protecting clients.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 417,
    "questionText": "A Representative recommends a product that will achieve the client's long-term objective but has a very high, immediate liquidity penalty. The Representative failed to consider the client's short-term financial situation, breaching the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Disclosure of remuneration.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suitability and needs analysis.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Record keeping.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Conflict of Interest disclosure.",
        "isCorrect": false
      }
    ],
    "explanation": "A 'needs analysis' (General Code, Sec 7 & 8) must be holistic. It's not just about the long-term goal; it must also consider the client's 'financial situation', which includes their short-term liquidity needs. Recommending an illiquid product to someone who needs cash soon is a failure of the suitability analysis.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 418,
    "questionText": "The Representative's Status Disclosure must include the FSP's license number. This is required to allow the client to verify the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Regulatory status with the FSCA.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tax compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD completion.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Status Disclosure' (General Code, Sec 3(1)(a) & Sec 4) must include the FSP's unique FSP license number. This allows the client to go to the FSCA website and verify that the FSP is legitimate and what it is licensed for, thus confirming its 'regulatory status'.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 419,
    "questionText": "An FSP's Conflict of Interest Management Policy must include steps for **disclosure**. This means the FSP must inform the client about the nature of the conflict and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The commission earned on the product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "How the FSP manages the conflict to mitigate harm.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client's right to cancel the policy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's tax returns.",
        "isCorrect": false
      }
    ],
    "explanation": "Simple disclosure of a conflict is not enough. The Code of Conduct (Sec 3(1)(c)) requires the disclosure to be meaningful, allowing the client to make an informed decision. This includes explaining what steps the FSP is taking to *mitigate* the conflict and ensure the advice remains fair.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 420,
    "questionText": "If replacement advice is given, the Representative must clearly state the potential disadvantages and costs associated with the new product, particularly concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's staff turnover.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Increased fees and loss of vested rights from the original product.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Representative's CPD status.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's relationship with the Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The replacement advice rules (General Code, Sec 7(2)) are designed to protect clients from being harmed by a switch. The representative *must* do a detailed comparison and explicitly disclose all potential negative consequences, such as new fees, penalties on the old product, and loss of vested rights or benefits.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 421,
    "questionText": "Which ONE of the following statements is correct regarding communication with a client?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "All communication must be highly technical to be compliant.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "All communication must be factual, clear, and not misleading.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "All communication must be verbal only.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "All communication must be pre-approved by the Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a core principle of disclosure under the General Code of Conduct (Sec 4(1)). All communications, marketing, and advice must be 'factual, clear, and not misleading' to allow clients to make informed decisions.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 422,
    "questionText": "The Code of Conduct requires that the Representative must act with **due care, skill, and diligence**. This applies primarily to the quality and basis of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSP's compliance report.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Client's personal tax.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial service provided.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Representative's salary.",
        "isCorrect": false
      }
    ],
    "explanation": "This core principle (General Code, Sec 2 & 7) is the overarching professional standard. It applies to *all* aspects of the 'financial service provided', from the initial needs analysis and advice to the disclosures and record keeping.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 423,
    "questionText": "The FSP must ensure that its electronic records are protected against unauthorized access and alteration. This requirement is necessary to ensure the **integrity** of the records for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal use.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Regulatory inspection.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing purposes.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product supplier review.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requires that records be secure. This ensures their 'integrity' (that they are true and unaltered). This is vital for regulatory inspection, as the FSCA or Ombud must be able to rely on the records as a true account of what happened.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 424,
    "questionText": "If an FSP, after 6 years, legally destroys records of advice, which legislative duty has the FSP fulfilled?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Promotion of Access to Information Act (PAIA).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Minimum record keeping period.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18) mandates a *minimum* retention period of 5 years. By keeping the records for 6 years, the FSP has successfully fulfilled this minimum legal obligation. (Note: POPIA may require destruction, but the FAIS duty is about the minimum period).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 425,
    "questionText": "The record of advice must include a statement that the client has been made aware of the **status** of the FSP and the Representative. This is to demonstrate compliance with the duty to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Keep a physical record.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclose material information.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Update the Representative Register.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Avoid conflicts of interest.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Record of Advice' (Code of Conduct, Sec 3(4)) must document that all mandatory disclosures were made. The 'Status Disclosure' (Sec 4) is a key material disclosure. The record must therefore contain proof that this disclosure was provided to the client.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 426,
    "questionText": "The FSP is required to keep a register of all its Key Individuals and Representatives, detailing their mandates and the financial services they are authorized to render. This register is a key record that must be kept for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "The representative register is a critical compliance record. Under the FAIS Act (Sec 18) and Code of Conduct (Sec 3(4)), all records related to the FSP's compliance, including its register of appointments and mandates, must be kept for a minimum of 5 years.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 427,
    "questionText": "Who is ultimately responsible for ensuring that all client records are maintained correctly for the minimum required period, even if the task is delegated?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP and the Key Individual.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The client.",
        "isCorrect": false
      }
    ],
    "explanation": "The legal obligation for record keeping (FAIS Act, Sec 18) rests with the licensed entity, the FSP. The Key Individual, as the person responsible for managing and overseeing the FSP's 'Operational Ability' (which includes record keeping), is ultimately accountable for ensuring this obligation is met.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 428,
    "questionText": "A client refuses to provide the necessary documents for identity verification during the onboarding process. Which ONE of the following actions must the FSP take?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Proceed with the transaction but file an STR.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Offer the client a discount.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Refuse to establish the business relationship.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Ask the FSP's CEO to verify the identity.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21) is clear: if an FSP cannot perform the required Customer Due Diligence (CDD), it is *prohibited* from establishing the business relationship or concluding a single transaction. The client's refusal to provide documents is a hard stop.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 429,
    "questionText": "A Representative notices a client making a complex, illogical series of transfers between multiple unrelated accounts. The Representative must file a Suspicious Transaction Report (STR) based on:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The mandatory cash threshold.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A reasonable suspicion of criminal activity (e.g., money laundering).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client's high net worth.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The transaction being a Tier 1 product.",
        "isCorrect": false
      }
    ],
    "explanation": "The trigger for an STR (FIC Act, Sec 29) is 'suspicion'. It is not tied to a monetary amount. A complex and illogical series of transactions that serve no apparent economic purpose is a classic red flag for money laundering (attempting to obscure the source of funds). This suspicion mandates the filing of an STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 430,
    "questionText": "The **Risk-Based Approach (RBA)** requires that the FSP identifies and assesses money laundering and terrorist financing risks arising from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only cash transactions.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP's clients, products, delivery channels, and geographic areas.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only the FSP's marketing budget.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Product Supplier's annual report.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) is a comprehensive risk assessment. The FSP must analyze all aspects of its business, including its client base, the products it sells, the delivery channels it uses (e.g., face-to-face vs. online), and the geographic locations it deals with, to identify its specific ML/TF risks.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 431,
    "questionText": "What is the penalty for a Representative who is found guilty of tipping off a client that a STR has been filed?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Suspension of their CPD requirements.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Criminal liability (fine or imprisonment).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A warning from the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A mandatory re-write of the RE5.",
        "isCorrect": false
      }
    ],
    "explanation": "Breaching the 'Tipping-Off Prohibition' (FIC Act, Sec 29(3)) is a serious criminal offence. An individual found guilty of this is subject to severe criminal penalties, which can include imprisonment for up to 15 years or a fine of up to R100 million.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 432,
    "questionText": "A client is a company where the Key Individual has reason to believe a non-executive director holds ultimate control. The FSP must apply Enhanced Due Diligence (EDD) to verify the identity of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Beneficial Owner.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "External Auditor.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21B) requires the FSP to 'look through' the company to find the 'Beneficial Owner'—the natural person with ultimate control. If the KI believes this is the director, the FSP must apply its CDD (and likely EDD, given the complexity) to verify that director's identity as the BO.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 433,
    "questionText": "If the FIC imposes an administrative sanction on an FSP, the FSP has the right to appeal the decision to the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "High Court.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Services Tribunal (FST).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Board of Directors.",
        "isCorrect": false
      }
    ],
    "explanation": "The Financial Services Tribunal (FST) was established by the FSR Act as the single appeal body for decisions made by financial sector regulators, including the FIC. An FSP aggrieved by an administrative sanction (Sec 45B) from the FIC can apply to the FST for a reconsideration.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 434,
    "questionText": "The FSP's **RMCP** must be a comprehensive document that is routinely subjected to testing. Choose the best answer describing the purpose of this testing.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To ensure the RMCP is profitable.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To ensure the RMCP is aligned with the FSP's marketing.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "To ensure the RMCP is adequate and effective in mitigating ML/TF risks.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "To ensure the RMCP is as short as possible.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) is the FSP's 'program' for fighting financial crime. The FSP must regularly test this program to ensure its internal controls are *adequate* (i.e., cover all risks) and *effective* (i.e., are working in practice) to mitigate the FSP's ML/TF risks.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 435,
    "questionText": "The FSP must respond to a written complaint and include information regarding the client's right to refer the matter to the FAIS Ombud. This must be done in:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The final written response.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The annual FSP report.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A media statement.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The initial verbal acknowledgement.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16) and Ombud Rules require the FSP's *final written response* to a complaint to be comprehensive. It must state the FSP's decision, provide reasons, and explicitly inform the client of their right to escalate the complaint to the FAIS Ombud, including the Ombud's contact details.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 436,
    "questionText": "If a client refers a complaint to the FAIS Ombud because the FSP failed to respond within six weeks, the Ombud will typically first attempt to resolve the matter through:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Mediation or conciliation.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "A binding court order.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A criminal investigation.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "An immediate debarment of the Representative.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud's process (Rule 3) is designed to be informal and expeditious. The Ombud will first try to resolve the dispute through alternative dispute resolution methods like mediation or conciliation. Only if this fails will the Ombud proceed to a full investigation and formal determination.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 437,
    "questionText": "Which scenario is **NOT** within the FAIS Ombud's jurisdiction?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A client complaining that an FSP charged excessive advisory fees that were not disclosed.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A client complaining about market losses due to poor economic performance, where the advice was suitable.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A Representative failing to disclose a conflict of interest.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A Representative providing negligent advice.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud's jurisdiction (FAIS Act, Sec 27) covers *contraventions of the Act*. Poor market performance is not a contravention; it is an inherent risk of investing. The Ombud will not investigate complaints about investment performance *unless* it was caused by a FAIS breach (e.g., unsuitable advice or misrepresentation).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 438,
    "questionText": "If the client receives the FSP's final response on 1 July, and waits until 1 February of the next year to contact the Ombud, the Ombud will likely decline to investigate the matter due to the expiry of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "7-day review period.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "6-week internal resolution period.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "6-month referral deadline.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "1-year cooling-off period.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(3)) set a 6-month (six-month) prescription period for lodging a complaint. This period starts from the date of the FSP's final response. 1 February is 7 months after 1 July, so the client has missed the 6-month deadline.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 439,
    "questionText": "A Final Determination by the FAIS Ombud is legally binding on the FSP and Representative, provided neither party takes the decision on appeal to the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Services Tribunal (FST).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "High Court.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination (FAIS Act, Sec 28(5)) is binding *unless* it is appealed. The correct and only appeal route for a decision by the Ombud is to apply for a reconsideration to the Financial Services Tribunal (FST).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 440,
    "questionText": "The FAIS Ombud’s authority is limited by its monetary limit. This limit ensures that disputes involving very high financial claims are referred to the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "FIC.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Civil courts.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Key Individual.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud (FAIS Act, Sec 27(3)) is designed for quick, informal resolution and has a monetary cap (R800,000). Claims for damages that exceed this amount are considered too large and complex for this process and must be pursued through the formal civil court system.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 441,
    "questionText": "A Key Individual (KI) fails to conduct an annual review of the FSP's internal **Conflict of Interest Management Policy**. This is a failure to comply with the KI's duty regarding:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity controls (Operational Ability).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence (CPD).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Record Keeping.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI (Sec 17(1)) is responsible for the FSP's 'Operational Ability', which includes its internal compliance controls. The Conflict of Interest policy is a key control for ensuring 'Honesty and Integrity'. Failing to review this policy is a failure of the KI's oversight of these operational controls.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 442,
    "questionText": "The KI must meet the Fit and Proper requirements for **Honesty and Integrity**. This includes the duty to ensure that the FSP acts with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Maximum profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Due care and diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "High political influence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Minimal disclosure.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's duty of 'Honesty and Integrity' is not just about not stealing. It's about ensuring the FSP's entire operation is run ethically and professionally, which includes the duty (from the Code of Conduct) to act with 'due care, skill, and diligence' in all client dealings.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 443,
    "questionText": "A Key Individual must take reasonable steps to ensure that every Representative acts within:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The scope of the FSP’s license and the Representative’s mandate.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's geographical area.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The KI's direct physical presence.",
        "isCorrect": false
      }
    ],
    "explanation": "A core oversight duty of the KI (FAIS Act, Sec 13(1)) is to manage the representatives. This includes having controls to ensure that representatives only render services that are *within* the FSP's license and *within* their own personal, documented mandate.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 444,
    "questionText": "The KI is responsible for overseeing that the FSP's annual compliance report is prepared by the Compliance Officer. This report primarily covers the FSP's adherence to the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Labour Relations Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "FAIS Act and General Code of Conduct.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Income Tax Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Company’s internal marketing strategy.",
        "isCorrect": false
      }
    ],
    "explanation": "The annual compliance report (FAIS Act, Sec 19(2)) is a specific report *to the FSCA* detailing the FSP's compliance *with the FAIS Act*. The KI is responsible for this report, which details adherence to the Act and its subordinate legislation, like the General Code of Conduct.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 445,
    "questionText": "The KI must ensure the FSP has adequate systems and controls for client communication and disclosure. This is an element of the KI's oversight of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight (Sec 17(1)) of 'Operational Ability' covers all internal processes. This includes ensuring the FSP has effective systems and controls to manage the client communication and disclosure processes, as required by the Code of Conduct.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 446,
    "questionText": "Which of the following products is typically classified as a **Tier 2** product, meaning the representative is exempt from the RE5 examination?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A Complex Investment in Offshore Bonds.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An investment in a local Unit Trust.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A simple funeral policy.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A derivative contract.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) and Fit & Proper rules classify products by complexity. Tier 2 products are simple and low-risk. A funeral policy (Subcategory 1.1) is the primary example of a Tier 2 product, and representatives advising *only* on these are exempt from the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 447,
    "questionText": "A Representative fails to explain the effect of **inflation** on a client's long-term investment plan. This omission breaches the duty to provide advice with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Due care, skill, and diligence (Suitability).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "Providing suitable advice (Code of Conduct, Sec 3(2) & 8) requires 'due care, skill, and diligence'. Inflation is a material risk that erodes the future value of money. Failing to explain this risk in a long-term plan is a failure of diligence and results in the advice being unsuitable, as the client's objective (real returns) may not be met.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 448,
    "questionText": "A Representative must have specific product knowledge to ensure the advice given is appropriate and complies with the requirements for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Product knowledge is a key component of 'Competence' (FAIS Act, Sec 13(1)). A representative cannot be deemed competent to provide advice if they do not have adequate knowledge of the specific products they are mandated to advise on.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 449,
    "questionText": "Which risk refers to the possibility that the issuer of an investment product may be unable to meet its financial obligations?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Credit Risk (or Default Risk).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Credit Risk', also known as 'Default Risk', is the specific risk that the entity you have invested in (the issuer or product supplier) will default on its obligations and be unable to pay back your capital or interest (e.g., a company issuing a bond goes bankrupt).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 450,
    "questionText": "The Representative must disclose all material information regarding the financial product. Which of the following is NOT considered a material disclosure?\n\ni. All fees, charges, and commissions.\nii. The Product Supplier's head office address.\niii. Any significant risks or exclusions.\niv. The name of the Product Supplier's CEO.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "iv only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i, ii, and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "ii and iv only",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) mandates the disclosure of all *material* information. This includes fees (i) and risks (iii). While the supplier's contact details are required, the specific head office address (ii) is less material than its name and contact number. The name of the CEO (iv) is not a material disclosure for the client's decision.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 451,
    "questionText": "Mr. Dube, a Representative, accepts a client's instruction to purchase a specific share without offering any recommendation or guidance. This transaction is classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An intermediary service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Excluded advice.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A conflict of interest.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1 Definitions) distinguishes 'advice' (recommending) from 'intermediary services' (acting on instruction). When a representative simply 'executes an instruction' from a client without any recommendation, this is an intermediary service, often referred to as 'execution of sales'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 452,
    "questionText": "A Representative must pass the RE5 within two years of their date of first appointment. The primary reason for this deadline is to ensure the Representative meets the **Fit and Proper** requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence (Regulatory Knowledge).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit and Proper requirements (FAIS Act, Sec 13) are based on pillars. The RE5 exam is the specific tool used to test and prove a representative's 'Competence' in relation to their understanding of the regulatory framework (the FAIS Act, Code of Conduct, etc.).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 453,
    "questionText": "Which entity is **required** to be licensed as an FSP under the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A company providing advice only on funeral benefits.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A media company offering general economic commentary.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A person providing advice on discretionary investment mandates.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A bank providing advice on its own simple banking deposits.",
        "isCorrect": false
      }
    ],
    "explanation": "Discretionary investment mandates (Category II services) are high-risk, complex financial services and are explicitly regulated under the FAIS Act. Options A (Tier 2 products), B (mass media exclusion), and D (Product Supplier exclusion) are often exempt from full FSP licensing or RE requirements.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 454,
    "questionText": "An FSP operating in Category I must ensure it has adequate staff training, compliance systems, and physical resources. This ensures compliance with the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD requirement.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(d)) defines 'Operational Ability' as having all the necessary resources (human, technological, physical, and administrative) and internal controls (like compliance and training) to run the business effectively and compliantly.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 455,
    "questionText": "The overarching principle governing the conduct of FSPs and Representatives, as mandated by the FAIS Act's subordinate legislation, is that they must act:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To maximize their own profit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "With maximum caution.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honestly, fairly, with due care, skill, and diligence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only on the advice of the Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the foundational principle of professional conduct stipulated in the General Code of Conduct (Sec 2). It is the primary duty of all FSPs and representatives in their dealings with clients.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 456,
    "questionText": "An FSP debarred a Representative for dishonesty. What is the FSP's **mandatory** notification duty to the FSCA?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only inform the FSCA at the end of the year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Notify the FSCA immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Wait for the Representative to appeal the decision.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Inform the client only.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) is unequivocal. When an FSP debars a representative (especially for dishonesty), it *must* 'immediately' notify the FSCA of the debarment and the reasons for it. This ensures the central register is updated and the debarred person cannot simply move to another FSP.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 457,
    "questionText": "A Representative is explicitly not required to write the RE5 examination if they are appointed only to render financial services for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tier 1 products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Complex derivatives.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Tier 2 financial products only.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Category II products.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) for the RE5 exam are linked to product complexity. The RE5 is for Tier 1 products. Representatives who *only* render services for Tier 2 products (e.g., funeral policies, health benefits) are explicitly exempt from this requirement.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 458,
    "questionText": "The FSP must ensure that all its activities comply with the **General Code of Conduct**. This code is a form of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Voluntary guideline.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Subordinate legislation under the FAIS Act.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing material.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "External audit report.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act is the primary Act. The General Code of Conduct is 'subordinate legislation' issued *under* the authority of the FAIS Act. It has the full force of law, and a breach of the Code is a breach of the Act.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 459,
    "questionText": "A Key Individual (KI) knowingly allows a debarred Representative to continue rendering services under a different name. This is a severe breach of the FSP's and KI's requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability (Supervision).",
        "isCorrect": false
      }
    ],
    "explanation": "Allowing a debarred person to render services is illegal. Doing so knowingly and using a false name is an act of extreme dishonesty and fraud. This is a severe violation of the 'Honesty and Integrity' requirement (Fit & Proper, Sec 7) for both the KI and the FSP.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 460,
    "questionText": "The FSP's **Operational Ability** requires that the FSP maintains adequate technical resources. This includes:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal car.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Up-to-date hardware and software systems for record keeping.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's annual audit report.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The KI's qualification certificate.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having the necessary 'technical resources' (e.g., IT systems) to run the business. This means having functional and secure hardware and software to perform key tasks like record keeping and client communication.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 461,
    "questionText": "A Representative needs to complete their experience under supervision to be fully competent. The maximum statutory period for this supervision for a specific product category is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years (60 months).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 22) set the rules for supervision. While the *minimum* experience might be 1 year, the *maximum* time a representative is allowed to remain under supervision for a specific product category is 60 months (5 years).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 462,
    "questionText": "The FSP must have a proper system of internal control to manage its business risks. This is a key measure to ensure the FSP's compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "A 'system of internal control' is the core of 'Operational Ability' (FAIS Act, Sec 8(1)(d)). This requirement ensures the FSP has the governance, risk management, and compliance processes in place to manage its business and associated risks effectively.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 463,
    "questionText": "The requirement for a Representative to meet **Continuous Professional Development (CPD)** obligations is designed to ensure that the Representative maintains their:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Regulatory knowledge.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Personal integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Marketing skills.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is the mechanism for maintaining 'Competence'. Its purpose is to ensure that representatives stay up-to-date with changes in the regulatory environment, product developments, and market trends, thus maintaining their professional knowledge.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 464,
    "questionText": "A Representative must be of **'good standing'**. This primarily refers to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Their popularity among clients.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Their credit rating.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Their history of compliance with law and regulations.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Their social status.",
        "isCorrect": false
      }
    ],
    "explanation": "'Good standing' (FAIS Act, Sec 8(1)(a)) is a general term for the 'Honesty and Integrity' requirements. It means the person has a clean record and is not disqualified by, for example, a criminal conviction for dishonesty or a civil judgment related to fraud.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 465,
    "questionText": "If the FSP decides to debar a Representative for dishonesty, the FSP must inform the FSCA. Which ONE of the following statements is correct regarding the immediate result of this action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The individual is entitled to a severance package.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The individual is temporarily suspended from all FSPs.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The individual is prohibited from rendering any financial services as a Representative.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The individual is automatically re-registered as a Key Individual.",
        "isCorrect": false
      }
    ],
    "explanation": "Debarment (FAIS Act, Sec 14) is the formal, legally binding removal of a representative's authorization. Once debarred, the individual is immediately prohibited from rendering any financial services for any FSP, until and unless the debarment is lifted.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 466,
    "questionText": "The FSP must be able to demonstrate that it can meet its liabilities. This is a crucial aspect of the **Financial Soundness** requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP to pay its annual tax bill.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Maintaining the FSP's liquidity and capital adequacy.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Paying the Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Meeting the FIC Act's reporting requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Financial Soundness' requirements (Fit & Proper, Sec 4) are about ensuring the FSP remains a solvent, going concern. This is demonstrated by maintaining sufficient liquidity (cash flow) and capital adequacy (assets over liabilities) to meet all obligations.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 467,
    "questionText": "A Representative is advised by their Key Individual to ensure that the advice given to clients is consistently **suitable**. This means the advice must align with the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Family history.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Political views.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Needs and financial circumstances.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Representative's product preference.",
        "isCorrect": false
      }
    ],
    "explanation": "'Suitability' (General Code, Sec 7 & 8) is the requirement to match the advice and product to the client's specific situation. This is only possible after conducting a needs analysis to understand the client's financial circumstances (affordability, risk profile) and their needs/objectives.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 468,
    "questionText": "A Representative provides a client with a copy of the FSP's license certificate. This action satisfies the requirement for the disclosure of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's tax compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP's legal and regulated status.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's financial soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative's CPD hours.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Status Disclosure' (General Code, Sec 3(1)(a) & Sec 4) requires the FSP to disclose its legal and regulatory status. Providing a copy of the license certificate is a direct way of proving that the FSP is a legally authorized entity and showing what it is authorized *for*.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 469,
    "questionText": "When a conflict of interest is identified, the FSP must, as part of its management policy, seek to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Transfer the conflict to another FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Prioritize the FSP's interests.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Avoid, mitigate, and disclose the conflict.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only record the conflict internally.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(c)) provides a clear hierarchy for managing conflicts. The FSP's policy must first seek to *avoid* conflicts. If they cannot be avoided, the FSP must *mitigate* (reduce the effect of) and *disclose* them clearly to the client.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 470,
    "questionText": "The Code of Conduct requires that the Representative keeps a clear, written record of all advice given, including the needs analysis. This record must be provided to the client:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only at the end of the year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Within 30 days of the transaction.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "As soon as reasonably possible after the advice is given.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only upon the client's written request.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 9) mandates that a 'Record of Advice' must be provided to the client. This must be done 'as soon as reasonably possible' after the advice is rendered, ensuring the client has a timely and accurate record of the recommendation.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 471,
    "questionText": "A Representative must disclose to the client any potential fee, charge, or remuneration to be received. This is a mandatory component of the duty to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative is honest and fair in their dealings.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The client understands the product features.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP's license is valid.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's identity is verified.",
        "isCorrect": false
      }
    ],
    "explanation": "The disclosure of remuneration (General Code, Sec 4) is a key part of transparency and ethical conduct. It ensures the representative is being honest and fair with the client about how they are being paid and what potential conflicts of interest might exist.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 472,
    "questionText": "The FSP is required to provide the client with access to the FSP's internal complaint resolution procedure. This is a key requirement of the Code related to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product supply.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Client relationship management.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1) and Sec 16) places a strong emphasis on fair client relations. Providing clear and accessible information on how to complain is a fundamental part of managing the client relationship fairly and transparently.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 473,
    "questionText": "An FSP's Key Individual (KI) is responsible for ensuring the FSP's records are secure and accessible for the full 5-year period. This is an element of the KI's oversight over:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Record keeping (FAIS Act, Sec 18) is a key internal process and control. The KI is responsible for the FSP's 'Operational Ability', which includes ensuring the systems and processes for record keeping are adequate, secure, and compliant.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 474,
    "questionText": "If a Representative leaves the FSP, the FSP must ensure the preservation of the client records generated by that Representative for the remainder of the minimum:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2-year period.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "5-year period.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "1-year period.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "10-year period.",
        "isCorrect": false
      }
    ],
    "explanation": "The legal duty to maintain records (FAIS Act, Sec 18) rests with the FSP, not the individual. When a representative leaves, the FSP remains the custodian of those records and must continue to store them securely for the full 5-year minimum retention period.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 475,
    "questionText": "The record of advice must include an analysis of **all reasonable steps** taken by the Representative to ensure the product recommended is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The cheapest available.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The most complex.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Suitable to the client's needs.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Guaranteed to perform well.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Record of Advice' (Code of Conduct, Sec 3(4)) is the FSP's primary proof of compliance. A primary requirement of the Code (Sec 8) is 'Suitability'. Therefore, the record must contain the needs analysis and reasoning that demonstrates *why* the product was deemed suitable for that client.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 476,
    "questionText": "A compliance officer finds that records of all client's **needs analyses** from 4 years ago are missing. This is a direct breach of which core regulatory requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FIC Act reporting.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Minimum 5-year record keeping period.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "A needs analysis is a critical part of the 'Record of Advice'. The General Code of Conduct (Sec 3(4)) and FAIS Act (Sec 18) mandate that all such records be kept for a minimum of 5 years. If the records are missing after only 4 years, it is a direct breach of this 5-year rule.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 477,
    "questionText": "When a client's records are accessed by a compliance officer or auditor, the FSP must ensure that the access is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Approved by the client.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Secured, auditable, and documented.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Limited to verbal communication.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Free of charge.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's 'Operational Ability' to manage records (FAIS Act, Sec 18) includes having internal controls over access. Access by compliance or auditors must be documented (to create an audit trail), secure (to protect client data per POPIA), and auditable (to see who accessed what and when).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 478,
    "questionText": "The FSP must carry out the initial Customer Due Diligence (CDD) for a new client to verify their identity. This process is commonly known by which acronym?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "RBA (Risk-Based Approach).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "PEP (Politically Exposed Person).",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "KYC (Know Your Customer).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "STR (Suspicious Transaction Report).",
        "isCorrect": false
      }
    ],
    "explanation": "Customer Due Diligence (CDD) (FIC Act, Sec 21) is the formal legal term for the processes FSPs must follow. In practice, this is universally known as 'Know Your Customer' (KYC), as its purpose is to establish and verify who the customer is.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 480,
    "questionText": "The Key Individual is reviewing the FSP's products and identifies that a specific product is frequently purchased by clients who exhibit high-risk behavioral patterns. This requires the KI to adjust the RMCP by applying:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence (SDD) to that product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A waiver of the Tipping-Off Prohibition.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A higher intensity of controls (RBA).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A mandatory fine.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a direct application of the Risk-Based Approach (RBA) (FIC Act, Sec 42A). The KI has identified a high-risk *product* (or a product used in a high-risk way). The RBA mandates that the FSP's controls must be proportionate to the risk. Therefore, the FSP must apply a higher intensity of controls (like EDD) to clients using this product.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 481,
    "questionText": "The **Tipping-Off Prohibition** under the FIC Act ensures the Representative does not inform the client that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "They are earning a commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A STR has been submitted to the FIC.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's license is valid.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The product is high risk.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Tipping-Off Prohibition' (FIC Act, Sec 29(3)) specifically and only relates to reporting under the FIC Act. It is a criminal offence to inform (tip off) a client that a Suspicious Transaction Report (STR) has been, or will be, filed against them.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 482,
    "questionText": "If a client is classified as a **Politically Exposed Person (PEP)**, the FSP is required to obtain approval from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Senior management of the FSP.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) classifies PEPs as high-risk. Before establishing a business relationship with a PEP, the FSP *must* (as part of Enhanced Due Diligence) obtain approval from its own senior management.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 483,
    "questionText": "Who is responsible for the overall approval and sign-off of the FSP's Risk Management and Compliance Programme (RMCP)?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The external Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Board of Directors or Senior Management.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The newest Representative.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) is the FSP's highest-level control document for AML/CFT. The Act places the ultimate responsibility for approving this programme on the FSP's Board of Directors or, if it has no board, its most senior management.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 484,
    "questionText": "The FIC Act mandates that client identity and transaction records are retained for a minimum period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 20-21) has its own record-keeping rules, separate from FAIS. It also requires that all CDD records and transaction records be kept for a minimum of 5 years from the date of termination of the business relationship.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 486,
    "questionText": "The FSP must respond to a written complaint within six weeks. This period is measured in:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Calendar days.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Working days.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Months.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Years.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(1)) specify 'six weeks'. In regulatory terms, unless 'business days' or 'working days' are specified, the period refers to calendar days (i.e., 42 calendar days).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 488,
    "questionText": "If a client refers a complaint to the Ombud 7 months after the FSP issued its final response, the Ombud must:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Investigate the matter immediately.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Inform the client that the referral is out of time (expired).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Ask the FSP to pay a fine.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Lodge an appeal with the FST.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(3)) set a strict 6-month prescription period. Since 7 months have passed, the complaint is 'out of time' or 'prescribed'. The Ombud will inform the client that it no longer has jurisdiction to hear the complaint, unless the client can prove exceptional circumstances for the delay.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 489,
    "questionText": "The FSP and Representative must comply with the FAIS Ombud's Final Determination. If they fail to comply, the determination can be enforced as if it were a decision of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "National Consumer Commission.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "High Court.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 28(5)) gives the Ombud's determination its legal power. If not appealed, it is 'deemed to be a civil judgment' of a court. This means the client can use the determination to apply for a writ of execution, just as if they had a High Court judgment.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 490,
    "questionText": "The FAIS Ombud’s authority to investigate a complaint ceases if the claim amount exceeds the set:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax threshold.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Administrative sanction limit.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Monetary limit (jurisdictional limit).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Client age limit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(3)) places a 'monetary limit' (currently R800,000) on the Ombud's jurisdiction. If the client's claim for financial loss exceeds this amount, the Ombud does not have the authority to investigate the complaint.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 491,
    "questionText": "The KI must ensure the FSP has adequate systems for the ongoing monitoring of compliance with the **FIC Act**. This is a measure to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight (Sec 17(1)) covers compliance with *all* applicable laws. The systems and controls for monitoring FIC Act compliance are part of the FSP's 'Operational Ability' (its internal control framework), which the KI is responsible for managing.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 492,
    "questionText": "A Key Individual's responsibility includes managing the FSP's compliance with the FAIS Act. This duty is derived from their appointment to oversee the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSP’s annual tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial services rendered by the FSP and its Representatives.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product Supplier’s manufacturing process.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "External audit process.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines the KI as the person responsible for the 'management and oversight' of the FSP's activities *related to the rendering of financial services*. This is their specific, regulated domain of responsibility.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 493,
    "questionText": "The KI discovers that a Representative is advising clients on a product category for which the Representative is not mandated. The KI is required to take immediate action to ensure the Representative:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Transfers the client to another FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Ceases providing services in that unmandated category.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Receives a higher commission.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Notifies the FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's duty of oversight (Sec 13(1)) includes ensuring representatives *only* act within their mandate. If a KI discovers a representative acting 'out of scope', they must take immediate corrective action to stop the non-compliant behaviour, which means forcing them to cease those services.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 494,
    "questionText": "The KI must ensure that the FSP’s annual compliance report includes confirmation that all representatives have met the necessary:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Fit and Proper requirements.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Personal financial goals.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Marketing qualifications.",
        "isCorrect": false
      }
    ],
    "explanation": "The annual compliance report (Sec 19(2)) is the KI's formal attestation to the FSCA that the FSP is compliant. A key part of this is confirming that the FSP has a process to monitor its representatives and that they all meet the ongoing 'Fit and Proper requirements' (Honesty, Competence, etc.).",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 495,
    "questionText": "The KI must ensure the FSP has adequate systems for the ongoing monitoring of compliance with the Fit and Proper requirements. This is a measure to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (Sec 17(1)) is to ensure the FSP's 'Operational Ability' is sound. This includes having the necessary systems, processes, and internal controls to *monitor* its own compliance, including the ongoing Fit and Proper status of its staff.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 496,
    "questionText": "Which license category is required for an FSP that manages client portfolios on a **discretionary basis** (making investment decisions on the client's behalf)?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Category I.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Category II.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Category III.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Tier 2.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) defines the license categories. Category I is for non-discretionary advice. Category II is specifically for FSPs that render 'discretionary' financial services, where they have a mandate to manage the client's assets.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 497,
    "questionText": "The Code of Conduct requires the Representative to obtain sufficient information about the client's current **financial situation**. This includes details on the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Employment history.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Assets, liabilities, and income.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marital status only.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Favourite color.",
        "isCorrect": false
      }
    ],
    "explanation": "A core part of the needs analysis (Code of Conduct, Sec 3(2) & 8) is to understand the client's 'financial situation'. This is necessary to determine their risk capacity and affordability, and it requires information on their assets, liabilities, income, and expenses.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 498,
    "questionText": "A Representative has met the competence requirements for Category I but gives advice that is materially wrong because they failed to update their product knowledge on a new type of Collective Investment Scheme. Which Fit and Proper element is breached?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence (Ongoing Knowledge).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (FAIS Act, Sec 13(1)) is not just about passing exams; it's an ongoing duty. This includes having up-to-date 'product knowledge'. Giving incorrect advice due to a lack of current product knowledge is a breach of the ongoing competence requirement.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 499,
    "questionText": "When a Representative explains a financial product to a client, they must ensure the client understands the product's **volatility**. Volatility is an indicator of the product's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Liquidity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Credit rating.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Risk profile.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Minimum investment period.",
        "isCorrect": false
      }
    ],
    "explanation": "'Volatility' is a measure of how much a product's value is likely to fluctuate (go up and down). It is a primary indicator of the product's 'risk profile'. A highly volatile product is considered high-risk.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 500,
    "questionText": "The Representative must disclose the existence of any fees or charges that are levied by the FSP itself (e.g., advisory fees). This is required to ensure the client understands the full cost of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product Supplier's services.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Representative’s training.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial service.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 4(1)) requires disclosure of *all* costs. This includes the product costs (from the supplier) and any separate fees charged by the FSP for the 'financial service' (e.g., the advice or administration). This ensures the client understands the total cost.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 501,
    "questionText": "Ms. Naidoo, a Representative, recommends that a client switches their current long-term policy to a competitor's policy because it has lower fees. Which ONE of the following statements is correct regarding this action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "This action is classified as an intermediary service only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "This action is classified as financial advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "This action is classified as product supply.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "This action is classified as factual information.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'advice' as any 'recommendation, guidance or proposal of a financial nature'. Recommending a 'switch' (which is also replacement advice) is a clear recommendation to take a specific financial action and is therefore classified as 'financial advice'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 502,
    "questionText": "If a Representative fails to pass the RE5 exam within the two-year deadline, the mandatory consequence is removal from the register. This is required to maintain the Representative's compliance with the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness requirement.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability requirement.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence requirement.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity requirement.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 exam is a specific test of regulatory knowledge, which is a key component of the 'Competence' pillar of the Fit and Proper requirements (FAIS Act, Sec 13(1)(a)). Failure to pass the exam means the representative fails to meet the competence requirement.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 503,
    "questionText": "A company sells a simple insurance policy but specifically excludes any advice, only executing the client's instructions. The company is primarily acting as a Product Supplier. Which statement is generally correct regarding its FSP status?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It must have a Category I license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It is not required to be licensed as an FSP.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It must have a Category II license.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It must submit the RE5 for its directors.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides exemptions. A 'Product Supplier' (like an insurer) that provides factual information on its *own* products and does not provide advice or intermediary services (other than, for example, issuing the policy) is generally not required to be licensed as an FSP for that activity.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 504,
    "questionText": "The FSP must ensure that its compliance systems are regularly updated to reflect new legislation. This is an element of the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes its internal control and compliance systems. This is not a static requirement; the FSP must have the operational capacity to monitor legislative changes and update its systems and processes accordingly.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 505,
    "questionText": "The FAIS Act's goal of promoting the integrity of the financial services industry is primarily achieved through the implementation of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The National Credit Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Tax legislation.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Fit and Proper requirements.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Employment equity legislation.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8) promotes integrity and professionalism by mandating that all FSPs, KIs, and Representatives must meet and maintain strict 'Fit and Proper' requirements, which cover Honesty & Integrity, Competence, Financial Soundness, and Operational Ability.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 506,
    "questionText": "A Representative is temporarily suspended by the FSP pending a compliance investigation. The FSP's mandatory duty to the FSCA is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only inform the FSCA if the suspension lasts more than 6 months.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Notify the FSCA immediately, stating the reasons.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Inform the FAIS Ombud only.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Pay the Representative's salary during the suspension.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) requires an FSP to *immediately* notify the FSCA (the Authority) of any decision to suspend a representative, even temporarily. This notification must include the reasons for the suspension.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 507,
    "questionText": "The primary audience for the RE5 Regulatory Examination includes Representatives in all FSP Categories, with the exclusion of those who render services for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "All Category I products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Tier 1 financial products.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Tier 2 financial products only.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Category II products.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 is the regulatory exam for Representatives. The competence requirements (FAIS Act, Sec 13) state that this exam is mandatory for representatives advising on 'Tier 1' (complex) products. Representatives who advise *only* on 'Tier 2' (simple) products are exempt from the RE5.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 508,
    "questionText": "The FSP must update its register of Representatives to accurately reflect the financial services the Representative is mandated to provide. This is essential to ensure that the Representative acts within their defined:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Sales target.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Scope of authority.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Personal integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Office location.",
        "isCorrect": false
      }
    ],
    "explanation": "The representative register (FAIS Act, Sec 13) is the official record of a representative's 'mandate' or 'scope of authority'. It must be kept accurate to ensure the representative does not provide advice on products they are not competent or authorized to advise on.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 509,
    "questionText": "A Key Individual (KI) is found to have a history of frequent, unexplained changes in employment and previous findings of professional misconduct. This is most likely to affect the KI's compliance with the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) for 'Honesty and Integrity' look at a person's character and 'good standing'. A volatile or unstable professional history, especially one that includes findings of misconduct, is a red flag suggesting a lack of the diligence, reliability, and integrity required for a senior management role like a KI.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 510,
    "questionText": "The FSP must have a documented process for the formal delegation of duties to Representatives, outlining who is responsible for supervision. This relates to the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes its internal governance, controls, and human resource management. A formal, documented process for delegation and supervision is a key internal control to manage representatives and ensure compliance.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 511,
    "questionText": "A Representative under supervision must complete their required experience within the 5-year maximum period. The main purpose of the supervision period is to allow the Representative to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Earn a higher salary.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Sell complex products without oversight.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Gain practical experience under guidance.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Take continuous professional development (CPD) leave.",
        "isCorrect": false
      }
    ],
    "explanation": "Supervision (Fit & Proper, Sec 22) is the mechanism to fulfill the 'Experience' component of 'Competence'. Its purpose is to provide a structured, mentored environment where the representative can gain the necessary practical skills and experience while being guided and overseen by a competent person.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 512,
    "questionText": "An FSP's internal system for escalating client complaints is slow and ineffective, frequently leading to delays beyond the 6-week period. This compromises the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability (Internal Controls).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence (Qualification).",
        "isCorrect": false
      }
    ],
    "explanation": "The internal complaints procedure is a mandatory internal control system. If this system is ineffective, the FSP is failing to meet the 'Operational Ability' requirement (FAIS Act, Sec 8(1)(d)) to have adequate and effective internal controls, processes, and systems.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 513,
    "questionText": "A Representative who provides advice on Category I products must complete a certain number of CPD hours annually. The failure to submit proof of this completion to the FSP indicates a breach of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "Continuous Professional Development (CPD) (Fit & Proper, Sec 29) is the requirement for maintaining *ongoing* 'Competence'. Failure to complete and provide proof of CPD hours is a direct breach of the competence requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 514,
    "questionText": "A Representative who is currently involved in civil litigation related to fraud and misrepresentation may be found in breach of the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Honesty and Integrity' requirement (FAIS Act, Sec 8(1)(a)) is assessed based on a person's character and 'good standing'. Being involved in litigation for serious offences like fraud and misrepresentation directly calls this integrity into question and may lead to debarment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 515,
    "questionText": "If a Representative resigns from an FSP, the FSP must update its register immediately. This is to ensure the regulator maintains an accurate record of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's next job.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Who is currently authorized to render services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's total client base.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative's personal financial history.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSCA's central register (based on FSP notifications per FAIS Act, Sec 13) is the single source of truth for the public and the regulator to see who is legally authorized. Immediate updates upon resignation are crucial to ensure this register is accurate and no one is misrepresented as being authorized.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 516,
    "questionText": "The FSP's **Financial Soundness** requirements are designed to ensure the FSP can always:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Outperform market benchmarks.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Meet its financial obligations, even if there are claims against it.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Sell its products at the lowest price.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Avoid all taxation.",
        "isCorrect": false
      }
    ],
    "explanation": "The purpose of 'Financial Soundness' (Fit & Proper, Sec 4) is client protection. It ensures the FSP has sufficient capital and liquidity to remain a 'going concern' and meet all its financial obligations (like paying debts and potential client claims) as they fall due.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 517,
    "questionText": "A Representative must provide a client with advice that is **appropriate**. If the client has a low-risk tolerance, the Representative must recommend a product that aligns with this profile. This is required under the Code of Conduct's principle of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Honesty.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suitability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7 & 8) requires a needs analysis to ensure 'suitability'. This means the product's features (e.g., its risk profile) must be appropriate for (i.e., match) the client's identified needs (e.g., their risk tolerance).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 518,
    "questionText": "A Representative must provide the client with a Status Disclosure that clearly states whether they are appointed as a Representative or a Key Individual. This is to inform the client of the individual's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Salary level.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Regulatory role.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Personal financial status.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD hours.",
        "isCorrect": false
      }
    ],
    "explanation": "The Status Disclosure (General Code, Sec 3(1)(a) & Sec 4) must clarify the capacity in which the person is acting. The client has a right to know if they are speaking to a 'Representative' (who gives advice) or a 'Key Individual' (who manages the FSP), as their roles and responsibilities differ.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 519,
    "questionText": "An FSP's management decides to implement a policy that requires all Representatives to aggressively promote the FSP’s own internal product line, even if external options might be better suited. This creates an unmanaged conflict of interest, directly breaching the duty to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ensure Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Prioritize client interests.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Comply with the FIC Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Maintain Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3(1)(c)) requires FSPs to prioritize the client's interests over their own. This policy does the opposite: it prioritizes the FSP's interest (selling in-house products) over the client's interest (getting the most suitable product). This is a failure to manage a conflict of interest.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 520,
    "questionText": "When advising on a replacement product, the Representative must disclose any potential penalties or costs associated with cancelling the **existing** product. This is a crucial element of the rules for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record keeping.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Replacement advice disclosure.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Discretionary mandates.",
        "isCorrect": false
      }
    ],
    "explanation": "The replacement advice rules (General Code, Sec 7(2)) are designed to ensure the client is not worse off. A key part of this is disclosing the full financial impact, which *must* include any penalties, fees, or surrender charges that will be incurred on the *existing* product being replaced.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 521,
    "questionText": "A Representative must ensure that all written communication regarding a product's performance includes a warning that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP is not responsible for market losses.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Past performance is not a guarantee of future returns.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client must sign the document immediately.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative's commission is high.",
        "isCorrect": false
      }
    ],
    "explanation": "To ensure communications are 'not misleading' (General Code, Sec 4(1)), any quotation of past investment performance must be accompanied by a clear and prominent warning that past performance is not an indicator or guarantee of future performance.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 522,
    "questionText": "If a client provides incomplete information for the needs analysis, the Representative is still allowed to provide limited advice, provided they:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Assume the client is high-risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Inform the client of the limitations and risks associated with the advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Refuse to render any service.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only advise on Tier 2 products.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(3)) gives a specific instruction for this situation. If the client fails to provide information, the representative must clearly explain to the client that this creates limitations, that the advice may be compromised as a result, and that the client must accept this risk.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 523,
    "questionText": "The FSP must ensure that its electronic records are securely backed up. This is a requirement related to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "Record keeping (FAIS Act, Sec 18) and the systems that support it (like IT and data backups) are a core component of the FSP's 'Operational Ability'. This ensures the FSP has the technical infrastructure to protect client data and comply with the Act.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 524,
    "questionText": "Records of all client mandates and instructions must be kept for the minimum statutory period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "Client mandates and instructions are critical records of the financial services rendered. Under the FAIS Act (Sec 18), all such records must be retained for a minimum of 5 years from the date the service was rendered or the relationship was terminated.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 525,
    "questionText": "The record of advice must include evidence that the Representative disclosed their remuneration. This record is critical for proving compliance with the Code's requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Suitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure and transparency.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct requires disclosure of remuneration (Sec 4) for transparency. The 'Record of Advice' (Sec 3(4)) is the FSP's *proof* of compliance. The record must therefore contain evidence that this disclosure was made, proving that the FSP was transparent.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 526,
    "questionText": "The minimum 5-year record-keeping period for records of advice ensures that the FSP can provide a regulatory audit trail for the benefit of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative's next FSP.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSCA and the FAIS Ombud.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's marketing team.",
        "isCorrect": false
      }
    ],
    "explanation": "The primary purpose of the 5-year retention rule (Code of Conduct, Sec 3(4)) is regulatory. It ensures that if the FSCA (the regulator) conducts an audit or the FAIS Ombud (the dispute resolver) investigates a complaint, a complete and accurate record exists to verify what happened.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 527,
    "questionText": "The FSP must maintain a record of all client complaints and the steps taken to resolve them. This record must be kept for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Until the complaint is resolved.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The statutory minimum of 5 years.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Indefinitely.",
        "isCorrect": false
      }
    ],
    "explanation": "A complaint register and all related correspondence are key compliance records. Under the FAIS Act (Sec 18) and Code of Conduct, these records must be maintained for a minimum of 5 years from the date the complaint was resolved or the service was terminated.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 529,
    "questionText": "A client attempts to conduct a large transaction but provides inconsistent and vague information about the source of the funds. The Representative should immediately file a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Internal Complaint Report.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Suspicious or Unusual Transaction Report (STR).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Financial Soundness Report (FSR).",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires an STR for suspicious activity. A client being vague or providing inconsistent information about the *source* of their funds is a major red flag for money laundering (as they may be trying to conceal that it is proceeds of crime). This suspicion mandates an STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 530,
    "questionText": "The FSP must apply the **Risk-Based Approach (RBA)** when establishing a business relationship. This means that if a client is identified as high risk, the FSP must impose:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence (SDD).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Mandatory fee increases.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Enhanced Due Diligence (EDD).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A total business rejection.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) requires a proportionate response. For standard clients, 'Standard Due Diligence' is used. For clients identified as high-risk (e.g., PEPs, clients in high-risk industries), the FSP *must* apply 'Enhanced Due Diligence' (EDD), which involves more intensive verification steps.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 531,
    "questionText": "If a Representative files a STR, which party are they **strictly prohibited** from informing about the submission?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Key Individual.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The client who is the subject of the report.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Tipping-Off Prohibition' (FIC Act, Sec 29(3)) makes it a criminal offence to tell the client (or any unauthorized person) that an STR has been filed. The representative *must* inform their Compliance Officer or KI (A, B) as part of the internal reporting process.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 532,
    "questionText": "An FSP identifies a client as a **Politically Exposed Person (PEP)**. The FSP must implement enhanced due diligence and obtain senior management approval. This is necessary because PEPs present a higher risk of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Poor investment returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness issues.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Corruption and money laundering.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Failing the RE5.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) designates PEPs as high-risk not because they are criminals, but because their prominent public positions make them (and their associates) more vulnerable to being involved in bribery, corruption, and subsequent money laundering.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 533,
    "questionText": "A serious failure by the FSP to implement its RMCP and comply with the FIC Act can result in the FIC imposing:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A suspension of the FSP's trading license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A recommendation for new products.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Administrative sanctions, including fines.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A mandatory review by the FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) gives the FIC direct enforcement powers. For non-compliance (like failing to implement an RMCP), the FIC can impose 'Administrative Sanctions', which include directives, restrictions, and significant monetary penalties (fines).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 534,
    "questionText": "The FSP's RMCP must include internal controls for the ongoing training of employees regarding the FIC Act. This training ensures that employees can:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Write a compliance report.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Correctly identify and report suspicious transactions.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Verify the FSP's financial soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Negotiate lower transaction fees.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) requires staff training as a key internal control. The purpose of this training is to ensure all staff (especially client-facing) are aware of their obligations and can correctly identify 'red flags' or suspicious behavior, and know the internal process for reporting it.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 535,
    "questionText": "The FSP's internal complaint resolution procedure must be recorded and retained for the minimum statutory period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "10 years.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Until the next audit.",
        "isCorrect": false
      }
    ],
    "explanation": "A complaint register and all related correspondence are key compliance records. Under the FAIS Act (Sec 18) and General Code of Conduct (Sec 3(4)), all such records must be maintained for a minimum of 5 years.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 536,
    "questionText": "If a client is dissatisfied with the FSP's final response, the client has the right to refer the matter to the FAIS Ombud. This right must be clearly explained in the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing material.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Final written response to the complaint.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Annual compliance report.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product disclosure document.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's *final written response* (Ombud Rules, Rule 7) to an internal complaint is a critical document. It must not only state the FSP's decision and reasons but *must* also explicitly inform the client of their right to escalate the complaint to the FAIS Ombud and provide the Ombud's contact details.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 537,
    "questionText": "The FAIS Ombud's mandate covers disputes related to the FAIS Act, and its process is designed to be informal, quick, and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Strictly bound by precedent.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Procedurally fair.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only for high-value claims.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Confined to verbal resolution.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(1)) and Ombud Rules (Rule 3) define the Ombud's process. It is designed to be 'informal, expeditious (quick), and procedurally fair'. 'Procedurally fair' means that, unlike a formal court, the Ombud must ensure both parties have a fair opportunity to present their case and respond to the other's.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 538,
    "questionText": "The client has a strict deadline of six months from receiving the FSP's final response to refer the matter to the Ombud. This rule ensures:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The claim is not too complex.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The dispute is handled within a reasonable timeframe.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's records are destroyed after 6 months.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client pays the Ombud's fee.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a prescription period (Ombud Rules, Rule 7(3)). Its purpose is to ensure legal certainty and finality. It prevents clients from lodging complaints many years after the event, ensuring that disputes are handled while evidence (and records) are still available and the matter is current.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 539,
    "questionText": "If the FSP is ordered by a Final Determination to pay compensation, the FSP must comply. If they fail to comply, the Ombud can enforce the determination via:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSCA suspending the FSP's license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Obtaining a High Court order to enforce the payment.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Publicly debarring the Key Individual.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A referral to the FIC for administrative sanction.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination (FAIS Act, Sec 28(5)) is 'deemed to be a civil judgment'. This means if the FSP refuses to pay, the client or Ombud can go to the High Court with the determination and obtain a writ of execution (an order to seize and sell the FSP's assets) to enforce payment.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 540,
    "questionText": "The FAIS Ombud may try to resolve a dispute through conciliation or mediation. This process is used to encourage:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A voluntary settlement between the parties.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The FSP to submit an appeal.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP to admit guilt.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client to withdraw the complaint.",
        "isCorrect": false
      }
    ],
    "explanation": "Conciliation and mediation (Ombud Rules, Rule 3) are forms of alternative dispute resolution. The Ombud's office facilitates a discussion between the two parties to help them reach a *voluntary* settlement that both sides find acceptable, avoiding the need for a formal, binding determination.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 542,
    "questionText": "Which ONE of the following statements best describes the primary role of the Key Individual?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To personally approve every client transaction.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To manage and oversee the rendering of financial services and the FSP's compliance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "To act as the FSP's dedicated sales manager and motivate representatives.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "To conduct the FSP's external financial audit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines the KI as the person responsible for the 'management and oversight' of the FSP's activities *related to the rendering of financial services*. This makes them the person accountable for the FSP's overall compliance framework.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 543,
    "questionText": "The KI discovers that a Representative has failed to attain the minimum required experience under supervision within the 5-year limit. The KI must ensure the Representative:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Is granted a 1-year extension.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately ceases to render financial services.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Is transferred to a different FSP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Is subject to a fine.",
        "isCorrect": false
      }
    ],
    "explanation": "The 5-year (60-month) supervision period is a maximum. If the representative is still not competent by this deadline, they fail the 'Competence' requirement. The KI (Sec 13(1)) *must* ensure this person is debarred and immediately 'ceases to render financial services'.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 545,
    "questionText": "The KI must ensure that the FSP maintains a proper **Business Continuity Plan (BCP)**. The BCP is a key component of the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "A BCP is a plan to manage disruptions. This (along with risk management, IT, and record keeping) is a core component of the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)), which the KI must oversee (Sec 17(1)).",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 546,
    "questionText": "Which product is generally classified as a **Tier 1** product, requiring the Representative to pass the RE5 examination?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Health service benefit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A retirement annuity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A funeral policy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A simple banking deposit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) product tiers are based on complexity. 'Tier 2' products are simple (A, C, D). A 'Tier 1' product is more complex and carries higher risks. A retirement annuity is a complex, long-term savings and investment product, firmly classified as Tier 1, thus requiring the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 547,
    "questionText": "A Representative is advised by their FSP to ensure that the client's investment portfolio is appropriately diversified. This is primarily to mitigate which type of product risk?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Compliance Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Concentration Risk.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Concentration Risk' is the risk of having 'all your eggs in one basket'. Diversification (spreading investments across different assets or regions) is the primary strategy to mitigate this specific risk. This is a key part of a suitability analysis (Code of Conduct, Sec 3(2)).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 548,
    "questionText": "A Representative must ensure they are competent to advise on financial products by:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Reading the newspaper daily.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Completing the required CPD activities.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only advising on the cheapest products.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only dealing with high-net-worth clients.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (FAIS Act, Sec 13(1)) is an ongoing duty. After initial qualification, representatives maintain their competence and product knowledge by staying current with the market and legislation, which is formally achieved by completing 'Continuous Professional Development' (CPD) hours.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 549,
    "questionText": "The term **'Credit Risk'** (or default risk) in a financial product context refers to the risk that:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP will go bankrupt.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Product Supplier may be unable to meet its contractual obligations.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client cannot pay the premium.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The product's price will fluctuate.",
        "isCorrect": false
      }
    ],
    "explanation": "'Credit Risk' is the risk that the counterparty to a contract will default. In this context, it is the risk that the 'Product Supplier' (e.g., the insurer or the bank that issued the bond) will fail financially and be unable to meet its obligations to the client (e.g., pay out the policy or the bond).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 550,
    "questionText": "When a Representative discloses the Product Supplier's details, they must include information about the Product Supplier's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Annual marketing budget.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Contact details and legal status.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Annual employee attrition rate.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Internal audit reports.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) mandates disclosure of information about the Product Supplier. This is to ensure the client knows which entity is ultimately responsible for the product. This disclosure includes the supplier's name, contact details, and legal status (e.g., that it is a registered insurer).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 551,
    "questionText": "Which action constitutes a **financial service** that requires the entity or individual to be an FSP or Representative?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Writing a magazine article about general investment trends.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Providing a client with a personalized recommendation on a short-term insurance policy.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Explaining the definition of a long-term deposit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Filing a company's tax return.",
        "isCorrect": false
      }
    ],
    "explanation": "A 'financial service' (FAIS Act, Sec 1 Definitions) includes giving 'advice'. A 'personalized recommendation' to a specific client about a financial product (a short-term policy) is the exact definition of advice, and thus requires a license. Options A, C, and D are all excluded activities.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 552,
    "questionText": "A Representative fails the RE5 for the final time within their two-year deadline. The FSP must immediately remove them from the register because they failed to meet the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Regulatory knowledge.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 exam specifically tests 'regulatory knowledge'. This knowledge is a mandatory component of the 'Competence' pillar of the Fit and Proper requirements (FAIS Act, Sec 13(1)(a)). Failure to pass means failure to demonstrate competence.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 553,
    "questionText": "A person appointed only for the execution of sales, without rendering any advice or intermediary services, is generally:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Required to write the RE5.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Required to be a Key Individual.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Exempt from writing the RE5.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Required to be under supervision for 5 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 is a requirement for representatives who render 'advice'. A person who *only* performs 'execution of sales' (acting on client instructions) is not rendering advice and is thus exempt from the RE5 requirement.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 554,
    "questionText": "An FSP's license is conditional on maintaining adequate Professional Indemnity (PI) Insurance. If the PI cover lapses, which Fit and Proper pillar is compromised?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness (Capital adequacy).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability (Risk mitigation).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence (Qualification).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "PI insurance is a key risk mitigation control required for an FSP. Having this insurance in place is a component of the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) to manage its risks and protect clients. A lapse in this cover is a material breach of this operational requirement.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 555,
    "questionText": "The FAIS Act applies to individuals who render financial services for compensation, whether commission or fees. This is a measure to ensure the fair treatment of clients and maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's income.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market integrity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product price control.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Tax compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act's purpose (Sec 1) is to regulate the *conduct* of FSPs. By professionalizing the industry, setting Fit and Proper standards, and enforcing a Code of Conduct, the Act aims to protect consumers and ensure the overall integrity and fairness of the financial market.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 556,
    "questionText": "If a Representative resigns from an FSP, the FSP must update its Representative register and inform the FSCA:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Within 30 days of the resignation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only at the next license renewal.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "If the Representative was debarred.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's duty to maintain an accurate register (FAIS Act, Sec 13) and notify the FSCA (Sec 14) applies to *any* change in a representative's status, including resignation. This notification must be made 'immediately' to ensure the central register is accurate.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 557,
    "questionText": "If a Representative only renders services for Tier 2 financial products, the FSP must ensure they have adequate knowledge and competence, but they are exempt from the requirement to pass the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "RE1 exam.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "RE5 exam.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "CPD hours.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Fit and Proper requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) are tiered. The RE5 (Representative Exam) is for Tier 1 products. Representatives who *only* advise on Tier 2 products are exempt from the RE5. (They are not exempt from Fit and Proper (D) or CPD (C) in general).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 558,
    "questionText": "Which of the following activities is classified as an **intermediary service**?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Recommending an investment strategy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Accepting an instruction from a client to redeem a policy.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Explaining the risks of a product.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Determining product suitability.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'intermediary service' as any act *other than advice*. This includes 'executing... on behalf of a client, any instruction'. Accepting and actioning an instruction to redeem (cash in) a policy is a clear example of this.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 559,
    "questionText": "A Representative is discovered to have a history of having their name removed from a previous FSP's register due to dishonesty. This is a breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "A debarment for 'dishonesty' is a clear and serious black mark against a person's character. This directly contravenes the 'Honesty and Integrity' requirement (Fit & Proper, Sec 7) and would disqualify them from being appointed as a representative.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 561,
    "questionText": "The Representative's overall **Competence** requirement is comprised of the minimum qualification, the relevant regulatory exams (RE5), and the completion of the required:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Annual audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Experience under supervision.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act reporting.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity check.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (Fit & Proper, Sec 20) is defined by three components: 1) Qualification (the certificate/degree), 2) Regulatory Exam (the RE5), and 3) Experience (the on-the-job training acquired under supervision). All three must be completed.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 562,
    "questionText": "The FSP must have adequate policies and procedures to ensure the **segregation of client assets** from the FSP’s own assets. This is a component of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The segregation of client assets is a critical internal control to protect clients from FSP insolvency. This process, and the systems that support it, fall under the 'Operational Ability' requirement (FAIS Act, Sec 8(1)(d)).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 563,
    "questionText": "The Representative must engage in Continuous Professional Development (CPD) activities to ensure their knowledge of the legislative and product environment is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Constantly expanding.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Maintained and updated.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only focused on sales.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Audited by the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is about *maintaining* competence. Its purpose is to ensure that the representative's knowledge (which was proven by the qualification and RE) is *maintained and updated* to reflect new laws, products, and market changes.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 564,
    "questionText": "A Representative must sign an annual declaration confirming their ongoing compliance with the Fit and Proper requirements. This is the FSP's internal mechanism to ensure compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "CPD hours.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Ongoing Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP has an ongoing duty to monitor Fit and Proper (FAIS Act, Sec 8(1)(a)). The annual declaration is the primary internal control used to monitor the 'personal character' pillars: 'Honesty and Integrity' and 'Financial Soundness' (B), with a focus on (C) as the core attestation of character.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 565,
    "questionText": "If the FSCA instructs an FSP to remove a Representative from its register due to a criminal conviction, the FSP must comply immediately. This action is part of the FSP's ongoing obligation to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Compliance with regulatory instructions.",
        "isCorrect": true
      }
    ],
    "explanation": "While the root cause is a breach of 'Honesty & Integrity', the FSP's *action* of removing the rep upon instruction is a matter of compliance. An FSP must comply with any lawful instruction or directive from the regulator (FSCA) (FAIS Act, Sec 13/14).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 566,
    "questionText": "An FSP fails to have the required liquid assets to cover its running expenses for a prolonged period. This indicates a failure to maintain compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Financial Soundness' requirements (Fit & Proper, Sec 4) are specific rules about an FSP's finances. A key rule is maintaining sufficient liquidity (liquid assets) to cover operational expenses. Failure to do so is a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 567,
    "questionText": "The Code of Conduct requires that the Representative must provide a client with advice that is **suitable**. This means the advice must align with the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Family history.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Political views.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Needs and financial circumstances.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Representative's product preference.",
        "isCorrect": false
      }
    ],
    "explanation": "'Suitability' (General Code, Sec 7 & 8) is the requirement to match the advice and product to the client's specific situation. This is only possible after conducting a needs analysis to understand the client's financial circumstances (affordability, risk profile) and their needs/objectives.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 568,
    "questionText": "The Representative's Status Disclosure must inform the client of the legal capacity in which the FSP acts (e.g., independent or tied agent). This disclosure is necessary to inform the client about the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Potential for product bias.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tax liability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD status.",
        "isCorrect": false
      }
    ],
    "explanation": "This disclosure (General Code, Sec 3(1)(a) & Sec 4) is a key conflict of interest disclosure. If an FSP is 'tied' to one product supplier, its advice is limited to that supplier's products. The client must know this to understand the potential for bias and the limited scope of the advice.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 569,
    "questionText": "If a conflict of interest is identified, the FSP must ensure that the client is fully aware of the conflict's implications. This is the **Disclosure** element of the Conflict of Interest Management Policy, which must be made:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only on the website.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "In writing, at the earliest opportunity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only to the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Verbally only.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3(1)(c)) requires that the disclosure of a conflict of interest must be timely (at the earliest opportunity) and clear. To be effective and verifiable, this disclosure must be made in writing before the advice is finalized.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 570,
    "questionText": "When providing replacement advice, the Representative must advise the client of all material differences between the policies. The failure to disclose a higher ongoing service fee on the new product is a breach of the rules for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record Keeping.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Due care and diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "Replacement advice (General Code, Sec 7(2)) requires a high degree of 'due care, skill, and diligence'. Failing to disclose a material fact like a higher fee is a failure of this duty, as the representative has not acted diligently and has provided incomplete (and thus misleading) advice.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 571,
    "questionText": "A Representative must ensure that all advertisements or marketing material are easily comprehensible and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Guaranteed to attract new clients.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Factual and not misleading.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Approved by the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Contain only complex technical terms.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) governs all communications, including advertising. The core rule is that all such material must be 'factual, clear, and not misleading' to ensure clients are not deceived.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 572,
    "questionText": "The core principle requiring the Representative to act with **due care, skill, and diligence** applies directly to the Representative's execution of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Client's tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Needs analysis and suitability determination.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FSP's internal audit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The duty of 'due care, skill, and diligence' (General Code, Sec 2 & 7) is the professional standard for giving advice. It is most directly applied to the process of analyzing a client's needs and using professional skill to determine a suitable recommendation.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 573,
    "questionText": "The FSP's record-keeping system must be able to reproduce client records accurately and reliably. This ensures the records maintain their:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Monetary value.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Integrity and authenticity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing value.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Storage capacity.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requirements for record-keeping systems are focused on ensuring the records are a true and reliable account of what happened. The system must protect the 'integrity' (completeness) and 'authenticity' (unaltered state) of the records for regulatory inspection.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 574,
    "questionText": "The records of all internal compliance reports regarding the FSP's adherence to the FAIS Act must be retained for a minimum period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "7 years.",
        "isCorrect": false
      }
    ],
    "explanation": "Internal compliance reports are key records that demonstrate the FSP's 'Operational Ability' and its monitoring of compliance. Under the FAIS Act (Sec 18), these, like all other compliance and service-related records, must be kept for a minimum of 5 years.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 575,
    "questionText": "The record of advice must include evidence that the Representative disclosed the full range of risks associated with the recommended product. This documentation is required to prove compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure and suitability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act CDD.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct requires disclosure of risk (Sec 4) and that advice is suitable (Sec 8). The 'Record of Advice' (Sec 3(4)) is the FSP's proof that it met these duties. The record *must* therefore document that the risks were explained, proving compliance with disclosure and suitability rules.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 576,
    "questionText": "For a long-term insurance policy, the 5-year record-keeping period begins from the date the financial service was rendered, or if the service is ongoing, from the date the service:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Was first initiated.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Is renewed.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Ceased (e.g., policy maturity or cancellation).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Was audited.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(4)) specifies that for ongoing products (like a long-term policy), the 5-year retention period begins *after* the product or service has been terminated (e.g., the policy is cancelled, matures, or pays out).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 578,
    "questionText": "The FSP must take reasonable steps to verify the identity of the client. If the FSP cannot complete the CDD requirements, which ONE of the following must the FSP do?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Proceed with the transaction but file an STR.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Terminate the business relationship immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Ask the client for a verbal confirmation.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Charge the client a higher fee.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21) is strict: if Customer Due Diligence (CDD) cannot be completed, the FSP *must not* establish the business relationship or conclude a transaction. If a relationship already exists, it must be terminated.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 579,
    "questionText": "If a Representative forms a suspicion that a transaction may involve the proceeds of unlawful activities, they must submit a STR to the FIC:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Within 3 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only if the transaction is over R50,000.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "After receiving legal advice.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires reporting 'as soon as reasonably possible' after a suspicion is formed. This is interpreted as 'immediately' and without undue delay. The trigger is 'suspicion', not a monetary threshold.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 580,
    "questionText": "Under the Risk-Based Approach (RBA), an FSP determines that a client is high-risk due to their complex offshore structure. The FSP's RMCP must mandate the application of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence (SDD).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Standard Due Diligence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Enhanced Due Diligence (EDD).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Tipping-Off Prohibition only.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) requires controls to be proportionate to risk. A complex offshore structure is a classic high-risk indicator for money laundering. Therefore, the FSP's RMCP *must* mandate that 'Enhanced Due Diligence' (EDD) be applied to this client.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 581,
    "questionText": "The **Tipping-Off Prohibition** under the FIC Act ensures the Representative does not inform the client that an STR has been filed. This rule is necessary to prevent:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Damage to the FSP's reputation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compromising the investigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A client complaint to the Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative's resignation.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Tipping-Off Prohibition' (FIC Act, Sec 29(3)) is a criminal offence. Its entire purpose is to protect the integrity of a potential investigation. Alerting the suspect would 'prejudice' the investigation by giving them an opportunity to move funds or destroy evidence.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 582,
    "questionText": "When identifying a client that is a legal entity, the FSP must ensure it verifies the identity of the **Beneficial Owner (BO)**. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The BO is always the CEO of the entity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The BO is the FSP's Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The BO is the natural person who ultimately owns or controls the entity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The BO is the entity's tax consultant.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21B) requires FSPs to 'look through' legal structures to find the 'Beneficial Owner'. This is the actual human being (natural person) who ultimately benefits from, owns, or controls the legal entity, even if through a complex chain of other companies.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 583,
    "questionText": "The FSP faces an administrative sanction from the FIC for non-compliance. Which of the following is an administrative sanction?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A suspension of the Key Individual's driver's license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A public reprimand or fine.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A mandatory review of the FSP's marketing.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's compulsory donation to charity.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) lists the 'Administrative Sanctions' the FIC can impose. These civil penalties include a public reprimand, a directive to take corrective action, a restriction on business, or a monetary fine.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 584,
    "questionText": "The FSP must establish and implement a **Risk Management and Compliance Programme (RMCP)**. This is a mandatory requirement for all entities classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product Suppliers.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Key Individuals.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Accountable Institutions.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "External Auditors.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 42A) places the legal obligation to develop and implement an RMCP on all entities that are defined in Schedule 1 of the Act as 'Accountable Institutions'. FSPs are listed as Accountable Institutions.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 585,
    "questionText": "The FSP's internal complaint handling procedure must be easy to understand and readily available to all clients. This ensures the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Right to privacy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Right to redress.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Right to choose a new FSP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Right to guaranteed returns.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16) mandates this procedure to ensure 'Treating Customers Fairly'. An accessible and transparent complaints process is fundamental to ensuring a client's 'right to redress' (the right to complain and have it resolved fairly).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 586,
    "questionText": "An FSP receives a written complaint but fails to provide a final response within six weeks. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client must sue the FSP in the High Court.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's right to refer the complaint to the FAIS Ombud is now triggered.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client automatically receives full compensation.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client must grant the FSP a 6-week extension.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(1)) give the FSP a maximum of *six weeks* (42 calendar days) to resolve an internal complaint. If the FSP fails to respond within this period, the client's right to escalate the complaint to the FAIS Ombud is automatically triggered.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 587,
    "questionText": "The FAIS Ombud resolves disputes related to the FAIS Act, ensuring the resolution process is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Strictly commercial.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Informal and quick.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only for high-value claims.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Subject to the civil court rules of evidence.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(1)) and Ombud Rules (Rule 3) define the Ombud's process. It is explicitly designed to be 'informal' (not a court), 'expeditious' (quick), and 'procedurally fair' as an alternative to the slow and expensive court system.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 588,
    "questionText": "A client receives the final rejection of their complaint from the FSP. The final deadline for the client to refer the complaint to the FAIS Ombud is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year from the date of the advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "6 months from the date of the final rejection.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "30 days from the date of the final rejection.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The end of the current calendar year.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(3)) set a 6-month (six-month) prescription period. This 'clock' starts running from the date the client receives the FSP's final response. The client must lodge the complaint with the Ombud within this 6-month window.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 589,
    "questionText": "If the FAIS Ombud makes a Final Determination against an FSP, who is legally bound to comply with the order?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Only the client.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP and the Representative involved in the complaint.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination (FAIS Act, Sec 28(5)) is binding on *all parties* to the complaint. This includes the FSP (the licensed entity) and any representative who was named as a respondent in the complaint.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 590,
    "questionText": "The FAIS Ombud will typically **NOT** investigate a complaint that relates purely to the FSP's high marketing fees, provided those fees were properly disclosed. This is because the Ombud's jurisdiction is focused on:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Pricing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Breaches of the FAIS Act and Code of Conduct.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Market competition.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP profitability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud's jurisdiction (FAIS Act, Sec 27(3)) is not to set prices or rule on 'fair' pricing. Its role is to investigate breaches of the FAIS Act. If a fee was *not disclosed*, that is a breach of the Code. But if it *was* disclosed and the client is just unhappy with the price, it is a commercial dispute, not a FAIS breach.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 591,
    "questionText": "A Key Individual (KI) delegates the implementation of the FSP’s record-keeping policy to a compliance team. If the team fails, the ultimate regulatory responsibility for the breach rests with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The compliance team only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP and the KI.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI (Sec 17(1)) is ultimately accountable for the FSP's compliance. They can delegate tasks, but not their legal responsibility. If the delegated team fails, the KI (as the manager) and the FSP (as the licensed entity) are held responsible by the regulator for the compliance failure.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 592,
    "questionText": "The KI must ensure the FSP has adequate systems for record keeping, internal control, and risk mitigation. This is the KI’s duty concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI is the 'mind and management' responsible for the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)). This pillar specifically covers all internal systems, controls, risk management processes, and record-keeping infrastructure.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 593,
    "questionText": "The KI must ensure that every Representative's mandate is clearly defined on the register to prevent the Representative from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Earning too little commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Acting outside their approved scope of service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Failing the CPD requirement.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Leaving the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight (FAIS Act, Sec 13) includes managing the representative register. The mandate recorded on this register defines the representative's legal 'scope of service'. The KI must maintain this to ensure representatives do not illegally provide advice on products they are not authorized for.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 596,
    "questionText": "An investment in a high-risk derivative contract is generally classified as a **Tier 1** product because it:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Is exempt from the FAIS Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Requires a lower level of competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Involves higher complexity and client risk.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Is subject to the FIC Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The Tier 1 / Tier 2 split (FAIS Act, Sec 1) is based on risk and complexity. 'Tier 2' products are simple and low-risk. 'Tier 1' covers all other products, especially complex and high-risk investments like derivatives, which require a higher level of representative competence (i.e., the RE5).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 597,
    "questionText": "When conducting a suitability analysis, the Representative must assess the client's current financial situation, needs, and objectives to ensure the recommended product is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The most profitable for the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The least expensive.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Appropriate.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Guaranteed.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(2) & 8) requires a needs analysis to ensure the advice is 'suitable' or 'appropriate'. This means the product's features must be a good match for the client's specific, identified financial situation, needs, and goals.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 598,
    "questionText": "A Representative is competent to advise on life policies (Category C) but attempts to advise on pension fund administration (Category III). This action compromises the Representative's compliance with the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (Product Mandate).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Record Keeping.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (FAIS Act, Sec 13(1)) is not general; it is specific to the product categories and sub-categories a representative is mandated for. Advising on a product outside of this mandate (like a Cat C rep advising on Cat III) is a direct breach of the competence requirement.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 599,
    "questionText": "The risk that a financial product cannot be converted into cash without a significant loss in value or time is known as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Market Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Credit Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Liquidity Risk.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Liquidity Risk' is the specific financial term for the risk that an asset cannot be sold or redeemed quickly for its full market value. A representative must disclose this risk to a client as part of the suitability and disclosure process.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 601,
    "questionText": "Mr. Sizwe, a Representative, assists a client in switching their existing long-term insurance policy by processing the cancellation and submitting the new application form. This activity is classified under the FAIS Act as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An intermediary service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A factual communication.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Excluded business.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'Intermediary Service' as any act *other than advice* performed on behalf of a client that results in them entering into, varying, or replacing a policy. Processing the cancellation and submitting the new application form are administrative actions that fall under this definition.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 602,
    "questionText": "The FSP is required to appoint a Representative only after ensuring the person meets the minimum qualification and regulatory exam requirements. This ongoing duty is to ensure compliance with the **Fit and Proper** pillar of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 13(1)(a)) mandates that FSPs ensure their representatives are 'Fit and Proper'. Qualifications and regulatory exams (like the RE5) are the specific requirements needed to satisfy the 'Competence' pillar of these Fit and Proper standards.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 603,
    "questionText": "A registered auditor provides a client with a recommendation on a long-term investment product that is structured to minimize the client's tax liability. Which ONE of the following statements is correct regarding this advice?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It is not subject to FAIS because auditors are regulated by the Auditing Profession Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It is subject to FAIS because the advice relates to a financial product and is a recommendation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It is not subject to FAIS because it is purely tax advice.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It is only subject to FAIS if the auditor receives a commission.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act regulates the *act* of giving advice on a *financial product*, regardless of the person's primary profession. While tax advice itself is excluded, giving a recommendation on a 'long-term investment product' (which *is* a financial product) brings the activity under the FAIS Act.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 604,
    "questionText": "An FSP operating in Category I must maintain records of its risk management policies and compliance procedures. This is a crucial aspect of maintaining its:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(d)) requires FSPs to have 'Operational Ability'. This includes having adequate and effective systems, internal controls, and risk management procedures. Maintaining records of these policies is the proof that this operational ability exists.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 605,
    "questionText": "The fundamental requirement of the FAIS Act's subordinate legislation is that an FSP and its Representatives must act honestly, fairly, with due care, skill, and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Maximum profit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Minimal record keeping.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Strict adherence to the civil court rules.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the core principle of the General Code of Conduct (Sec 2), which is subordinate legislation under the FAIS Act. The full requirement is that all financial services must be rendered 'honestly, fairly, with due skill, care and diligence'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 606,
    "questionText": "If an FSP decides to debar a Representative, the FSP must inform the FSCA and provide full reasons for the action. This notification must be made:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only after the Representative has appealed the decision.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Within 30 days of the decision.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Immediately.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Only at the time of the annual audit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) is strict on this timeline. To ensure the central register is accurate and to protect the public, the FSP must notify the FSCA 'immediately' of the debarment and the reasons for it.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 607,
    "questionText": "A financial product that involves making investment choices on behalf of the client, where the FSP has control over the investment decisions, is classified as a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Category I service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Category II (Discretionary) service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tier 2 product.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Intermediary service only.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines the FSP license categories. Category II is the specific license for FSPs that manage client assets on a *discretionary* basis, meaning they have the client's discretion (permission) to make investment decisions without consulting the client on each trade.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 608,
    "questionText": "A Representative who is appointed only to sell Tier 2 products is required to write the RE5 if they later expand their service to include:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only intermediary services on the Tier 2 product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Advice on funeral benefits.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Advice on retirement annuities (Tier 1).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Factual information provision.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 exemption (FAIS Act, Sec 13(1)(b)) applies *only* to representatives who render services for Tier 2 products. A retirement annuity is a complex 'Tier 1' product. The moment the representative is appointed to advise on a Tier 1 product, the exemption falls away, and they become subject to the RE5 requirement.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 609,
    "questionText": "A Representative is discovered to have a current sequestration order against them due to personal debt. This is a material breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) mandate that a representative must be 'Financially Sound'. Being under a sequestration order (a form of insolvency) is an explicit disqualifier and a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 610,
    "questionText": "The FSP must have a documented process for the safe storage and accessibility of all client information and records. This duty is specifically part of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability (Record Management).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's systems for record keeping (FAIS Act, Sec 18) are a key internal control. This falls under the 'Operational Ability' pillar (Sec 8(1)(d)), which covers all systems, processes, and infrastructure for managing the business's operations, including record management.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 611,
    "questionText": "A Representative appointed under supervision must receive adequate guidance and training. If the FSP fails to provide this, resulting in the Representative providing incorrect advice, the FSP has breached the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability (Supervision).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "Supervision (Fit & Proper, Sec 22) is not a passive activity. The FSP has an active duty to provide guidance, training, and oversight. Failure to do so is a breach of the FSP's 'Operational Ability', as it has failed to implement its own internal controls for managing its representatives.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 612,
    "questionText": "The FSP must implement appropriate and effective internal controls to minimize the risk of fraud, theft, and unauthorized transactions. This is a measure to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Client satisfaction.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Operational Ability' requirement (FAIS Act, Sec 8(1)(d)) includes the FSP's entire risk management and internal control framework. Systems to prevent fraud, theft, and unauthorized activities are a fundamental part of this operational control framework.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 613,
    "questionText": "The qualification requirement for a Representative is designed to ensure the Representative has the necessary theoretical and practical foundation for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The formal 'Qualification' (Fit & Proper, Sec 26) is part of the 'Competence' pillar. Its purpose is to ensure the representative has the baseline theoretical knowledge required to be competent in their field.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 614,
    "questionText": "A Representative must act with honesty and integrity. This is particularly important because it maintains the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Investment returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Trust and confidence in the FSP.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "CPD hours.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Honesty and Integrity' requirement (FAIS Act, Sec 8(1)(a)) is the bedrock of the client-advisor relationship. The entire financial system relies on 'trust and confidence'. Dishonest actions destroy this trust and bring the industry into disrepute.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 615,
    "questionText": "When an FSP debarres a Representative, the FSP must inform the FSCA immediately. Which ONE of the following statements is correct regarding the debarment decision?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It only takes effect after the FSCA approves it.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It takes effect on the date specified by the FSP.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It only takes effect after the Representative has completed their CPD.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "It only takes effect when the FAIS Ombud makes a determination.",
        "isCorrect": false
      }
    ],
    "explanation": "The debarment (FAIS Act, Sec 14) is an action taken *by the FSP*. The FSP makes the decision, follows a fair process, and then *notifies* the FSCA. The debarment is effective from the date the FSP specifies, at which point the FSCA updates its register.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 616,
    "questionText": "The FSP's Financial Soundness requirements are most critical for FSPs that hold client funds or operate complex investment schemes because they carry a higher:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing cost.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Risk of client loss if the FSP becomes insolvent.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Compliance risk.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD requirement.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Financial Soundness' rules (Fit & Proper, Sec 4) are stricter for FSPs that hold client money (e.g., Cat II or III). This is because if such an FSP becomes insolvent (bankrupt), there is a direct and high risk that clients will lose the funds the FSP was holding on their behalf.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 617,
    "questionText": "A Representative must provide a client with advice that is **appropriate** to their needs. This means the product recommended should consider the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial situation and objectives.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FSP's profitability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product Supplier's size.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 7 & 8) requires a needs analysis to determine 'suitability' or 'appropriateness'. This is the process of matching the product to the client's specific financial situation (e.g., affordability, risk tolerance) and their financial objectives (their goals).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 618,
    "questionText": "The Representative's Status Disclosure must inform the client of the contact details of the FSP's **Compliance Officer**. This is a requirement of the Code of Conduct's duty for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Status disclosure.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Record keeping.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Status Disclosure' (General Code, Sec 3(1)(a) & Sec 4) must provide the client with key information about the FSP. This includes contact details for the FSP and, specifically, the name and contact details of the Compliance Officer, who handles compliance and complaints.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 619,
    "questionText": "An FSP's Key Individual (KI) owns 50% of the shares in a specific Product Supplier. This ownership stake must be disclosed to clients because it constitutes a significant:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness concern.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence breach.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Conflict of Interest.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "FIC Act breach.",
        "isCorrect": false
      }
    ],
    "explanation": "A 'Conflict of Interest' (General Code, Sec 3(1)(c)) includes any ownership interest that could influence advice. If the KI (who manages the FSP) also owns the Product Supplier, there is a clear conflict: they have an incentive to push that supplier's products. This *must* be disclosed.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 620,
    "questionText": "The rule for replacement advice is stricter because the Representative must clearly disclose any detrimental effect the replacement may have on the client's position. Choose the best example.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Loss of a tax deduction.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Loss of a specific product benefit or vested right in the original policy.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Lower commission for the Representative.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP to be audited.",
        "isCorrect": false
      }
    ],
    "explanation": "Replacement advice (General Code, Sec 7(2)) is high-risk. The representative *must* conduct a detailed comparison and specifically warn the client of any potential negative consequences, such as new waiting periods, higher fees, or the loss of a 'vested right or benefit' (e.g., a guaranteed bonus) on the old policy.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 621,
    "questionText": "The Representative must ensure that all product information disclosed to the client is factually correct. This is required under the Code of Conduct to ensure:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client is honest.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The communication is not misleading.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP is profitable.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The product is the cheapest.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 4(1)) requires all disclosures and communications to be 'factual, clear, and not misleading'. Providing factually incorrect information would be a direct breach of this duty, as it would mislead the client.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 622,
    "questionText": "A Representative is required to obtain information on the client's current financial products and policies. This is necessary to determine:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's potential commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client's level of financial literacy.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The suitability of a new product (needs analysis).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's tax liability.",
        "isCorrect": false
      }
    ],
    "explanation": "A needs analysis (General Code, Sec 7 & 8) must be holistic. The representative cannot determine if a *new* product is suitable without first understanding the client's *existing* products. The new product might be unnecessary, or it might be a 'replacement', which triggers other rules.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 623,
    "questionText": "The FSP must ensure that its electronic record-keeping system allows for the easy retrieval of a client’s advice record within a reasonable timeframe. This is critical for efficient:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compliance and complaint investigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tax deduction.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD audit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requires records to be 'readily accessible'. This is to ensure that when the FSCA audits the FSP or the Ombud investigates a complaint, the FSP can retrieve the necessary records promptly to prove its compliance.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 625,
    "questionText": "A Representative documents the advice but fails to include the signed declaration from the client confirming they received the Conflict of Interest disclosure. The FSP may face difficulty proving compliance with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure and record keeping.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act CDD.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code requires disclosure of conflicts (Sec 3(1)(c)). The 'Record of Advice' (Sec 3(4)) is the FSP's *proof* that it complied with this disclosure. Without a signed record, the FSP has no evidence to show an auditor or the Ombud that it complied with its disclosure *and* record-keeping duties.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 626,
    "questionText": "The minimum 5-year record-keeping period applies to records of the financial service rendered, as well as to records of the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing campaigns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Representative register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product Supplier's brochures.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Client's tax returns.",
        "isCorrect": false
      }
    ],
    "explanation": "The 5-year rule (Code of Conduct, Sec 3(4) & FAIS Act, Sec 18) applies to all records related to the FSP's compliance and services. This includes the FSP's representative register, which documents all appointments, mandates, and compliance statuses (e.g., debarments).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 627,
    "questionText": "The FSP must ensure that all records are securely kept. For electronic records, this includes protection against:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "High transaction volume.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Cyber-attacks, fire, or theft.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Representative's personal debt.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Client complaints.",
        "isCorrect": false
      }
    ],
    "explanation": "The requirement for secure storage (FAIS Act, Sec 18(1)) means protecting records from loss, damage, or unauthorized access. This is part of the FSP's 'Operational Ability' and requires having adequate IT security (against cyber-attacks) and business continuity (backups against fire/theft).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 629,
    "questionText": "A Representative suspects a client is using a complex series of transactions to move funds that may be linked to criminal activity. What must the Representative do?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ask the client for clarification, which may constitute 'tipping-off'.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Refuse the transaction and inform the client of the suspicion.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "File an STR immediately, without informing the client.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Wait for the FIC to contact the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires an STR based on 'suspicion'. The complex transactions are suspicious. The representative *must* file an STR immediately (or via their compliance officer) and *must not* inform the client (due to the 'Tipping-Off Prohibition').",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 630,
    "questionText": "The FIC Act mandates that the FSP adopts a **Risk-Based Approach (RBA)**. This approach requires the FSP to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Only take on low-risk clients.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Allocate resources and controls proportionate to the assessed money laundering risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Report all transactions to the FIC.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Ignore product risk.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) means FSPs must identify and assess their unique ML/TF risks. They must then implement controls that are *proportionate* to those risks—applying more stringent controls (like EDD) to high-risk areas and simplified controls (SDD) to low-risk areas.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 631,
    "questionText": "The **Tipping-Off Prohibition** under the FIC Act is designed to prevent a client who is engaged in criminal activity from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Filing a complaint with the Ombud.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Moving funds or destroying evidence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Changing their financial advisor.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Paying their tax liability.",
        "isCorrect": false
      }
    ],
    "explanation": "'Tipping-off' (FIC Act, Sec 29(3)) is a criminal offence. Its purpose is to protect the integrity of a potential investigation. Alerting the suspect would allow them to take evasive action, such as 'moving funds' (to a different account/country) or 'destroying evidence'.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 632,
    "questionText": "An FSP identifies a prospective client as a close business associate of a **Politically Exposed Person (PEP)**. The FSP's due diligence should include:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Simplified Due Diligence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Standard Due Diligence only.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Enhanced Due Diligence (EDD).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Waiving the CDD requirement.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) definitions for high-risk individuals include PEPs themselves, their immediate family, and their 'known close associates'. A close business associate is considered high-risk by association and *must* be subjected to full 'Enhanced Due Diligence' (EDD).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 633,
    "questionText": "If an FSP fails to comply with the FIC Act's reporting requirements, the FIC has the power to impose **Administrative Sanctions**, which can include:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A suspension of the FSP's FAIS license.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A recommendation for new management.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Monetary penalties and restrictions on business.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A mandatory re-write of the RE1 exam.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) gives the FIC its own enforcement powers. These 'Administrative Sanctions' are civil penalties and include reprimands, directives, business restrictions, and significant monetary penalties (fines).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 634,
    "questionText": "The FSP's **Risk Management and Compliance Programme (RMCP)** must be formally documented and approved by:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The external auditor.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSCA.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP's senior management/board.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FAIS Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) is the FSP's internal AML/CFT governance framework. The Act places the ultimate responsibility for approving this programme on the FSP's highest governing body: its Board of Directors or (if none) its Senior Management.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 638,
    "questionText": "The client has **six months** to refer the complaint to the FAIS Ombud after the FSP's final response. This deadline is a statutory limitation on the Ombud's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Monetary limit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Jurisdiction in time.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Staffing capacity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Training requirements.",
        "isCorrect": false
      }
    ],
    "explanation": "This 6-month deadline (Ombud Rules, Rule 7(3)) is a 'prescription period'. It is a legal time limit. If the client lodges the complaint after this period, the Ombud no longer has the legal authority or 'jurisdiction in time' to hear the matter.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 639,
    "questionText": "A Final Determination issued by the FAIS Ombud is **binding** on the parties. This means that if the FSP does not appeal, the FSP must:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Obtain approval from the FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Comply with the order to pay compensation or take corrective action.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only comply if the client sues.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only comply if the amount is less than R10,000.",
        "isCorrect": false
      }
    ],
    "explanation": "A 'binding' determination (FAIS Act, Sec 28(5)) means it has the force of law. If the FSP does not appeal to the FST, it has no choice but to comply with the Ombud's order, whether it is to pay compensation or take another specified action.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 640,
    "questionText": "The FAIS Ombud may try to resolve a dispute through **conciliation**. The goal of conciliation is to facilitate:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A formal court hearing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A voluntary and mutually acceptable settlement.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Ombud making a binding ruling.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP admitting guilt immediately.",
        "isCorrect": false
      }
    ],
    "explanation": "Conciliation (or mediation) (Ombud Rules, Rule 3) are forms of alternative dispute resolution. The Ombud's office facilitates a discussion between the two parties to help them reach a *voluntary* settlement that both sides find acceptable, avoiding the need for a formal determination.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 645,
    "questionText": "The KI must ensure the FSP has adequate resources to maintain its Operational Ability. Which of the following are examples of this?\n\ni. Sufficient and competent staff.\nii. Adequate and secure IT systems.\niii. A Business Continuity Plan.\niv. High annual profits.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (Sec 17(1)) covers 'Operational Ability'. This means ensuring the FSP has adequate resources, which includes 'sufficient staff' (i), 'technical resources' like IT (ii), and a Business Continuity Plan (iii). Profit (iv) relates to financial performance, not operational ability.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 646,
    "questionText": "The main distinction between a **Tier 1** product and a **Tier 2** product under the FAIS Act relates to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The complexity and risk profile of the product.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's license category.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's age.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) and its subordinate legislation create two tiers of products. Tier 2 products (e.g., funeral policies) are those deemed to be simple and low-risk. Tier 1 products are all others, which are considered more complex and/or carry higher risks, thus requiring stricter competence standards (like the RE5).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 647,
    "questionText": "A Representative fails to adequately explain to a client the potential for capital loss in a unit trust investment. This breach of the Code of Conduct relates to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Conflict of Interest.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suitability and disclosure of risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Record Keeping.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3 & 4) requires full disclosure of all material information, especially risk. A unit trust carries the risk of capital loss. Failing to explain this risk means the client cannot make an informed decision, and the product may be 'unsuitable' for their risk tolerance.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 648,
    "questionText": "A Representative must possess adequate knowledge of the financial products they advise on. This is required under the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Product knowledge is a core component of the 'Competence' pillar (FAIS Act, Sec 13(1)). A representative cannot be deemed competent to provide advice if they do not have adequate knowledge of the specific products they are mandated to advise on, ensuring they can provide accurate and suitable advice.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 649,
    "questionText": "Which risk is associated with the potential for the value of an investment to decrease due to broad economic factors or market sentiment?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market Risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Credit Risk.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Market Risk' (or systematic risk) is the risk that an entire market or asset class will fall in value due to broad economic, political, or social events. It is a risk that cannot be eliminated through diversification.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 650,
    "questionText": "The Representative must disclose all material information regarding the financial product, including any contractual penalties for early withdrawal. This is required to ensure the client understands the product's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Full cost and obligations.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Representative’s commission.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "FIC Act compliance status.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Tax treatment.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 4(1)) requires full and fair disclosure of all material facts. Penalties for early withdrawal are a material fact that the client *must* know to understand their contractual obligations and the full potential cost of the product.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 651,
    "questionText": "Ms. Zama, a Representative, recommends that a client accepts an offer to take out a new short-term insurance policy. This action is classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An intermediary service only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product supply.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Factual information.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'advice' as any 'recommendation, guidance or proposal of a financial nature'. Recommending that a client *accept an offer* for a financial product is a clear recommendation and thus constitutes financial advice.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 652,
    "questionText": "If a Representative fails the RE5 for a Tier 1 product, the immediate consequence is debarment and removal from the register. What is the Representative prohibited from doing until re-appointed?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Working in an administrative role for the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Rendering any financial services as a Representative.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Conducting CPD training.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Submitting their annual tax return.",
        "isCorrect": false
      }
    ],
    "explanation": "Debarment (FAIS Act, Sec 14) means the person is no longer a 'representative'. The direct consequence is that they are prohibited from rendering *any* financial service (both advice and intermediary services) on behalf of *any* FSP. They can still work in an administrative (non-FAIS) role (A).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 653,
    "questionText": "Which entity is **NOT** typically required to be a licensed FSP?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A discretionary fund manager.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A person providing advice on shares and securities.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A Product Supplier providing advice only on its own products.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "A person providing intermediary services on life insurance.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides specific exemptions. A 'Product Supplier' (e.g., a bank or insurer) is generally exempt from the Act *only* in relation to the advice or intermediary services it provides on its *own* products. A, B, and D are all activities that require an FSP license.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 654,
    "questionText": "The FSP must ensure that its compliance systems and staff are adequately trained and supervised. This ensures compliance with the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes its human resources, training processes, and internal controls (like supervision). These systems are all part of the operational infrastructure needed to run a compliant business.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 655,
    "questionText": "The FAIS Act requires all financial services to be rendered with due care, skill, and diligence. This principle is intended to ensure that clients receive:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Guaranteed returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Professional and ethical treatment.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The cheapest product available.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Minimal disclosure.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the core standard of conduct from the General Code of Conduct (subordinate to the FAIS Act). Its purpose is to professionalize the industry and protect consumers by mandating a high standard of professional, fair, and ethical treatment, rather than guaranteeing financial outcomes (A) or mandating specific prices (C).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 656,
    "questionText": "An FSP must inform the FSCA immediately if a Representative's services are terminated due to the Representative:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Resigning due to a family move.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Being debarred for non-compliance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Taking annual leave.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Completing their CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "While all terminations (including resignation A) must be reported, a 'debarment' (FAIS Act, Sec 14(1)) for non-compliance is the most critical. The FSP *must* immediately notify the FSCA of the debarment and the reasons for it.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 659,
    "questionText": "A Representative is discovered to have knowingly manipulated client policy values to generate higher commission for themselves. This is a severe breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "This action is fraudulent, dishonest, and unethical. It involves deceiving the client and the FSP for personal gain. This is a severe and direct breach of the 'Honesty and Integrity' requirement (Fit & Proper, Sec 7) and would lead to debarment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 660,
    "questionText": "The FSP must have adequate internal controls to prevent fraud, negligence, and non-compliance. This is a core component of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) is its internal framework for managing the business. A fundamental part of this is having 'adequate and effective systems of internal control' to manage risk and prevent issues like fraud, negligence, and non-compliance.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 661,
    "questionText": "A Representative has been under supervision for 4 years but still requires supervision due to poor practical application. The FSP must ensure that the Representative achieves full competence or is debarred before:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's next audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative passes the RE5.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The 5-year maximum supervision period expires.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Representative reaches 10 years of experience.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 25) set a *maximum* supervision period of 60 months (5 years). The FSP must ensure the representative becomes fully competent *within* this period. If they reach the 5-year mark and are still not competent, they fail the competence requirement and must be debarred.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 662,
    "questionText": "The FSP must ensure that its supervisory regime for Representatives is clearly documented and effective. This falls under the FSP's duty for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "A supervision regime is a key internal control for managing human resources and ensuring compliance. This, like all internal controls and processes, falls under the FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 663,
    "questionText": "If a Representative fails to maintain their CPD hours, their ability to render financial services is suspended because they have breached the requirement for ongoing:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence (Knowledge).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is the requirement for *maintaining* competence. If a representative fails to do their CPD, they no longer meet the 'Competence' requirement and are thus no longer Fit and Proper. The FSP must suspend them until the breach is rectified.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 664,
    "questionText": "The requirement that a Representative must be of **'good standing'** is part of the FSP's ongoing duty to ensure the Representative meets the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "'Good standing' (FAIS Act, Sec 8(1)(a)) relates to a person's character. It is the core of the 'Honesty and Integrity' requirement, meaning the person is law-abiding and has not been disqualified for acts of dishonesty, fraud, or other serious misconduct.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 665,
    "questionText": "If an FSP decides to debar a Representative, the FSP must inform the FSCA immediately. The reason for the debarment must be:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Kept confidential.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Submitted to the FSCA.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Published in a newspaper.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only informed to the client.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) is explicit: the FSP must 'immediately' notify the FSCA of the debarment *and* \"inform the Authority of the reasons for the debarment\". This is to allow the FSCA to assess the severity and update the central register accordingly.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 666,
    "questionText": "The FSP must maintain adequate **capital adequacy**. This is a measure to ensure the FSP's financial resources are sufficient to meet its:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing budget.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Investment performance goals.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Liabilities and obligations.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD targets.",
        "isCorrect": false
      }
    ],
    "explanation": "'Capital adequacy' (Fit & Proper, Sec 4) is a key part of 'Financial Soundness'. It means the FSP must hold sufficient capital (assets over liabilities) to ensure it can meet all its financial obligations and liabilities as they fall due, protecting clients from FSP insolvency.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 668,
    "questionText": "A Representative fails to inform a client about the availability of the FAIS Ombud's complaints process. This is a failure to comply with the Code of Conduct's requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Status disclosure and client relations.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Conflict of Interest disclosure.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(a) & Sec 16) requires the FSP to disclose its complaints procedure, including the details of the FAIS Ombud. This is part of the initial 'status disclosure' and a key requirement for fair 'client relations'.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 669,
    "questionText": "The FSP must implement its **Conflict of Interest Management Policy**. The goal of mitigation in this policy is to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Eliminate all conflicts.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Reduce the risk that the conflict will harm the client's interests.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Disclose the conflict to the FSCA only.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Increase the Representative's commission.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 3(1)(c)) requires FSPs to 'avoid, or where avoidance is not possible, mitigate' conflicts. 'Mitigation' means implementing controls to reduce or manage the conflict, ensuring that it does not bias the advice or harm the client's interests.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 670,
    "questionText": "If a Representative provides replacement advice, they must provide the client with a written comparison showing the disadvantages of the replacement. This comparison is required to ensure the client is aware of the potential loss of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Vested rights or benefits.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's license.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's tax deduction.",
        "isCorrect": false
      }
    ],
    "explanation": "Replacement advice (General Code, Sec 7(2)) is high-risk. The representative *must* conduct a detailed comparison and specifically warn the client of any potential negative consequences, such as new waiting periods, higher fees, or the loss of a 'vested right or benefit' (e.g., a guaranteed bonus) on the old policy.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 671,
    "questionText": "The Representative must disclose the fees and charges of the financial product. This is essential for the client to understand the product's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Complexity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Risk profile.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Full cost.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Liquidity.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 4(1)) requires full and fair disclosure so clients can make informed decisions. Disclosing all fees and charges is essential for the client to understand the *full cost* of the investment, which is a material factor in their decision.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 672,
    "questionText": "A Representative fails to document the steps taken during the needs analysis, meaning there is no proof that the advice was suitable. This is a breach of the duty to act with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Due care, skill, and diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The duty to act with 'due care, skill, and diligence' (General Code, Sec 7) includes the *entire* advice process. This includes not only *doing* the needs analysis but also *documenting* it properly in the Record of Advice. Failure to document is a failure of diligence and a breach of the record-keeping rules.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 673,
    "questionText": "The FSP must ensure that its record-keeping system allows for the easy retrieval of a client’s advice record within a reasonable timeframe. This is critical for efficient:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Marketing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Compliance and complaint investigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tax deduction.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD audit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requires records to be 'readily accessible'. This is to ensure that when the FSCA audits the FSP or the Ombud investigates a complaint, the FSP can retrieve the necessary records promptly to prove its compliance.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 675,
    "questionText": "The record of advice must include evidence that the Representative informed the client of the contact details of the FAIS Ombud. This is necessary to prove compliance with the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Disclosure and client relations.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act CDD.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Record of Advice' (Code of Conduct, Sec 3(4)) must prove compliance. Disclosing the Ombud's details is a key 'Disclosure' requirement (Sec 4) and part of fair 'Client Relations' (Sec 16). The record must contain proof this disclosure was made to the client.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 677,
    "questionText": "A Key Individual (KI) notices that the FSP’s electronic client records are stored on a single server without any backup or security. This is a severe breach of the FSP’s duty regarding:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability (Data Security and BCP).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Record keeping (FAIS Act, Sec 18) and the systems to support it are a core part of 'Operational Ability'. Storing all data on one server with no backup or security is a critical failure of IT controls, data security, and business continuity planning (BCP), all of which fall under Operational Ability.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 683,
    "questionText": "A FSP is found to have a pattern of late STR submissions. This systemic failure exposes the FSP to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A voluntary compliance review.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Administrative sanctions from the FIC.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A warning from the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The immediate suspension of its license.",
        "isCorrect": false
      }
    ],
    "explanation": "Failure to report STRs 'immediately' is a breach of Sec 29 of the FIC Act. A systemic pattern of this failure would be viewed as serious non-compliance, for which the FIC can impose 'Administrative Sanctions' under Sec 45B, including significant fines.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 684,
    "questionText": "The FSP's **RMCP** must be submitted to the FIC:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "For initial approval.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "For quarterly review.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "When the FSP first becomes an Accountable Institution and whenever there are material changes.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only if the FIC requests it.",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 42A) requires the RMCP to be documented and approved by the board, and made available to the FIC *on request*. It is not a document that requires pre-approval or is submitted by default (unlike a registration). *Correction: The most accurate answer is that it must be available on request.*",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 685,
    "questionText": "The FSP's internal complaint resolution procedure must be easily understandable and readily available to the client. This ensures the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Right to privacy.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Right to redress.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Right to choose a new FSP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Right to guaranteed returns.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16) mandates this procedure to ensure 'Treating Customers Fairly'. An accessible and transparent complaints process is fundamental to ensuring a client's 'right to redress' (the right to complain and have it resolved fairly).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 686,
    "questionText": "An FSP must respond to a written complaint within six weeks. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "This period is measured in working days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "This period is measured in calendar days.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "This period is a guideline and not a strict rule.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "This period can be extended by the FSP without the client's consent.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(1)) specify 'six weeks'. In regulatory terms, unless 'business days' or 'working days' are specified, the period refers to calendar days (i.e., 42 calendar days).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 688,
    "questionText": "A client receives the FSP's final response on 1 June. If the client refers the complaint to the Ombud on 15 December, the Ombud is most likely to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Accept the late referral.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Reject the complaint as out of time.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Impose a fine on the FSP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Refer the matter to the FST.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(3)) set a 6-month (six-month) prescription period. This period starts from the date of the FSP's final response. 15 December is more than 6 months after 1 June, so the client has missed the deadline, and the Ombud will reject the complaint as 'prescribed' (out of time).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 689,
    "questionText": "If the FAIS Ombud issues a Final Determination, and the FSP appeals, the appeal is heard by the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "High Court.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "FSCA.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Services Tribunal (FST).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination by the Ombud (FAIS Act, Sec 28(5)) is legally binding. The established appeal route for an aggrieved party is not the High Court (initially) or the FSCA, but rather an application for reconsideration to the Financial Services Tribunal (FST).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 690,
    "questionText": "The FAIS Ombud's jurisdiction is limited by its monetary limit. The primary purpose of this limit is to reserve high-value claims for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FIC.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The civil courts.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud (FAIS Act, Sec 27(3)) is for informal, quick resolution and has a monetary cap (R800,000). Claims for damages that exceed this amount are considered too large and complex for this process and must be pursued through the formal civil court system.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 692,
    "questionText": "The KI must ensure the FSP maintains a proper record-keeping system for all advice and mandates. This is a component of the FSP's ongoing obligation regarding:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Record keeping (FAIS Act, Sec 18) is a fundamental internal process. The 'Operational Ability' pillar (Sec 8(1)(d)) is the requirement to have all such systems, processes, and controls in place. The KI is responsible for overseeing this ability.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 695,
    "questionText": "The KI must ensure the FSP has adequate systems and controls to manage and resolve client complaints fairly. This is a component of the KI's duty concerning:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The internal complaints process is a key internal control system. The KI's oversight duty (Sec 17(1)) for 'Operational Ability' includes ensuring this system is in place, documented, effective, and fair, as required by the Code of Conduct.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 696,
    "questionText": "An investment in a **Collective Investment Scheme (CIS)** is categorized as a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tier 2 product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Tier 1 product.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Simple banking deposit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Derivative.",
        "isCorrect": false
      }
    ],
    "explanation": "A Collective Investment Scheme (CIS), or unit trust, is an investment product that carries market risk. Due to its complexity relative to simple products, it is classified as a 'Tier 1' product (FAIS Act, Sec 1), which means representatives advising on it must pass the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 699,
    "questionText": "The risk that the value of an investment will decline due to a negative event affecting the specific company or sector is known as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Market Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Specific Risk (or Unsystematic Risk).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the definition of 'Specific Risk' (also called 'unsystematic risk'). It is the risk that is specific to a single company, industry, or sector (e.g., a mine strike, a new regulation). This type of risk *can* be mitigated through diversification, unlike Market Risk.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 700,
    "questionText": "The Representative must disclose whether the FSP receives any non-monetary benefit (e.g., training, equipment) from a Product Supplier. This is required for transparency regarding potential:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax deductions.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Conflicts of interest.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act reports.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD hours.",
        "isCorrect": false
      }
    ],
    "explanation": "Non-monetary benefits (like gifts, travel, or equipment) from a Product Supplier are a form of remuneration. The Code of Conduct (Sec 4) requires their disclosure because they create a 'Conflict of Interest' that could (or could appear to) influence the FSP to favour that supplier.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 701,
    "questionText": "Mr. Ndlovu, a Representative, advises a client to increase their risk exposure in a unit trust investment. Which ONE of the following best describes this action in terms of the FAIS Act?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An intermediary service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A factual disclosure.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Excluded business.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'advice' as any 'recommendation, guidance or proposal of a financial nature'. Advising a client to change their risk exposure is a clear recommendation regarding their financial product and thus constitutes 'financial advice'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 702,
    "questionText": "A Representative is appointed for a Tier 1 product. From which ONE of the following dates is the two-year deadline for passing the RE5 exam calculated?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Date of passing the academic qualification.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Date of first appointment as a Representative.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Date of submitting the first client application.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Date of the FSP's license issue.",
        "isCorrect": false
      }
    ],
    "explanation": "The 24-month (two-year) clock for meeting the regulatory exam (RE5) requirement (FAIS Act, Sec 13(1)(a)) starts ticking from the 'date of first appointment' (DOFA) – the very first date the person was appointed as a representative for a Tier 1 product in the industry.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 703,
    "questionText": "A Product Supplier (an Insurer) sells its own simple insurance policies directly to the public, but its staff only provide factual information and do not provide advice. Which ONE of the following statements is correct regarding its FSP status?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "It must be licensed as a Category I FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "It is exempt from the FAIS Act for this specific activity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "It must be licensed as a Category II FSP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "All its staff must write the RE5 exam.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides exemptions. A 'Product Supplier' (like an insurer) that provides factual information on its *own* products and does not provide advice is generally exempt from the FAIS Act for that specific activity.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 704,
    "questionText": "An FSP must ensure that its compliance systems and internal controls are regularly updated to reflect new legislation. This is a component of which Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes its internal control and compliance systems. This is not a static requirement; the FSP must have the operational capacity to monitor legislative changes and update its systems and processes accordingly.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 706,
    "questionText": "If a Representative is suspended due to an internal investigation into potential fraud, the FSP must notify the FSCA immediately. The notification must include:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal bank details.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative's CPD history.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The reasons for the suspension.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The client's complaint history.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) mandates that if an FSP suspends a representative, it must 'immediately' notify the FSCA (the Authority) and \"inform the Authority of the reasons for the suspension\". This is to allow the regulator to monitor the situation.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 708,
    "questionText": "A Representative who is appointed only to execute the sale of a Tier 1 product, without giving advice, is generally **exempted** from the RE5 examination because they are not rendering:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A financial service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A Tier 2 service.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A Category II service.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a key distinction. The RE5 (FAIS Act, Sec 13) is required for those who render 'advice'. A person performing *only* 'execution of sales' (an intermediary service, but one that explicitly excludes advice) is not rendering advice and is therefore exempt from the RE5, even if the product is Tier 1.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 709,
    "questionText": "A Representative is facing civil litigation for gross negligence that resulted in a client losing a significant sum of money. This situation immediately calls into question the Representative's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) for 'Honesty and Integrity' cover 'good standing' and character. Gross negligence, especially resulting in client loss, is a serious failure of professional conduct and integrity, and may disqualify the representative.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 710,
    "questionText": "The FSP's **Operational Ability** requires adequate internal controls. Which scenario demonstrates a failure of this *specific* requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative fails to pass the RE5 on time.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP uses client money for its operational expenses.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP's internal risk management policy is poorly implemented.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP has insufficient liquid capital.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) is about having the *systems* and *controls* in place. A is a 'Competence' failure. B is 'Honesty/Integrity'. D is 'Financial Soundness'. C is an 'Operational Ability' failure because the internal control (the risk policy) is not being implemented effectively.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 711,
    "questionText": "A Representative operating under supervision for a Category I product is nearing the 5-year maximum period. If they are still not competent, which ONE of the following actions must the FSP take?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Extend the supervision for another 5 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately debar them.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Apply to the FSCA for an exemption.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Transfer them to an advice-only role.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 22) set a *maximum* supervision period of 60 months (5 years). This deadline is final. If the representative has not met the experience requirement by this date, they have failed to meet the 'Competence' requirement and *must* be debarred.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 712,
    "questionText": "The FSP's operational requirements include ensuring it has sufficient staff and resources to handle the volume of its business. This relates to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having adequate 'human resources' and administrative processes. An FSP must have enough competent staff to service its clients and manage its compliance obligations effectively.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 713,
    "questionText": "The qualification requirement for a Representative is designed to ensure the Representative has the necessary educational background to understand the complexity of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSP's tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial products and regulatory framework.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Key Individual's duties.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The formal 'Qualification' (Fit & Proper, Sec 26) is part of the 'Competence' pillar. Its purpose is to ensure the representative has a minimum level of education to understand the financial products they will advise on and the regulatory framework (like FAIS) they must operate within.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 715,
    "questionText": "If the FSP fails to inform the FSCA immediately after debarring a representative for dishonesty, what is the regulatory status of the Representative?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative is still legally deemed authorized by the FSCA.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The Representative is automatically re-instated.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The FSP must pay a fine to the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The debarment is still effective but only for the FSP.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSCA maintains the central, public register of authorized representatives (FAIS Act, Sec 13). A debarment is only effective *after* the FSP has informed the FSCA and the register is updated. If the FSP fails to notify the FSCA, the register remains unchanged, and the representative is still (wrongfully) listed as authorized.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 716,
    "questionText": "The Financial Soundness requirement aims to protect clients by ensuring the FSP has enough liquid resources to meet its liabilities and deal with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Client complaints only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Unexpected losses or claims.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Representative CPD costs.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Marketing expenses.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Financial Soundness' requirements (Fit & Proper, Sec 4) are about solvency and capital adequacy. This financial buffer is required so the FSP can remain a 'going concern' and can withstand 'unexpected losses or claims' without going insolvent and harming clients.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 719,
    "questionText": "An FSP's Conflict of Interest Management Policy must be reviewed at least annually to ensure it remains:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Short and concise.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Effectively implemented and accurate.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Approved by the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Secret from the FSCA.",
        "isCorrect": false
      }
    ],
    "explanation": "A compliance policy (like the CoI policy required by Sec 3(1)(c)) is a living document. It must be reviewed regularly (at least annually) to ensure it is still accurate, relevant to the business, and being *effectively implemented* to manage conflicts.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 720,
    "questionText": "When advising on a replacement product, the Representative must provide the client with a written comparison showing the disadvantages of the replacement. This comparison is required to ensure the client is aware of the potential loss of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Vested rights or benefits.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's license.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's tax deduction.",
        "isCorrect": false
      }
    ],
    "explanation": "Replacement advice (General Code, Sec 7(2)) is high-risk. The representative *must* conduct a detailed comparison and specifically warn the client of any potential negative consequences, such as new waiting periods, higher fees, or the loss of a 'vested right or benefit' (e.g., a guaranteed bonus) on the old policy.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 722,
    "questionText": "A Representative fails to provide a client with a clear, written record of the advice given, including the basis for the suitability recommendation. This is a failure to comply with the rules for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Record Keeping and disclosure.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act reporting.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Code of Conduct (Sec 9) mandates that a 'Record of Advice' *must* be kept and provided to the client. This record *must* include the basis for the suitability recommendation (Sec 3(4)). Failing to do this is a breach of both the 'Record Keeping' rules and the 'Disclosure' rules.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 726,
    "questionText": "Which of the following records must be retained for the minimum 5-year period as per the FAIS Act and General Code of Conduct?\n\ni. Records of advice to clients.\nii. The FSP's representative register.\niii. The FSP's complaints register.\niv. Records of staff CPD and qualifications.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i and iii only",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "i, ii, and iii only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii and iv",
        "isCorrect": true
      }
    ],
    "explanation": "The 5-year rule (Code of Conduct, Sec 3(4) & FAIS Act, Sec 18) applies to all records related to the FSP's compliance and services. This includes advice (i), the representative register (ii), the complaints register (iii), and records of competence like CPD (iv).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 727,
    "questionText": "The FSP must ensure that client records are kept in a secure location and are readily accessible for inspection by the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "FSCA.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Client's attorney.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Representative's family.",
        "isCorrect": false
      }
    ],
    "explanation": "The primary purpose of the record-keeping rules (FAIS Act, Sec 18(1)) is regulatory oversight and client protection. FSPs must be able to retrieve records 'readily' for inspection by the regulator (the *FSCA*) or the dispute resolution body (the FAIS Ombud).",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 729,
    "questionText": "If the FSP forms a suspicion that a transaction may involve money laundering, it must file an STR. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The STR must be filed within 3 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The STR must be filed immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The STR is only required if the transaction is over R50,000.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The STR must be filed after receiving legal advice.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires reporting 'as soon as reasonably possible' after a suspicion is formed. This is interpreted as 'immediately' and without undue delay. The trigger is 'suspicion', not a monetary threshold.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 730,
    "questionText": "The FSP's **Risk-Based Approach (RBA)** requires that the FSP's controls are more stringent for clients with a complex financial structure than for local, known, public institutions. This proportionality is necessary to manage:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Money laundering risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Product liquidity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Tax compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) requires a proportionate response. Complex structures are high-risk for 'money laundering' (as they can hide funds), while public institutions are low-risk. The RBA dictates applying stringent controls (EDD) to the high-risk client and simplified controls (SDD) to the low-risk one.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 731,
    "questionText": "The **Tipping-Off Prohibition** under the FIC Act prevents the FSP from informing the client about the submission of an STR. This is necessary to prevent:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A breach of the FAIS Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The client from frustrating the investigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP from being audited.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client from complaining to the Ombud.",
        "isCorrect": false
      }
    ],
    "explanation": "'Tipping-off' (FIC Act, Sec 29(3)) is a criminal offence. Its purpose is to protect the integrity of a potential investigation. Alerting the suspect would allow them to take evasive action (like moving funds or destroying evidence), thereby 'frustrating the investigation'.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 732,
    "questionText": "When identifying a client that is a company, the FSP must take reasonable steps to verify the identity of the **Beneficial Owner (BO)**, who is the natural person who ultimately:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Manages the company's marketing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Submits the company's tax return.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Controls the company or benefits from its funds.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Is listed on the JSE.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21B) requires FSPs to 'look through' a company to find the 'Beneficial Owner'. This is the *natural person* (human) who ultimately controls the company (e.g., through voting rights) or benefits from its funds (e.g., through ownership of 25% or more of the shares).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 733,
    "questionText": "An FSP is found to have a pattern of late STR submissions. This systemic failure exposes the FSP to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A voluntary compliance review.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Administrative sanctions from the FIC.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A warning from the FSCA.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The immediate suspension of its license.",
        "isCorrect": false
      }
    ],
    "explanation": "Failure to report STRs 'immediately' is a breach of Sec 29 of the FIC Act. A systemic pattern of this failure would be viewed as serious non-compliance, for which the FIC can impose 'Administrative Sanctions' under Sec 45B, including significant fines.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 734,
    "questionText": "The FSP's **RMCP** must be a comprehensive document that is routinely subjected to internal testing. Choose the best answer describing the purpose of this testing.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "To ensure the RMCP is profitable.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "To ensure the RMCP is effective in detecting and preventing money laundering.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "To ensure the RMCP is aligned with the FSP's marketing.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "To ensure the RMCP is as short as possible.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) is the FSP's 'program' for fighting financial crime. The FSP must regularly test this program to ensure its internal controls are *effective* in achieving the Act's goals: identifying, assessing, mitigating, and reporting money laundering and terrorist financing risks.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 735,
    "questionText": "The FSP's internal complaint resolution procedure must be easily understandable and readily available to the client. This is a requirement for transparency and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Accessibility.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 16) mandates this procedure. The principles are that it must be 'transparent' (clear to the client), 'fair' (unbiased), and 'accessible' (easy for the client to find and use without unreasonable barriers).",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 739,
    "questionText": "The FAIS Ombud's Final Determination is legally binding on the FSP and Representative. This determination can be enforced as if it were a judgment of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSCA.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "High Court.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's internal board.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 28(5)) gives the Ombud's determination its legal power. If not appealed, it is 'deemed to be a civil judgment' of a court. This means the client can use the determination to apply for a writ of execution, just as if they had a High Court judgment.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 740,
    "questionText": "Which ONE of the following is a limitation on the FAIS Ombud's jurisdiction?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The complexity of the financial product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative's honesty.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The monetary value of the claim.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The FSP's compliance with the FIC Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 27(3)) places two key limitations on the Ombud's jurisdiction: a time limit (prescription) and a 'monetary value' limit (currently R800,000). If the client's claim for loss exceeds this amount, the Ombud cannot hear the case.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 747,
    "questionText": "A Representative must ensure the client's financial product recommendation is **suitable**. This requires the Representative to obtain information regarding the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial situation, needs, and objectives.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Representative's CPD.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's annual sales.",
        "isCorrect": false
      }
    ],
    "explanation": "The requirement for 'suitability' (General Code, Sec 3(2) & 8) is met by conducting a 'needs analysis'. This analysis *must* include gathering sufficient information about the client's financial situation (e.g., assets, income), their needs, and their objectives (goals).",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 749,
    "questionText": "Which risk refers to the possibility that an investment cannot be easily sold or redeemed without a loss in value?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Credit Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Liquidity Risk.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Liquidity Risk' is the specific financial term for the risk that an asset cannot be sold or redeemed quickly for its full market value. A representative must disclose this risk to a client as part of the suitability and disclosure process.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 751,
    "questionText": "A Representative assists a client with the administration of their existing unit trust investment by changing the client's debit order details. This service is categorized as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "An intermediary service.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Excluded advice.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product supply.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'Intermediary Service' as any act *other than advice* related to a financial product. Assisting with the 'administration' or 'variation' of a policy, such as changing debit order details, is a classic example of an intermediary service.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 752,
    "questionText": "A Representative fails the RE5 for a Tier 1 product two years and six months after their date of first appointment. The FSP's failure to remove the representative immediately is a breach of which core requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The deadline for the RE5 exam (a 'Competence' requirement) is 24 months (two years) (FAIS Act, Sec 13(1)(a)). By 2 years and 6 months, the representative is long past this deadline. The FSP's failure to debar them is a breach of its duty to ensure its representatives are 'Competent'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 753,
    "questionText": "If a person is appointed only for the execution of sales relating to Tier 1 products, and not for advice or intermediary services, the person is exempted from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The RE5 examination.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP’s license.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 is a competence requirement for representatives who provide 'advice'. A person who *only* performs 'execution of sales' (an intermediary service that is not advice) is exempt from the RE5 requirement (FAIS Act, Sec 13(1)(b)), even if the product is Tier 1.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 755,
    "questionText": "The FAIS Act promotes the professional conduct of FSPs and Representatives, ensuring they act with honesty and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Maximum profitability.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Due care, skill, and diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Minimal record keeping.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "No tax liability.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the core principle of the General Code of Conduct, which is subordinate legislation under the FAIS Act. The full requirement is that all financial services must be rendered 'honestly, fairly, with due skill, care and diligence'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 756,
    "questionText": "If a Representative resigns from an FSP, the FSP must update its register and inform the FSCA immediately. This is required to ensure the FSCA's record of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's CPD hours.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Authorized Representatives is accurate.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's tax compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's complaint history.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSCA maintains the central register of all authorized representatives (FAIS Act, Sec 13). The FSP has a duty to notify the FSCA 'immediately' of any change to a representative's status (including resignation) so the central register remains accurate and the public is protected from unauthorized individuals.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 757,
    "questionText": "A Representative rendering services for funeral benefits (Tier 2) is **not** required to pass the RE5. This exemption is based on the product's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "High-risk profile.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Simplicity and low complexity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Category I classification.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Inclusion in the FSP’s license.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) are tiered. The RE5 exam is for complex Tier 1 products. Funeral benefits are classified as Tier 2 products precisely because of their 'simplicity and low complexity', which is the reason for the RE5 exemption.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 758,
    "questionText": "Which type of financial product is defined as an arrangement in terms of which a client is provided with a benefit under a life insurance policy?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Short-Term Insurance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Long-Term Insurance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Banking Deposit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Health Service Benefit.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the definition of a 'Long-Term Insurance' policy as per the FAIS Act (Sec 1, Definitions), which aligns with the categories in the Insurance Act. It provides benefits on a 'life assured' basis (e.g., on death or after a set term).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 759,
    "questionText": "A Representative is convicted of a non-violent, but financially dishonest, crime seven years ago and attempts to conceal this from the FSP. This compromises their ongoing compliance with the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) for 'Honesty and Integrity' look at a person's character. A conviction for a financially dishonest crime is a major red flag. Attempting to *conceal* this fact from the FSP is a second, separate act of dishonesty, which is a severe breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 760,
    "questionText": "The FSP must have a documented procedure to monitor and manage all regulatory risks. This falls under the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Operational Ability' requirement (FAIS Act, Sec 8(1)(d)) includes the FSP's risk management framework and internal control systems. A documented procedure to monitor and manage regulatory risk is a core component of this operational framework.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 761,
    "questionText": "The supervision period allows a Representative to gain the necessary practical experience. The maximum duration of this supervision for a specific product category is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 22) state that a representative who needs to gain experience must work under supervision. This period of supervision is limited to a *maximum* of 60 months (5 years) from the representative's date of first appointment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 762,
    "questionText": "The FSP must ensure the effective implementation of its anti-money laundering controls and training as required by the FIC Act. This is a requirement related to the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having the necessary internal controls and training programs to comply with *all* applicable legislation. This includes the FSP's operational controls for complying with the FIC Act.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 763,
    "questionText": "The passing of the RE5 examination satisfies the **Regulatory Knowledge** requirement, which is a component of the Fit and Proper pillar of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Competence' pillar (Fit & Proper, Sec 26) is made of three parts: 1) Qualification, 2) Experience, and 3) Regulatory Knowledge. The RE5 (Regulatory Exam 5 for Representatives) is the specific assessment used to prove the 'Regulatory Knowledge' component.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 764,
    "questionText": "The FSP discovers a Representative has been providing advice outside their authorized product mandate. This is a breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence (Scope of Service).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "A representative's 'Competence' (FAIS Act, Sec 13) is specific to the products they are mandated for. Acting outside this mandate (scope of service) means they are rendering services for which they are not deemed competent, which is a direct breach of the competence requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 765,
    "questionText": "If an FSP decides to suspend a Representative due to a compliance issue, the FSP must inform the FSCA immediately and provide:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative's personal tax return.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A detailed explanation of the reasons for the suspension.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A copy of the FSP's financial statements.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's complaint history.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) mandates that if an FSP suspends a representative, it must 'immediately' notify the FSCA (the Authority) and \"inform the Authority of the reasons for the suspension\".",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 766,
    "questionText": "The FSP's **Financial Soundness** requirements ensure that the FSP can continue operating and meet its obligations, specifically by maintaining:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Sufficient liquidity and capital adequacy.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "A large client base.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "High Representative CPD hours.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A low staff turnover rate.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Financial Soundness' requirements (Fit & Proper, Sec 4) are the specific rules about an FSP's finances. They are designed to ensure the FSP remains solvent by maintaining specified levels of 'liquidity' (cash to pay bills) and 'capital adequacy' (assets in excess of liabilities).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 769,
    "questionText": "A Key Individual (KI) pressures Representatives to prioritize products that generate the highest commission for the FSP, even if alternatives are better for the client. This is a failure to actively **mitigate** the conflict of interest by prioritizing:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's revenue over client fairness.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Record keeping over competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "FIC Act compliance over disclosure.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability over financial soundness.",
        "isCorrect": false
      }
    ],
    "explanation": "A conflict of interest (General Code, Sec 3(1)(c)) exists when the FSP's interests (revenue) clash with the client's (best advice). By pressuring reps to sell high-commission products, the KI is *failing* to mitigate this conflict and is instead prioritizing the FSP's revenue over the client's right to fair and suitable advice.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 770,
    "questionText": "If a Representative provides replacement advice, they must provide the client with a written comparison showing the disadvantages of the replacement. Choose the INCORRECT statement.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative must provide a written comparison of the new and old products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative must disclose all costs, fees, and penalties of the switch.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Representative must highlight any loss of benefits, like new waiting periods.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative must get pre-approval from the FAIS Ombud before finalising the switch.",
        "isCorrect": true
      }
    ],
    "explanation": "The General Code of Conduct (Sec 7(2)) requires a written comparison (A), full disclosure of costs (B), and disclosure of lost benefits (C). However, there is no requirement to get pre-approval from the FAIS Ombud (D).",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 771,
    "questionText": "All information provided to the client regarding a financial product must be factual and presented in a way that is clear and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Highly technical.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Not misleading.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only verbal.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Approved by the Product Supplier.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a core principle of disclosure under the General Code of Conduct (Sec 4(1)). All communications, marketing, and advice must be 'factual, clear, and not misleading' to allow clients to make informed decisions.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 776,
    "questionText": "The minimum 5-year record-keeping period applies to records of the financial service rendered, as well as to records of the Representative's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Personal vehicle details.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "CPD completion status.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Annual income.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Personal hobbies.",
        "isCorrect": false
      }
    ],
    "explanation": "Records of a representative's competence, including their qualifications, RE status, and 'CPD completion status', are key compliance records. The FSP must retain these (Code of Conduct, Sec 3(4) & FAIS Act, Sec 18) for 5 years to prove it is monitoring its representatives' Fit and Proper status.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 777,
    "questionText": "The FSP's register of Representatives is a key compliance record. Which of the following details must be included on the register?\n\ni. The Representative's qualifications.\nii. The Representative's regulatory examination status.\niii. The specific product categories the Representative is mandated for.\niv. The Representative's personal sales targets.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "i and ii only",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "i, ii, and iii only",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "i and iv only",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "i, ii, iii, and iv",
        "isCorrect": false
      }
    ],
    "explanation": "The representative register (FAIS Act, Sec 13) is the central record of competence. It must contain all key 'Competence' details, including qualifications (i), regulatory exam status (ii), and their specific mandates (iii). Sales targets (iv) are internal performance metrics, not regulatory data for the register.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 778,
    "questionText": "The FSP must verify the identity of the client **before** establishing a business relationship. This is a requirement for Customer Due Diligence (CDD) which is necessary to mitigate the risk of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Market volatility.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Money laundering.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Poor investment returns.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "High fees.",
        "isCorrect": false
      }
    ],
    "explanation": "The entire purpose of the FIC Act, and therefore CDD (FIC Act, Sec 21), is to combat financial crime. By verifying a client's identity (KYC), the FSP mitigates the risk of its services being used by criminals with fake identities to launder money or finance terrorism.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 779,
    "questionText": "A Representative notices a client is requesting frequent, large cash transactions for a new investment, which contradicts their stated income source. The FSP must immediately file a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Suspicious Transaction Report (STR).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Client Complaint Report (CCR).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Financial Soundness Report (FSR).",
        "isCorrect": false
      }
    ],
    "explanation": "The trigger for an STR (FIC Act, Sec 29) is 'suspicion'. A transaction that is 'inconsistent' with a client's known profile (e.g., large cash transactions that don't match their stated income) is a major red flag for money laundering (proceeds of crime). This suspicion mandates an STR.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 780,
    "questionText": "The FSP's implementation of the **Risk-Based Approach (RBA)** must ensure that the intensity of its controls is appropriate to the level of risk identified across all:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "FSP staff.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Products, clients, and transactions.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "CPD activities.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Marketing materials.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) requires the FSP to assess its ML/TF risk. This risk assessment must consider all facets of the business, including the risk profile of its *clients*, the *products* it sells (e.g., are they high-risk?), and the *transactions* or delivery channels it uses.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 781,
    "questionText": "The Tipping-Off Prohibition strictly prevents the Representative from informing the client that an STR has been filed. This rule is necessary to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Protect the client's reputation.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Ensure the success of the investigation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Maintain the FSP's profitability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Allow the FSP to pay a fine.",
        "isCorrect": false
      }
    ],
    "explanation": "Tipping-off (FIC Act, Sec 29(3)) is a criminal offence. Its purpose is to protect the integrity of a potential investigation. Alerting the suspect would 'prejudice' the investigation by giving them an opportunity to move funds, destroy evidence, or flee.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 782,
    "questionText": "An FSP must apply **Enhanced Due Diligence (EDD)** when establishing a business relationship with a client classified as a **Politically Exposed Person (PEP)**. This is because PEPs inherently pose a higher risk of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Liquidity failure.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market volatility.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Corruption.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Competence failure.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) designates PEPs as high-risk not because they are criminals, but because their prominent public positions make them (and their associates) more vulnerable to being involved in bribery, *corruption*, and subsequent money laundering.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 783,
    "questionText": "The FIC Act is a high-risk compliance area. Failure to adhere to the requirements can result in administrative sanctions such as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A voluntary compliance review.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A fine or business restriction.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A referral to the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The suspension of the FSP's license.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) empowers the FIC to impose 'Administrative Sanctions' for non-compliance. These civil penalties include directives, reprimands, *business restrictions*, and significant *monetary fines*.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 784,
    "questionText": "The FSP's **RMCP** must include a procedure for the ongoing training of employees to ensure they are equipped to comply with the FIC Act. This is required under the internal control component of the RMCP:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product Knowledge.",
        "isCorrect": false
      }
    ],
    "explanation": "The RMCP (FIC Act, Sec 42A) is the FSP's key 'Operational Ability' document for AML. A mandatory component of the internal controls specified in this section is the provision of ongoing staff training on the Act's requirements.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 789,
    "questionText": "If the FAIS Ombud issues a Final Determination against an FSP, and the FSP fails to pay the compensation ordered, the client can apply to the civil court to have the determination enforced as a:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Voluntary agreement.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Court judgment.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Compliance order.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Recommendation.",
        "isCorrect": false
      }
    ],
    "explanation": "A Final Determination (FAIS Act, Sec 28(5)) is 'deemed to be a civil judgment'. If the FSP fails to comply, the client can take the determination to the relevant court, which will then issue a writ of execution to enforce it as if it were its own judgment.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 790,
    "questionText": "The FAIS Ombud will typically not investigate a complaint that falls outside its **monetary limit**. This limitation is designed to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Protect the FSP from all claims.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Ensure high-value claims are handled by the civil courts.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Reduce the FSP's record keeping duties.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Increase the FSP's profitability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud (FAIS Act, Sec 27(3)) is for informal, quick resolution and has a monetary cap (R800,000). Claims for damages that exceed this amount are considered too large and complex for this process and must be pursued through the formal civil court system.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 796,
    "questionText": "Which ONE of the following products is generally classified as a **Tier 1** product, requiring the Representative to pass the RE5 examination?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Health service benefit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A retirement annuity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A funeral policy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A simple banking deposit.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1) product tiers are based on complexity. 'Tier 2' products are simple (A, C, D). A 'Tier 1' product is more complex and carries higher risks. A retirement annuity is a complex, long-term savings and investment product, firmly classified as Tier 1, thus requiring the RE5.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 797,
    "questionText": "The Representative must conduct a thorough needs analysis to ensure product **suitability**. This analysis must include the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Risk tolerance.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FSP's financial soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The needs analysis (Code of Conduct, Sec 3(2) & 8) is the foundation for 'suitability'. A key component of this analysis is determining the client's 'risk tolerance' (their willingness and capacity to take risks) so that the recommended product's risk profile can be matched to it.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 798,
    "questionText": "A Representative advises on a complex derivative product without the specialized knowledge required for that category. This is a failure to meet the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (Product knowledge).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (FAIS Act, Sec 13(1)) is not just general knowledge; it requires specific 'product knowledge' for the categories on the representative's mandate. Advising on a complex product without this specialized knowledge is a direct breach of the competence requirement.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 799,
    "questionText": "The risk that an investment's value will decline due to a negative event affecting the specific company or sector is known as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Market Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Specific Risk (or Unsystematic Risk).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the definition of 'Specific Risk' (also called 'unsystematic risk'). It is the risk that is specific to a single company, industry, or sector (e.g., a mine strike, a new regulation). This type of risk *can* be mitigated through diversification, unlike Market Risk.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 800,
    "questionText": "The Representative must disclose whether the FSP receives any non-monetary benefit from a Product Supplier. This is required for transparency regarding potential:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax deductions.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Conflicts of interest.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act reports.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD hours.",
        "isCorrect": false
      }
    ],
    "explanation": "Non-monetary benefits (like gifts, travel, or equipment) from a Product Supplier are a form of remuneration. The Code of Conduct (Sec 4) requires their disclosure because they create a 'Conflict of Interest' that could (or could appear to) influence the FSP to favour that supplier.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 801,
    "questionText": "Mr. Van Wyk, a Representative, reviews a client's existing life insurance policy and recommends that the client *maintains* the policy without making any changes. Which ONE of the following statements is correct regarding this action?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "This is an intermediary service because no new product was sold.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "This is financial advice as it is a recommendation regarding a financial product.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "This is factual information as no changes were made.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "This is an excluded activity as no transaction occurred.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'advice' as any 'recommendation, guidance or proposal'. Recommending that a client *maintains* a policy (i.e., advising them *not* to change or cancel it) is still a recommendation regarding a financial product and is therefore classified as 'financial advice'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 802,
    "questionText": "Ms. Langa is appointed as a Representative for a Category I FSP on 15 May 2025. Her mandate is to advise on retirement annuities (a Tier 1 product). By which date must she pass the RE5 examination to remain compliant?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "14 May 2026 (within 1 year).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "14 May 2027 (within 2 years).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "14 May 2028 (within 3 years).",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "14 May 2030 (within 5 years).",
        "isCorrect": false
      }
    ],
    "explanation": "The 24-month (two-year) clock for meeting the regulatory exam (RE5) requirement (FAIS Act, Sec 13(1)(a)) starts ticking from the 'date of first appointment' (DOFA). Her deadline is 24 months from 15 May 2025, which is 14 May 2027.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 803,
    "questionText": "'ABC Planners' is licensed as a Category I FSP. The directors wish to start offering discretionary fund management services (Category II). Which ONE of the following regulatory actions is mandatory *before* they can legally render this new service?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP must appoint a new Compliance Officer.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP must apply to the FSCA for a variation of its license to include Category II.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP must inform the FAIS Ombud of its new business line.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FSP's Key Individual must complete a new RE1 exam.",
        "isCorrect": false
      }
    ],
    "explanation": "An FSP cannot render services outside its license conditions (FAIS Act, Sec 8(2)). To add a new, different category (like Cat II), the FSP must apply to the FSCA for a 'variation of license'. This is a formal application process where the FSP must prove it meets the Fit and Proper requirements for that new category.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 804,
    "questionText": "The FSP must maintain adequate records and document internal controls to support its business operations. This is a core component of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 8(1)(d)) defines 'Operational Ability' as having the necessary systems, processes, and internal controls to manage the business. This explicitly includes record-keeping systems and all other documented internal controls.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 805,
    "questionText": "The FAIS Act's subordinate legislation, such as the General Code of Conduct, is primarily aimed at regulating the FSP's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Investment performance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market conduct.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Tax liability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Marketing budget.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act and its subordinate legislation (like the Code of Conduct) are *market conduct* regulations. They do not regulate prudential aspects (like solvency) or performance, but rather *how* an FSP conducts itself in the market when dealing with clients (e.g., disclosure, suitability, fairness).",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 806,
    "questionText": "A Representative is found guilty of gross negligence by the FSP and is debarred. The FSP must immediately notify the FSCA of the debarment and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Obtain the Representative's consent.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Provide the full reasons for the action.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Wait for the client to complain.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Pay the Representative's legal fees.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) is explicit: when an FSP debars a representative, it must 'immediately' notify the FSCA (the Authority) and \"inform the Authority of the reasons for the debarment\". This is a mandatory, non-negotiable step.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 807,
    "questionText": "A Representative who is appointed *only* to render services for Tier 2 products is **exempted** from the RE5 examination. This exemption is due to the products' classification as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Complex.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Low-stakes.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "High-risk.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Discretionary.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) are tiered. Tier 2 products (e.g., funeral policies, health benefits) are considered simple, 'low-stakes', and low-risk for clients. Because of this, the competence bar is lower, and the RE5 is not required.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 808,
    "questionText": "A **Category III** FSP is licensed to provide:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Intermediary services by way of administration.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Discretionary financial services.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Only advice.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only execution of sales.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines the license categories. Category III is a specialist license for FSPs that perform 'intermediary services by way of administration' of financial products, such as a LISP platform or fund administrator.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 809,
    "questionText": "A Representative's long history of failing to meet tax obligations and accumulating severe debt, even without criminal intent, can compromise their compliance with the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) mandate that a representative must be 'Financially Sound'. A history of failing to meet financial obligations (like tax or debts) demonstrates an inability to manage one's own financial affairs and is a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 811,
    "questionText": "A Representative is under supervision. To achieve full competence, the Representative must demonstrate the ability to render the financial service:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Without any supervision.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Only for low-risk clients.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "With a high sales record.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "With the FSP's capital adequacy.",
        "isCorrect": false
      }
    ],
    "explanation": "The purpose of supervision (Fit & Proper, Sec 25) is to gain experience. The end goal is to be 'fully competent'. This status is achieved when the FSP (via the KI) is satisfied that the representative has the necessary experience to act independently and *without any supervision*.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 812,
    "questionText": "The FSP must ensure that all its data storage is safe and protected against external threats. This is a crucial element of the FSP's ongoing commitment to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "Data storage, security, and protection are key technical and administrative processes. These all fall under the 'Operational Ability' requirement (FAIS Act, Sec 8(1)(d)), which covers the FSP's systems, technical resources, and internal controls.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 813,
    "questionText": "A Representative fails to attend any CPD activities for the current cycle. This is a direct breach of which component of the Fit and Proper requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (Ongoing professional development).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is the mechanism for maintaining *ongoing* 'Competence'. Failure to complete the required CPD activities is a direct breach of this pillar, as the representative is no longer maintaining their professional knowledge.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 814,
    "questionText": "The FSP must ensure that Representatives disclose any facts that may disqualify them from being Fit and Proper. This is part of the FSP's ongoing duty to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Honesty and Integrity' requirement (FAIS Act, Sec 8(1)(a)) is an ongoing duty. The FSP must have a process (like an annual declaration) for representatives to disclose any new information that might affect their 'good standing', ensuring continued honesty and integrity.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 815,
    "questionText": "If the FSCA instructs an FSP to remove a representative's name from its register for failing the RE5, the FSP's immediate action must be to comply and inform the regulator of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Representative's tax status.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Date of removal.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Client's complaint history.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's annual profit.",
        "isCorrect": false
      }
    ],
    "explanation": "When the FSCA instructs a debarment (FAIS Act, Sec 14), the FSP must comply. This means removing the representative from its internal register and formally notifying the FSCA that the action has been taken, including the 'date of removal' to ensure the central register is accurate.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 816,
    "questionText": "An FSP is audited and found to have consistently inflated its asset value to meet capital adequacy requirements. This is a breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness and Honesty/Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "CPD completion.",
        "isCorrect": false
      }
    ],
    "explanation": "This is a breach of two pillars. First, the FSP fails to meet the 'Financial Soundness' requirements (Fit & Proper, Sec 4) because its assets are not sufficient. Second, the act of *knowingly inflating* asset values is fraudulent and a severe breach of 'Honesty and Integrity' (Sec 7).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 824,
    "questionText": "Records relating to the FSP's **Financial Soundness** (e.g., liquid assets and capital adequacy) must be retained for a minimum period of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "3 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "Records of 'Financial Soundness' (e.g., financial statements, capital adequacy calculations) are critical compliance records. Like all records demonstrating compliance with the FAIS Act (FAIS Act, Sec 18), they must be kept for a minimum of 5 years.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 827,
    "questionText": "The FSP must ensure that its electronic records are securely backed up. This is a crucial control required under the Fit and Proper pillar of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Secure storage and backups (FAIS Act, Sec 18) are technical and procedural controls. They are a fundamental part of the FSP's 'Operational Ability' to manage its systems, protect client data, and ensure business continuity.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 828,
    "questionText": "Customer Due Diligence (CDD) involves verifying the client's identity. If a client is a legal entity, the FSP must verify the entity's registration details and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's own tax compliance.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Beneficial Owner.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The Product Supplier.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's personal hobbies.",
        "isCorrect": false
      }
    ],
    "explanation": "CDD (FIC Act, Sec 21 & 21B) for a legal entity requires a two-pronged approach: 1) identify and verify the entity itself (e.g., its registration documents), and 2) identify and verify the 'Beneficial Owner(s)', the natural person(s) who ultimately own or control it.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 829,
    "questionText": "A Representative notices an unusual transaction that is inconsistent with the client's known financial profile. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The Representative must file a Cash Threshold Report (CTR).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative must wait for the client to submit a complaint.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Representative must immediately file a Suspicious or Unusual Transaction Report (STR).",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "The Representative must only file a report if the amount is over R50,000.",
        "isCorrect": false
      }
    ],
    "explanation": "The trigger for an STR (FIC Act, Sec 29) is 'suspicion'. A transaction that is 'inconsistent' with a client's known profile is a classic example of a 'suspicious or unusual' transaction that must be reported, regardless of the amount.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 832,
    "questionText": "When onboarding a **Politically Exposed Person (PEP)**, the FSP must apply **Enhanced Due DilGence (EDD)**. This includes obtaining the source of funds and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A tax audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Senior management approval.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A civil court order.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's consent.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) mandates specific steps for EDD when dealing with PEPs, as they are high-risk. These steps include: 1) obtaining 'senior management approval' for the relationship, and 2) establishing the client's source of wealth and source of funds.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 833,
    "questionText": "A FSP is found to be non-compliant with the FIC Act's record keeping requirements. The FIC can impose **Administrative Sanctions**, which may include:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Mandatory re-write of the RE5.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A fine.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A warning from the FAIS Ombud.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The suspension of the FSP's tax compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 45B) gives the FIC its own enforcement powers for breaches of the Act (like record keeping). These 'Administrative Sanctions' include reprimands, directives, and, most commonly, monetary penalties (a fine).",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 840,
    "questionText": "The FAIS Ombud generally has no jurisdiction over complaints concerning the internal operations of a bank that are unrelated to a FAIS Act breach. This is because the Ombud's mandate is limited to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The financial services sector and the FAIS Act.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Only high-value claims.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "All consumer disputes.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud is the *FAIS* Ombud. Its mandate and jurisdiction (FAIS Act, Sec 27(3)) are specifically limited to resolving disputes arising from a contravention of the *FAIS Act*. A complaint about bank operations (e.g., high fees, poor service) that is not related to advice or an intermediary service falls outside this scope.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 842,
    "questionText": "The KI delegates the supervision of a Representative to an experienced manager. If the Representative acts negligently, the KI is still ultimately responsible due to the duty of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Management oversight.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Record keeping.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD completion.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's core role (FAIS Act, Sec 13 & 17) is 'management oversight'. A KI can delegate tasks (like supervision) but not their legal accountability. The KI remains responsible for ensuring the delegated tasks are performed correctly and thus retains ultimate responsibility for the representative's actions.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 843,
    "questionText": "The KI must ensure that every Representative on the FSP's register meets and maintains their **Fit and Proper** status. This is a duty related to the KI's oversight of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FSP's marketing.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The Representative register.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's financial statements.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's personal tax.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (FAIS Act, Sec 13) includes *maintaining* the representative register. This is not just an admin task; it is the core compliance process for ensuring that everyone on the register is, and remains, Fit and Proper.",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 847,
    "questionText": "To ensure the advice is suitable, the Representative must assess the client's financial position, which includes the client's:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax returns.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Assets and liabilities.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Social media activity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD records.",
        "isCorrect": false
      }
    ],
    "explanation": "A core part of the needs analysis (Code of Conduct, Sec 3(2) & 8) is to understand the client's 'financial situation'. This is necessary to determine their risk capacity and affordability, and it requires information on their *assets and liabilities*, as well as income and expenses.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 848,
    "questionText": "A Representative must ensure they are up-to-date with all product features, risks, and benefits to maintain compliance with the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "'Competence' (FAIS Act, Sec 13(1)) is an ongoing duty. It requires representatives to have the necessary product knowledge. This knowledge must be kept up-to-date (e.g., via CPD) to ensure all advice on features, risks, and benefits is accurate.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 849,
    "questionText": "The risk that the value of an investment may fluctuate due to changes in interest rates or bond prices is known as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Credit Risk.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Market Risk.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Liquidity Risk.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Operational Risk.",
        "isCorrect": false
      }
    ],
    "explanation": "'Market Risk' is the risk that the entire market will move, affecting the value of investments. Changes in interest rates are a primary driver of market risk, as they directly impact the value of bonds and influence the attractiveness of stocks.",
    "points": 5,
    "categories": [
      "Financial Products",
      "Apply knowledge of the financial products and services environment"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 851,
    "questionText": "A Representative is explaining the factual differences between a retirement annuity and a pension fund to a client, without making a recommendation. Which ONE of the following best describes this activity?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial advice.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Factual information only.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "An intermediary service.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "A product supply.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) definition of 'advice' *excludes* 'an objective recommendation... or the furnishing of factual information'. Simply explaining the objective, factual differences between two product types, without recommending one over the other for the client, is factual information.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 852,
    "questionText": "A Representative has not passed the RE5 within the two-year deadline. The FSP's failure to remove the representative immediately is a breach of which core requirement?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 is a key 'Competence' requirement (FAIS Act, Sec 13(1)(a)). The 24-month deadline is final. By not removing the representative, the FSP is in breach of its duty to ensure all its representatives meet the 'Competence' requirements.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 853,
    "questionText": "A person appointed only to render financial services for funeral and friendly society benefits is exempted from the RE5 examination. Choose the correct reason.",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Because they are dealing with Tier 1 products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Because they are dealing with Tier 2 products.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Because they are dealing with Category II products.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Because they are dealing with excluded business.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 is mandatory for 'Tier 1' (complex) products. Funeral and friendly society benefits are classified as 'Tier 2' (simple, low-risk) products. Therefore, representatives who *only* advise on these Tier 2 products are exempt from the RE5.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 857,
    "questionText": "A Representative is exempted from the RE5 examination if they are appointed only to execute sales, without rendering any advice. This is based on the nature of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Service rendered.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Representative's salary.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's license.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 requirement (FAIS Act, Sec 13(1)(b)) is linked to the *service* rendered. The RE5 is for 'advice'. If a representative *only* performs 'execution of sales' (an intermediary service that involves no advice), they are exempt from the RE5, regardless of the product tier.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 862,
    "questionText": "The FSP must ensure that its internal compliance monitoring is independent and effective. This is part of the FSP's obligation to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "A compliance monitoring function is a key internal control. Ensuring this function is independent and effective is a core 'Operational Ability' requirement (FAIS Act, Sec 8(1)(d)), as it relates to the FSP's governance and ability to monitor itself.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 863,
    "questionText": "A Representative must complete **Continuous Professional Development (CPD)** activities to ensure their competence is maintained. This ensures the Representative stays current with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Market sales targets.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Legislative and product developments.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FSP's financial soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is the requirement for *ongoing* competence. Its purpose is to ensure representatives stay up-to-date with the changing financial environment, including new 'legislative' requirements and new 'product developments'.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 864,
    "questionText": "The FSP must ensure that its Representatives and Key Individuals adhere to the requirement for **Honesty and Integrity**. Which ONE of the following statements is correct?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "This is an initial requirement only at appointment.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "This is an ongoing obligation that must be monitored.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "This is an annual requirement only.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "This requirement is exempted for Representatives under supervision.",
        "isCorrect": false
      }
    ],
    "explanation": "All Fit and Proper requirements (FAIS Act, Sec 8(1)(a)), including 'Honesty and Integrity', are 'ongoing obligations'. The FSP must not only check them at appointment but must have processes (like annual declarations) to monitor and ensure they are maintained throughout the representative's employment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 865,
    "questionText": "If the FSP decides to debar a Representative, the FSP must ensure the debarment process is procedurally fair and inform the FSCA immediately. This ensures the FSP complies with the rules for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "Debarment (FAIS Act, Sec 14) is a formal process with legal implications. The FSP must have the 'Operational Ability' (Sec 8) to execute this process, which includes following the correct, procedurally fair steps and meeting the mandatory notification requirements to the FSCA.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 866,
    "questionText": "An FSP's failure to maintain the required level of liquid assets to cover its financial obligations constitutes a breach of the requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 4) are very specific about 'Financial Soundness'. A key component is maintaining sufficient 'liquidity' (liquid assets) to meet obligations. A failure to do so is a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 867,
    "questionText": "The Code of Conduct requires that the Representative must take **reasonable steps** to ensure the advice is suitable. This means the Representative must perform a detailed:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tax audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Needs analysis.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "CPD log entry.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act report.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'reasonable steps' required to ensure suitable advice (General Code, Sec 7 & 8) is the process of conducting a 'needs analysis'—gathering and analyzing the client's financial situation, needs, and objectives to form the basis for the recommendation.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 868,
    "questionText": "A Representative fails to provide the client with the FSP’s process for referring unresolved complaints to the FAIS Ombud. This is a breach of the Code of Conduct’s requirements for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Status disclosure and client relations.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "FIC Act compliance.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Conflict of Interest disclosure.",
        "isCorrect": false
      }
    ],
    "explanation": "The General Code of Conduct (Sec 3(1)(a) & Sec 16) requires the FSP to disclose its complaints procedure, including the details of the FAIS Ombud. This is part of the initial 'status disclosure' and a key requirement for fair 'client relations'.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 869,
    "questionText": "The FSP must identify, mitigate, and disclose any conflicts of interest. The goal of this process is to ensure that the integrity of the advice is maintained and conflicts are:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ignored.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Actively managed.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only discussed verbally.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only disclosed to the KI.",
        "isCorrect": false
      }
    ],
    "explanation": "The purpose of the Conflict of Interest Management Policy (General Code, Sec 3(1)(c)) is not just to identify conflicts, but to ensure they are 'actively managed' through a formal process of avoidance, mitigation (reducing their impact), and transparent disclosure to the client.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 870,
    "questionText": "The rules for replacement advice are strict. The Representative must ensure the client is aware of any disadvantages, such as the loss of a vested right or benefit, which is a requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Record keeping.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Due care and diligence.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FIC Act compliance.",
        "isCorrect": false
      }
    ],
    "explanation": "Replacement advice (General Code, Sec 7(2)) requires a high degree of 'due care and diligence'. The representative must be diligent in comparing the products and take care to disclose all disadvantages (like the loss of vested rights) to ensure the client is not harmed.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 877,
    "questionText": "A Key Individual (KI) delegates the destruction of old client records (older than 5 years) to a junior clerk. The KI remains responsible for ensuring the destruction process adheres to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The client's permission.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "The FSP's record-keeping policy and relevant legislation (e.g., POPIA).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The FSP's marketing strategy.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The FIC Act reporting rules.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI is responsible for the FSP's 'Operational Ability', which includes its record-keeping policy (FAIS Act, Sec 18). While the KI can delegate the task, they remain accountable for ensuring the destruction is done *compliantly*. This includes following the FSP's own policy and other laws like the Protection of Personal Information Act (POPIA), which governs the secure destruction of personal data.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 878,
    "questionText": "An FSP is onboarding a legal entity client but cannot verify the entity's registration details using credible sources. The FSP must therefore:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Apply Simplified Due Diligence (SDD).",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Refuse to establish a business relationship.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Proceed with the transaction but file a STR later.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Ask the client for a verbal confirmation.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21) mandates that an FSP *must* identify and *verify* its client's details (CDD). If verification is impossible (e.g., no credible sources can confirm the entity's existence), the CDD process has failed, and the FSP is prohibited from establishing the business relationship.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 879,
    "questionText": "The Representative notices a series of transactions that they have a reasonable suspicion are linked to terrorist financing. The Representative must file a STR to the FIC:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Within 7 working days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only if the amount exceeds the CTR threshold.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "After receiving legal advice.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 29) requires reporting 'as soon as reasonably possible' after a suspicion is formed. A suspicion of 'terrorist financing' is one of the most serious triggers, and the report must be filed immediately and without delay.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 880,
    "questionText": "The FSP's **Risk-Based Approach (RBA)** requires that the intensity of its anti-money laundering controls is adapted based on the assessed risk. This ensures that the FSP is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Minimally compliant.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Efficiently compliant.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Always profitable.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Exempt from reporting.",
        "isCorrect": false
      }
    ],
    "explanation": "The RBA (FIC Act, Sec 42A) allows an FSP to be 'efficiently compliant'. Instead of applying the most stringent controls to everyone, it allows the FSP to allocate its resources *proportionately*, focusing its time and money on the highest-risk areas, while applying simpler controls to low-risk areas.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 882,
    "questionText": "When onboarding a **Politically Exposed Person (PEP)**, the FSP must apply **Enhanced Due Diligence (EDD)**. This includes obtaining the source of funds and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A tax audit.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Senior management approval.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "A civil court order.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The client's consent.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC Act (Sec 21C) mandates specific steps for EDD when dealing with PEPs, as they are high-risk. These steps include: 1) obtaining 'senior management approval' for the relationship, and 2) establishing the client's source of wealth and source of funds.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 883,
    "questionText": "If the FIC finds that an FSP has materially failed to comply with the FIC Act, the FIC can impose an **Administrative Sanction**. Which of the following is NOT an administrative sanction?",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "A reprimand.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "A restriction on the FSP's business activities.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "A fine.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Imprisonment of the Key Individual.",
        "isCorrect": true
      }
    ],
    "explanation": "The FIC Act (Sec 45B) lists the 'Administrative Sanctions' the FIC can impose. These are civil penalties and include reprimands (A), restrictions on business (B), and monetary fines (C). Imprisonment (D) is a *criminal* penalty, not an administrative one.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 901,
    "questionText": "Ms. Pillay, a Representative, provides a client with a customized financial plan detailing the projected returns of a portfolio of various investment products. This service is legally defined as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An intermediary service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Factual information.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Product supply.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'advice' as any 'recommendation, guidance or proposal of a financial nature'. A customized financial plan is a clear proposal tailored to a client's specific situation and is therefore 'financial advice'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 902,
    "questionText": "The two-year deadline for a Representative to pass the RE5 is a strict regulatory requirement for Tier 1 products. If this deadline is missed, the FSP's failure to remove the representative constitutes a breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 exam is a key 'Competence' requirement (FAIS Act, Sec 13(1)(a)). The 24-month deadline is final. By not removing the representative, the FSP is in breach of its duty to ensure all its representatives meet the 'Competence' requirements.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 903,
    "questionText": "A company sells a simple short-term insurance policy. The company is excluded from the requirement to be licensed as an FSP if it only provides:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Discretionary financial services.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Advice on the policy's suitability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Factual information on its own product.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Intermediary services by administration.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 2(1)) provides exemptions. A 'Product Supplier' (like an insurer) is generally exempt from the Act *only* in relation to the factual advice or information it provides on its *own* products. As soon as it gives suitability advice (B) or performs other services (A, D), it would likely need a license.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 904,
    "questionText": "The FSP must ensure that all its technology, including client-facing tools, is reliable and secure. This is a measure to maintain:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "CPD completion.",
        "isCorrect": false
      }
    ],
    "explanation": "The FSP's 'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having adequate 'technical resources' and 'risk management systems'. This covers the reliability, security, and adequacy of all IT systems and client-facing technology.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 905,
    "questionText": "The overarching duty of FSPs and Representatives, as mandated by the FAIS Act, is to act with honesty, due care, skill, and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Diligence.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "Minimal disclosure.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Maximum profit.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "No tax liability.",
        "isCorrect": false
      }
    ],
    "explanation": "This is the core principle of the General Code of Conduct, which is subordinate legislation under the FAIS Act. The full requirement is that all financial services must be rendered 'honestly, fairly, with due skill, care and diligence'.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 906,
    "questionText": "If a Representative is suspended by the FSP pending an internal investigation, the FSP must notify the FSCA immediately, stating the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Representative's salary.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Reasons for the suspension.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Client's complaint history.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's financial statements.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 14(1)) mandates that if an FSP suspends a representative, it must 'immediately' notify the FSCA (the Authority) and \"inform the Authority of the reasons for the suspension\". This is to allow the regulator to monitor the situation.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 907,
    "questionText": "A Representative is exempted from the RE5 examination if they are appointed only to render services for **Tier 2** products. The reason for this exemption is the products':",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "High-risk classification.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Inclusion in Category II.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Low complexity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Exemption from the FIC Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The competence requirements (FAIS Act, Sec 13(1)(b)) are tiered. The RE5 exam is for complex Tier 1 products. Tier 2 products (e.g., funeral policies) are deemed to have 'low complexity' and lower risk, which is the reason for the RE5 exemption.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 908,
    "questionText": "The term **'intermediary service'** is defined in the FAIS Act as any service rendered by a Representative or FSP in relation to a financial product, excluding:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Executing a client mandate.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Accepting premium payments.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Renewing a policy.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) creates two main categories of service: 'advice' and 'intermediary service'. The definition of 'intermediary service' explicitly *excludes* 'financial advice'. All other options (A, C, D) are listed examples of intermediary services.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 909,
    "questionText": "A Representative fails to disclose that they were previously debarred by a different FSP for gross misconduct. This is a breach of the Fit and Proper requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Operational Ability.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 7) mandate 'Honesty and Integrity'. A previous debarment is a material fact. Deliberately concealing this fact during an appointment process is an act of dishonesty and a direct breach of this requirement.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 910,
    "questionText": "The FSP's **Operational Ability** requires adequate resources. If the FSP's client record-keeping systems are outdated and constantly crashing, the FSP is failing to maintain compliance in the area of:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Technological controls.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "'Operational Ability' (FAIS Act, Sec 8(1)(d)) includes having adequate 'technical resources' and 'internal controls'. An outdated, crashing system is a failure of these technical controls, compromising the FSP's ability to keep records securely and service clients.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 911,
    "questionText": "To achieve full competence, a Representative must meet the experience requirement. This involves rendering financial services under supervision for a period of up to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "1 year.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "2 years.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "5 years.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "10 years.",
        "isCorrect": false
      }
    ],
    "explanation": "The Fit & Proper Requirements (Sec 25) set the rules for supervision. A representative who needs to gain experience must work under supervision for a *maximum* period of 60 months (5 years) from their date of first appointment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 912,
    "questionText": "The FSP must have a documented internal control system for managing potential risks arising from the FSP's operations. This is a core component of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Competence.",
        "isCorrect": false
      }
    ],
    "explanation": "A risk management framework and a 'system of internal control' are explicitly listed as requirements for 'Operational Ability' under the FAIS Act (Sec 8(1)(d)).",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 913,
    "questionText": "A Representative fails to complete the required minimum CPD hours. The FSP must suspend the Representative's ability to render services because they have breached the requirement for ongoing:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Competence (Knowledge).",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "CPD (Fit & Proper, Sec 29) is the requirement for *maintaining* competence. If a representative fails to do their CPD, they no longer meet the 'Competence' requirement and are thus no longer Fit and Proper. The FSP must suspend them until the breach is rectified.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "advanced",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 914,
    "questionText": "The FSP must ensure that its Representatives and Key Individuals adhere to the requirement for **Honesty and Integrity**. This is an:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Initial requirement only.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Ongoing obligation.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Annual requirement only.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Exempted requirement for Representatives.",
        "isCorrect": false
      }
    ],
    "explanation": "All Fit and Proper requirements (FAIS Act, Sec 8(1)(a)), including 'Honesty and Integrity', are 'ongoing obligations'. The FSP must not only check them at appointment but must have processes (like annual declarations) to monitor and ensure they are maintained throughout the representative's employment.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 915,
    "questionText": "If the FSP decides to debar a Representative, the debarment is effective on the date decided by the FSP, provided the FSCA is:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Notified within 30 days.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Notified immediately.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Notified at the end of the year.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Asked for pre-approval.",
        "isCorrect": false
      }
    ],
    "explanation": "The debarment (FAIS Act, Sec 14) is an action taken *by the FSP*. The FSP makes the decision, follows a fair process, and then *notifies* the FSCA. The debarment is effective from the date the FSP specifies, at which point the FSCA updates its register.",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 916,
    "questionText": "The FSP's **Financial Soundness** requirements are designed to ensure the FSP maintains adequate liquid resources to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Avoid the FIC Act.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Meet its liabilities and claims.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Maximize the Representative's commission.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Pay the FSP's tax returns.",
        "isCorrect": false
      }
    ],
    "explanation": "The purpose of 'Financial Soundness' (Fit & Proper, Sec 4) is client protection. It ensures the FSP has sufficient capital and liquidity to remain a 'going concern' and meet all its financial obligations (like paying debts, running costs, and potential client 'claims').",
    "points": 5,
    "categories": [
      "Fit & Proper",
      "FSP License (Fit & Proper/Operational Ability)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 923,
    "questionText": "The FSP must ensure that all records are kept in a format that can be easily accessed and reproduced. This is a measure to maintain the records' integrity and:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Cost.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Authenticity.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Marketing value.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Size.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 18(1)) requirements for record-keeping systems are focused on ensuring the records are a true and reliable account of what happened. The system must protect the 'integrity' (completeness) and 'authenticity' (unaltered state) of the records for regulatory inspection.",
    "points": 5,
    "categories": [
      "Record Keeping",
      "Comply with regulated record keeping requirements"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 933,
    "questionText": "A FSP is found to be non-compliant with the FIC Act's due diligence requirements. The FIC can impose **Administrative Sanctions**, which may include:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The FAIS Act.",
        "isCorrect": true
      },
      {
        "id": "b",
        "text": "The Tax Act.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "The Insolvency Act.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Labour Relations Act.",
        "isCorrect": false
      }
    ],
    "explanation": "The FIC and the FSCA are separate regulators. The FIC enforces the FIC Act (e.g., with Sec 45B sanctions). The FSCA enforces the FAIS Act (e.g., with debarments or license withdrawal). An FSP can be sanctioned by *both* regulators for different (or even related) failings.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 945,
    "questionText": "The KI must ensure the FSP has adequate resources to maintain its Operational Ability, including:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "The KI's personal investment account.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Sufficient staff and technical resources.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "The client's tax returns.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "The Representative's CPD log.",
        "isCorrect": false
      }
    ],
    "explanation": "The KI's oversight duty (Sec 17(1)) covers 'Operational Ability'. This means ensuring the FSP has adequate resources to function, which includes 'sufficient staff' (human resources) and 'technical resources' (e.g., IT systems, software).",
    "points": 5,
    "categories": [
      "Key Individual",
      "Role of the Key Individual in terms of the FAIS Act"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 951,
    "questionText": "A Representative provides a client with a verbal recommendation to sell a specific stock and reinvest the proceeds in a bond fund. This is classified as:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "An intermediary service.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Financial advice.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Factual information.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Product administration.",
        "isCorrect": false
      }
    ],
    "explanation": "The FAIS Act (Sec 1, Definitions) defines 'advice' as any 'recommendation, guidance or proposal'. A 'recommendation to sell' one financial product (a stock) and 'reinvest' in another (a bond fund) is a clear example of financial advice, regardless of whether it is verbal or written.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 952,
    "questionText": "If a Representative fails the RE5 for a Tier 1 product, the FSP must immediately remove them from the register because they cease to meet the ongoing requirement for:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Financial Soundness.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Operational Ability.",
        "isCorrect": false
      },
      {
        "id": "c",
        "text": "Competence.",
        "isCorrect": true
      },
      {
        "id": "d",
        "text": "Honesty and Integrity.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 exam is a key 'Competence' requirement (FAIS Act, Sec 13(1)(a)). Failure to pass the exam within the 24-month deadline means the representative no longer meets the competence requirement and is therefore no longer Fit and Proper.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 953,
    "questionText": "A person appointed only to render financial services for funeral and friendly society benefits is exempted from the RE5 examination because they are dealing with:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Tier 1 products.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Tier 2 products.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Category II products.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Excluded business.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 is mandatory for 'Tier 1' (complex) products. Funeral and friendly society benefits are classified as 'Tier 2' (simple, low-risk) products. Therefore, representatives who *only* advise on these Tier 2 products are exempt from the RE5.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 957,
    "questionText": "A Representative is exempted from the RE5 examination if they are appointed only to execute sales, without rendering any advice or intermediary services. This is based on the nature of the:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Product.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Service rendered.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Representative's salary.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "FSP's license.",
        "isCorrect": false
      }
    ],
    "explanation": "The RE5 requirement (FAIS Act, Sec 13(1)(b)) is linked to the *service* rendered. The RE5 is for 'advice'. If a representative *only* performs 'execution of sales' (an intermediary service that involves no advice), they are exempt from the RE5, regardless of the product tier.",
    "points": 5,
    "categories": [
      "FAIS Act",
      "FAIS Act and Subordinate Legislation"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 969,
    "questionText": "The FSP must identify, mitigate, and disclose any conflicts of interest. This ensures the integrity of the advice is maintained and conflicts are:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Ignored.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Actively managed.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Only discussed verbally.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Only disclosed to the KI.",
        "isCorrect": false
      }
    ],
    "explanation": "The purpose of the Conflict of Interest Management Policy (General Code, Sec 3(1)(c)) is not just to identify conflicts, but to ensure they are 'actively managed' through a formal process of avoidance, mitigation (reducing their impact), and transparent disclosure to the client.",
    "points": 5,
    "categories": [
      "Code of Conduct",
      "Adhere to the specific Codes of Conduct"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 981,
    "questionText": "The Tipping-Off Prohibition means the FSP must keep the STR submission confidential from the client to prevent the client from:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Complaining about the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Withdrawing their funds.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Obtaining new financial advice.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Changing their tax status.",
        "isCorrect": false
      }
    ],
    "explanation": "The 'Tipping-Off Prohibition' (FIC Act, Sec 29(3)) is a criminal offence. Its purpose is to protect the investigation by ensuring the suspect is not alerted, which would give them a chance to take evasive action, such as 'withdrawing their funds' (moving the illicit money) or destroying evidence.",
    "points": 5,
    "categories": [
      "FIC Act",
      "FIC Act Compliance (CDD, AML/CFT, Reporting)"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  },
  {
    "questionNumber": 986,
    "questionText": "The FSP must respond to a written complaint within six weeks. If the FSP cannot resolve the complaint within this period, the client has the right to:",
    "questionType": "single",
    "options": [
      {
        "id": "a",
        "text": "Request an extension from the FSP.",
        "isCorrect": false
      },
      {
        "id": "b",
        "text": "Refer the complaint to the FAIS Ombud.",
        "isCorrect": true
      },
      {
        "id": "c",
        "text": "Receive a fine from the FSP.",
        "isCorrect": false
      },
      {
        "id": "d",
        "text": "Cancel the policy.",
        "isCorrect": false
      }
    ],
    "explanation": "The Ombud Rules (Rule 7(1)) give the FSP six weeks (42 calendar days) to provide a final response. If the FSP fails to do so, the client's right to escalate the complaint to the FAIS Ombud is automatically triggered.",
    "points": 5,
    "categories": [
      "FAIS Ombud",
      "Dealing with complaints submitted to the Ombud for FSPs"
    ],
    "difficulty": "intermediate",
    "tierAccess": [
      "premium",
      "pro"
    ],
    "isPremiumQuestion": true
  }
];

async function deleteExistingPremiumExam() {
  console.log("🗑️  Deleting existing premium/pro exam and questions...");

  try {
    // Scan for premium exam items
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "PK = :examPK",
      ExpressionAttributeValues: {
        ":examPK": `EXAM#${EXAM_ID}`,
      },
    });

    const result = await docClient.send(scanCommand);

    if (result.Items && result.Items.length > 0) {
      console.log(`Found ${result.Items.length} items to delete`);

      // Delete each item
      for (const item of result.Items) {
        console.log(`Deleting: ${item["PK"]} - ${item["SK"]}`);
        const deleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: item["PK"],
            SK: item["SK"],
          },
        });
        await docClient.send(deleteCommand);
      }

      console.log("✅ All existing premium/pro exam data deleted");
    } else {
      console.log("No existing premium/pro exam found");
    }
  } catch (error) {
    console.error("Error deleting existing data:", error);
    throw error;
  }
}

async function createExam() {
  console.log("📝 Creating exam metadata...");

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: examMetadata,
    });

    await docClient.send(command);
    console.log("✅ Exam metadata created");
  } catch (error) {
    console.error("Error creating exam:", error);
    throw error;
  }
}

async function createQuestions() {
  console.log("📝 Creating questions...");

  for (const question of questions) {
    const questionId = `q${question.questionNumber
      .toString()
      .padStart(4, "0")}`;

    const questionItem = {
      PK: `EXAM#${EXAM_ID}`,
      SK: `QUESTION#${questionId}`,
      questionId,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options,
      explanation: question.explanation,
      points: question.points,
      categories: question.categories,
      difficulty: question.difficulty,
      examId: EXAM_ID,
      tierAccess: question.tierAccess,
      isPremiumQuestion: question.isPremiumQuestion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entityType: "QUESTION",
    };

    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: questionItem,
      });

      await docClient.send(command);
      console.log(
        `✅ Question ${
          question.questionNumber
        } created: ${question.questionText.substring(0, 50)}...`
      );
    } catch (error) {
      console.error(
        `Error creating question ${question.questionNumber}:`,
        error
      );
      throw error;
    }
  }

  console.log("✅ All questions created");
}

async function main() {
  console.log("🚀 Starting RE5 Premium/Pro Exam Seed Script");
  console.log(`📊 Table: ${TABLE_NAME}`);
  console.log(`📋 Exam ID: ${EXAM_ID}`);
  console.log("");

  try {
    // Step 1: Delete existing premium/pro exam data
    await deleteExistingPremiumExam();
    console.log("");

    // Step 2: Create exam metadata
    await createExam();
    console.log("");

    // Step 3: Create questions
    await createQuestions();
    console.log("");

    console.log("🎉 Seed script completed successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log(`   - Exam created: ${examMetadata.title}`);
    console.log(`   - Total questions: ${questions.length}`);
    console.log(`   - Exam duration: ${examMetadata.totalTime / 60} minutes`);
    console.log(`   - Passing score: ${examMetadata.passingScore}%`);
    console.log(`   - Allowed tiers: Premium, Pro`);
    console.log("");
    console.log(`✨ You can now navigate to /exam/${EXAM_ID}/start to view the exam`);
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

main();
