"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({ region: "af-south-1" });
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env["TABLE_NAME"] || "exam-platform-data-dev";
const EXAM_ID = "re5-free-exam"; // FREE TIER ONLY EXAM
// Exam metadata (Enhanced Description)
const examMetadata = {
    PK: `EXAM#${EXAM_ID}`,
    SK: "METADATA",
    GSI1PK: "EXAM#ACTIVE",
    GSI1SK: `RE5#${new Date().toISOString()}`,
    GSI3PK: `EXAM#CATEGORY#RE5`,
    GSI3SK: `intermediate#${EXAM_ID}`,
    examId: EXAM_ID,
    title: "RE5 Full Exam Simulation (Free Tier)",
    description: "A 50-question RE5 practice exam designed to simulate the format and style of the official regulatory examination, covering all key task categories.",
    category: "RE5",
    difficulty: "intermediate",
    totalQuestions: 50,
    totalTime: 7200, // 2 hours in seconds
    duration: 7200,
    passingScore: 70,
    pointsPerQuestion: 2,
    isActive: true,
    // TIER RESTRICTION: This exam is exclusively for free tier users
    // Premium/Pro users get randomly generated exams instead
    allowedTiers: ["free"],
    isFreeExam: true,
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entityType: "EXAM",
};
// 50 RE5 Questions - FREE TIER ONLY (Enhanced)
const questions = [
    {
        questionNumber: 1,
        questionText: "Which ONE of the following statements best describes the main objective of the FAIS Act?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To regulate the prudential soundness of banks.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "To protect consumers of financial products and professionalise the financial services industry.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "To manage the national budget and tax collection.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To combat money laundering and terrorist financing.",
                isCorrect: false,
            },
        ],
        explanation: "The primary objective of the FAIS Act is to regulate market conduct. This is achieved by protecting consumers (clients) and ensuring FSPs and Representatives adhere to professional and ethical standards.",
        points: 5,
        categories: ["FAIS Act", "Legislation"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 2,
        questionText: "Which ONE of the following statements best describes the main purpose of Customer Due Diligence (CDD) under the FIC Act?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To identify and verify the identity of a client to mitigate money laundering risks.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To determine the client's investment preferences and risk tolerance.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To calculate the client's tax obligations for SARS.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To market additional financial products to the client.",
                isCorrect: false,
            },
        ],
        explanation: "Customer Due Diligence (CDD), also known as 'Know Your Customer' (KYC), is a mandatory process under the FIC Act to identify and verify who the client is, in order to prevent the financial system from being used for money laundering or terrorist financing.",
        points: 5,
        categories: ["FIC Act", "Compliance", "Anti-Money Laundering"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 3,
        questionText: "Choose the INCORRECT statement. The General Code of Conduct requires a provider to do all of the following EXCEPT:",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Render financial services honestly, fairly, with due skill, care and diligence.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Guarantee the financial performance of the recommended product.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Provide advice that is appropriate and suitable to the client's needs and circumstances.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Avoid or mitigate any actual or potential conflicts of interest.",
                isCorrect: false,
            },
        ],
        explanation: "The General Code of Conduct mandates ethical behaviour, suitability, and management of conflicts. It explicitly prohibits a provider from guaranteeing the performance or returns of any financial product, as this is misleading.",
        points: 5,
        categories: ["FAIS Act", "Ethics", "Code of Conduct"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 4,
        questionText: "A client submits a formal written complaint to a licensed FSP. In terms of the FAIS Ombud Rules, what is the maximum period the FSP has to provide a final written response to the client?",
        questionType: "single",
        options: [
            { id: "a", text: "14 days", isCorrect: false },
            { id: "b", text: "30 days", isCorrect: false },
            { id: "c", text: "6 weeks", isCorrect: true },
            { id: "d", text: "3 months", isCorrect: false },
        ],
        explanation: "The FSP must have an internal complaints procedure. According to the Ombud Rules, the FSP must be given a maximum period of 6 weeks (42 calendar days) to resolve the complaint internally before the client can escalate the matter to the FAIS Ombud.",
        points: 5,
        categories: ["FAIS Act", "Complaints Management", "FAIS Ombud"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 5,
        questionText: "Which ONE of the following bodies is the primary regulator responsible for supervising and enforcing the market conduct of FSPs under the FAIS Act?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "South African Reserve Bank (SARB).",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Financial Sector Conduct Authority (FSCA).",
                isCorrect: true,
            },
            {
                id: "c",
                text: "National Treasury.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Financial Intelligence Centre (FIC).",
                isCorrect: false,
            },
        ],
        explanation: "Under the 'Twin Peaks' model, the Financial Sector Conduct Authority (FSCA) is the market conduct regulator responsible for supervising FSPs and enforcing the FAIS Act to protect clients.",
        points: 5,
        categories: ["FAIS Act", "Regulatory Bodies", "Legislation"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 6,
        questionText: "The General Code of Conduct requires certain disclosures to be made to a client *before* any financial service is rendered. Which of the following information must be disclosed?\n\ni. The FSP's license details and contact information.\nii. The FSP's detailed remuneration and fees structure.\niii. Any actual or potential conflicts of interest.\niv. The Representative's personal investment portfolio.",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "i & ii only",
                isCorrect: false,
            },
            {
                id: "b",
                text: "iii & iv only",
                isCorrect: false,
            },
            {
                id: "c",
                text: "i, ii & iii only",
                isCorrect: true,
            },
            {
                id: "d",
                text: "i, ii, iii & iv",
                isCorrect: false,
            },
        ],
        explanation: "The Code of Conduct requires disclosure of the FSP's status (i), remuneration (ii), and any conflicts of interest (iii) before rendering a service. A representative's personal investment portfolio (iv) is private and not a required disclosure.",
        points: 5,
        categories: ["FAIS Act", "Disclosure", "Ethics"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 7,
        questionText: "The FIC Act's Risk-Based Approach requires different levels of due diligence. In which ONE of the following circumstances would Enhanced Due Diligence (EDD) be mandatory?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "For all clients, to ensure maximum compliance.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "For clients or transactions identified as high-risk (e.g., a PEP).",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Only for clients who are legal entities (companies and trusts).",
                isCorrect: false,
            },
            {
                id: "d",
                text: "EDD is a voluntary best practice, not a mandatory requirement.",
                isCorrect: false,
            },
        ],
        explanation: "The Risk-Based Approach mandates that while Standard Due Diligence is the default, Enhanced Due Diligence (EDD) *must* be applied in situations identified as high-risk, such as dealing with Politically Exposed Persons (PEPs) or clients from high-risk jurisdictions.",
        points: 5,
        categories: ["FIC Act", "Risk Management", "Compliance"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 8,
        questionText: "Which ONE of the following statements best describes 'Know Your Client' (KYC) in the context of financial services?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "A marketing strategy to personalize client communication.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "The process of identifying and verifying a client's identity and understanding their financial needs and risk profile.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "A social media strategy to build a client network.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "An annual customer satisfaction survey.",
                isCorrect: false,
            },
        ],
        explanation: "KYC is a twofold process: 1) It involves the FIC Act requirement to identify and verify identity (CDD). 2) It involves the FAIS Act requirement to conduct a needs analysis to understand the client's financial situation, needs, and risk profile.",
        points: 5,
        categories: ["Client Onboarding", "KYC", "Best Practices"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 9,
        questionText: "Which ONE of the following individuals would be classified as a Politically Exposed Person (PEP) under the FIC Act?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Any person employed by the government.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "A senior government official, such as a cabinet minister, who is in a prominent public position.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "All members of a registered political party.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The CEO of a large private corporation.",
                isCorrect: false,
            },
        ],
        explanation: "A PEP is an individual who holds (or has held) a prominent public function (e.g., a cabinet minister, a senior judge, a high-ranking military officer). This status puts them at a higher risk for involvement in bribery or corruption, requiring EDD.",
        points: 5,
        categories: ["FIC Act", "Risk Management", "PEPs"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 10,
        questionText: "What is the minimum number of Continuous Professional Development (CPD) hours required for a Representative who renders services in a single sub-category in a single class of business?",
        questionType: "single",
        options: [
            { id: "a", text: "3 hours", isCorrect: false },
            { id: "b", text: "6 hours", isCorrect: true },
            { id: "c", text: "12 hours", isCorrect: false },
            { id: "d", text: "18 hours", isCorrect: false },
        ],
        explanation: "The Fit and Proper requirements state that a representative must complete a minimum of 6 CPD hours per cycle for one sub-category. The requirement increases to 12 hours for multiple sub-categories and 18 hours for multiple classes of business.",
        points: 5,
        categories: ["Professional Development", "FAIS Act", "CPD"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 11,
        questionText: "A person provides financial advice to clients without being an authorised FSP or a Representative of one. Which ONE of the following statements is correct?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "This is permissible if the person is highly experienced.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "This is only a civil offence, resulting in a fine.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "This is a criminal offence under the FAIS Act and is punishable by a fine and/or imprisonment.",
                isCorrect: true,
            },
            {
                id: "d",
                text: "This is permissible if the person does not charge a fee.",
                isCorrect: false,
            },
        ],
        explanation: "Operating without an FSP license (or acting as an unauthorized representative) is a serious criminal offense under the FAIS Act, carrying severe penalties including fines up to R10 million and/or imprisonment up to 10 years.",
        points: 5,
        categories: ["FAIS Act", "Licensing", "Compliance"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 12,
        questionText: "Which document must be provided to a client by a Representative *after* financial advice is given, detailing the recommendation and the reasons for it?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "A marketing brochure for the product.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "A Record of Advice (ROA).",
                isCorrect: true,
            },
            {
                id: "c",
                text: "The FSP's annual compliance report.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "A copy of the FAIS Act.",
                isCorrect: false,
            },
        ],
        explanation: "The General Code of Conduct (Sec 9) mandates that a Record of Advice (ROA) must be provided to the client after advice is given. This document summarizes the needs analysis, the products recommended, and the reasons *why* the advice is considered suitable.",
        points: 5,
        categories: ["FAIS Act", "Documentation", "Compliance"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 13,
        questionText: "An FSP's employee has a reasonable suspicion that a client's transaction involves the proceeds of crime. To which ONE of the following bodies must a report be made?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Financial Intelligence Centre (FIC)",
                isCorrect: true,
            },
            {
                id: "b",
                text: "South African Police Service (SAPS)",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Financial Sector Conduct Authority (FSCA)",
                isCorrect: false,
            },
            {
                id: "d",
                text: "FAIS Ombud",
                isCorrect: false,
            },
        ],
        explanation: "The FIC Act mandates that all Suspicious or Unusual Transaction Reports (STRs) must be submitted to the Financial Intelligence Centre (FIC).",
        points: 5,
        categories: ["FIC Act", "Compliance", "Reporting"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 14,
        questionText: "A Representative, after filing an STR on a client, informs the client that they are 'under investigation by the authorities'. This action is a criminal offence known as:",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Providing a financial tip.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Tipping off.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Client relations management.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "An intermediary service.",
                isCorrect: false,
            },
        ],
        explanation: "The FIC Act (Sec 29(3)) contains the 'Tipping-Off Prohibition'. It is a criminal offence to inform anyone (especially the client) that an STR has been filed, as this could prejudice the investigation.",
        points: 5,
        categories: ["FIC Act", "Anti-Money Laundering", "Compliance"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 15,
        questionText: "What is the primary purpose of conducting a Financial Needs Analysis (FNA) as required by the General Code of Conduct?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To identify the maximum commission the Representative can earn.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "To gather sufficient information to provide advice that is suitable for the client's specific needs, objectives, and financial situation.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "To complete the Customer Due Diligence process for the FIC Act.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To determine which client is the wealthiest.",
                isCorrect: false,
            },
        ],
        explanation: "The FNA is the process (required by Sec 8 of the Code) of gathering information about the client's financial situation, needs, and objectives. Its sole purpose is to form the basis for providing 'suitable' advice.",
        points: 5,
        categories: ["Client Onboarding", "Best Practices", "FAIS Act"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 16,
        questionText: "The General Code of Conduct requires a provider to manage conflicts of interest. Which of the following scenarios represents a conflict of interest that must be disclosed?\n\ni. The FSP receives commission from the Product Supplier whose product is being recommended.\nii. The Representative has a significant ownership stake in the Product Supplier.\niii. The Representative is a qualified and competent financial advisor.\niv. The Representative receives non-monetary benefits (e.g., a holiday) from a supplier for meeting sales targets.",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "i & ii only",
                isCorrect: false,
            },
            {
                id: "b",
                text: "iii & iv only",
                isCorrect: false,
            },
            {
                id: "c",
                text: "i, ii & iv only",
                isCorrect: true,
            },
            {
                id: "d",
                text: "i, ii, iii & iv",
                isCorrect: false,
            },
        ],
        explanation: "A conflict of interest is any situation that may bias advice. Receiving commission (i), having an ownership stake (ii), or receiving incentives (iv) are all clear conflicts that must be managed and disclosed. Being qualified (iii) is a regulatory requirement, not a conflict.",
        points: 5,
        categories: ["Ethics", "Conflicts of Interest", "FAIS Act"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 17,
        questionText: "For what minimum period must an FSP retain records of advice and client transactions after the service or product is terminated?",
        questionType: "single",
        options: [
            { id: "a", text: "1 year", isCorrect: false },
            { id: "b", text: "3 years", isCorrect: false },
            { id: "c", text: "5 years", isCorrect: true },
            { id: "d", text: "10 years", isCorrect: false },
        ],
        explanation: "The FAIS Act (Sec 18) and General Code of Conduct (Sec 3(4)) require FSPs to retain records for a minimum of 5 years after the termination of the product or service, to ensure they are available for regulatory inspection or complaint investigation.",
        points: 5,
        categories: ["Record Keeping", "FAIS Act", "Compliance"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 18,
        questionText: "Which ONE of the following best describes the role of a **Key Individual** in an FSP?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "A person who only manages the FSP's financial accounts.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "A person responsible for the management and oversight of the FSP's compliance with the FAIS Act.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "The representative with the highest sales figures.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "An external auditor who reviews the FSP annually.",
                isCorrect: false,
            },
        ],
        explanation: "The Key Individual (KI) is the person (or one of the persons) legally responsible for the management and oversight of the FSP's regulated activities. They are the 'mind and management' accountable to the FSCA for the FSP's compliance.",
        points: 5,
        categories: ["FAIS Act", "Organizational Structure", "Compliance"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 19,
        questionText: "The 'Fit and Proper' requirements for FSPs and Representatives include which of the following pillars?\n\ni. Honesty, Integrity & Good Standing\nii. Competence\niii. Financial Soundness\niv. Operational Ability (for FSPs only)",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "i & ii only",
                isCorrect: false,
            },
            {
                id: "b",
                text: "i, ii, iii & iv",
                isCorrect: true,
            },
            {
                id: "c",
                text: "i, ii & iii only",
                isCorrect: false,
            },
            {
                id: "d",
                text: "iv only",
                isCorrect: false,
            },
        ],
        explanation: "The Fit and Proper requirements (FAIS Act, Sec 8) are based on these pillars. Honesty (i), Competence (ii), and Financial Soundness (iii) apply to KIs and Reps. Operational Ability (iv) applies to the FSP itself, which the KI must oversee.",
        points: 5,
        categories: ["FAIS Act", "Licensing", "Professionalism"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 20,
        questionText: "A transaction involving a cash payment (or series of payments) must be reported as a Cash Threshold Report (CTR) to the FIC if it exceeds:",
        questionType: "single",
        options: [
            { id: "a", text: "R10,000", isCorrect: false },
            { id: "b", text: "R49,999.99", isCorrect: true },
            { id: "c", text: "R50,000.01", isCorrect: false },
            { id: "d", text: "R100,000", isCorrect: false },
        ],
        explanation: "The FIC Act mandates that cash transactions *of* R50,000.00 or more must be reported. This means the threshold is met at R50,000, so any amount *exceeding* R49,999.99 triggers the report.",
        points: 5,
        categories: ["FIC Act", "Compliance", "Reporting"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 21,
        questionText: "Which ONE of the following statements is correct regarding the **Ombud for Financial Services Providers (FAIS Ombud)**?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "The Ombud's primary role is to issue FSP licenses.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "The Ombud resolves disputes between clients and FSPs in an informal, fair, and expeditious manner.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "The Ombud's decisions are only recommendations and are not legally binding.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The Ombud is responsible for prosecuting criminal FSPs.",
                isCorrect: false,
            },
        ],
        explanation: "The FAIS Ombud is a statutory body (FAIS Act, Sec 27) created to resolve disputes between clients and FSPs. Its process is designed to be informal, quick (expeditious), and procedurally fair, as an alternative to the civil courts.",
        points: 5,
        categories: ["Regulatory Bodies", "Complaints Management", "FAIS Ombud"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 22,
        questionText: "Which of the six **Treating Customers Fairly (TCF)** outcomes focuses on ensuring that advice given to a client is suitable and appropriate?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Outcome 1: Fair Culture",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Outcome 4: Suitable Advice",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Outcome 2: Product Design",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Outcome 6: Claims, Complaints & Post-Sale Barriers",
                isCorrect: false,
            },
        ],
        explanation: "TCF Outcome 4 specifically states that 'Customers are given advice that is suitable and takes account of their circumstances'. This links directly to the suitability requirements in the General Code of Conduct.",
        points: 5,
        categories: ["TCF", "Consumer Protection", "Product Suitability"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 23,
        questionText: "Which ONE of the following is an example of a **Tier 2** financial product under the FAIS Act?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "A funeral policy.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "A retirement annuity.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "A collective investment scheme (unit trust).",
                isCorrect: false,
            },
            {
                id: "d",
                text: "A derivative instrument.",
                isCorrect: false,
            },
        ],
        explanation: "Tier 2 products are defined as simple, low-risk products. The primary examples are funeral policies (Subcategory 1.1) and health service benefits (Subcategory 1.8). All other products, like B, C, and D, are Tier 1.",
        points: 5,
        categories: ["FAIS Act", "Product Classification", "Licensing"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 24,
        questionText: "What is the main purpose of the **Protection of Personal Information Act (POPIA)**?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To regulate how all public and private bodies process personal information and to protect data subjects from harm.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To prevent organized crime and money laundering.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To ensure all financial advice is suitable.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To regulate the prudential soundness of banks.",
                isCorrect: false,
            },
        ],
        explanation: "POPIA (or POPI Act) is South Africa's primary data protection law. It governs how 'personal information' must be lawfully processed (collected, stored, used, and destroyed) by responsible parties (like FSPs).",
        points: 5,
        categories: ["POPIA", "Data Protection", "Privacy", "Legislation"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 25,
        questionText: "Under POPIA, personal information may only be retained for as long as necessary to achieve the purpose for which it was collected. Which ONE of the following is an exception to this rule?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Retention is required by another law (e.g., the 5-year FAIS rule).",
                isCorrect: true,
            },
            {
                id: "b",
                text: "The FSP wishes to use the data for future marketing.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "The client has forgotten about the data.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The data is very valuable to the FSP.",
                isCorrect: false,
            },
        ],
        explanation: "POPIA's retention rule (Condition 7) is subject to other legislation. Although POPIA says 'destroy when no longer needed', the FAIS Act (Sec 18) *requires* records to be kept for 5 years. This legal obligation overrides the general POPIA rule, allowing the FSP to retain the data for the 5-year period.",
        points: 5,
        categories: ["POPIA", "Data Protection", "Record Keeping"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 26,
        questionText: "What is the 'cooling-off' period for a standard long-term insurance policy, during which a client can cancel without penalty?",
        questionType: "single",
        options: [
            { id: "a", text: "7 days", isCorrect: false },
            { id: "b", text: "14 days", isCorrect: false },
            { id: "c", text: "31 days (or 30 days depending on the Act)", isCorrect: true },
            { id: "d", text: "60 days", isCorrect: false },
        ],
        explanation: "The Policyholder Protection Rules (PPRs) under the Long-Term Insurance Act provide clients with a 'cooling-off' period of 31 days from the date they receive the policy summary, during which they can cancel the policy and receive a refund of premiums.",
        points: 5,
        categories: ["Consumer Protection", "Long-term Insurance", "Policy Rights"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 27,
        questionText: "Choose the INCORRECT statement. Which of the following is NOT one of the 8 conditions for lawful processing under POPIA?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Accountability",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Processing Limitation",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Openness",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Profit Maximization",
                isCorrect: true,
            },
        ],
        explanation: "POPIA's 8 conditions for lawful processing are: Accountability, Processing Limitation, Purpose Specification, Further Processing Limitation, Information Quality, Openness, Security Safeguards, and Data Subject Participation. 'Profit Maximization' is not one of them.",
        points: 5,
        categories: ["POPIA", "Data Protection", "Compliance"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 28,
        questionText: "Which ONE of the following is a key component of the 'Competence' requirement for a Category I FSP representative?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Having a matric certificate only.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Passing the RE5 (Regulatory Exam) for representatives.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Having a valid driver's license.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Being financially sound.",
                isCorrect: false,
            },
        ],
        explanation: "The 'Competence' pillar for a representative is built on three parts: 1) A recognized Qualification, 2) The RE5 Regulatory Exam, and 3) Relevant Experience. Passing the RE5 is a mandatory component for Tier 1 product advisors.",
        points: 5,
        categories: ["Licensing", "Qualifications", "FAIS Act"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 29,
        questionText: "Under the **Treating Customers Fairly (TCF)** framework, who holds the ultimate responsibility for embedding a fair treatment culture within an FSP?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "The individual representatives only.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "The external Compliance Officer.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "The Board of Directors and Senior Management of the FSP.",
                isCorrect: true,
            },
            {
                id: "d",
                text: "The FSCA regulator.",
                isCorrect: false,
            },
        ],
        explanation: "TCF is a top-down regulatory approach. Outcome 1 (Fair Culture) places the primary and ultimate responsibility on the FSP's Board and Senior Management to create and maintain a culture where treating customers fairly is central to the business.",
        points: 5,
        categories: ["TCF", "Governance", "Management Responsibility"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 30,
        questionText: "What is the primary purpose of a **mandate agreement** between an FSP and its Representative?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To formally define the scope of authority and specific financial services the Representative is permitted to render on behalf of the FSP.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To replace the need for the FSP to have a license.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To set the commission rates the Representative will earn from Product Suppliers.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To bypass the FAIS Act's compliance requirements.",
                isCorrect: false,
            },
        ],
        explanation: "A mandate is a crucial internal document. It is the formal agreement that defines the boundaries of the Representative's 'scope of authority', detailing exactly which product categories and services they are competent and authorized to provide on behalf of the FSP.",
        points: 5,
        categories: ["Organizational Structure", "FAIS Act", "Compliance"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 31,
        questionText: "Which ONE of the following bodies is responsible for regulating the *market conduct* of short-term insurers in South Africa?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "The Prudential Authority (PA).",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Financial Sector Conduct Authority (FSCA).",
                isCorrect: true,
            },
            {
                id: "c",
                text: "The National Treasury.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The Road Accident Fund (RAF).",
                isCorrect: false,
            },
        ],
        explanation: "Under the 'Twin Peaks' model, the Prudential Authority (PA) regulates the financial soundness (solvency) of insurers, while the Financial Sector Conduct Authority (FSCA) regulates their *market conduct* (how they treat clients, advertise, and sell policies) under the FAIS Act.",
        points: 5,
        categories: ["Regulatory Bodies", "Short-term Insurance", "Twin Peaks"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 32,
        questionText: "Which ONE of the following statements correctly distinguishes between 'advice' and 'intermediary services'?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "There is no legal difference; both are the same service.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Advice involves a recommendation, while an intermediary service is an action like administration or processing a claim.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Advice requires an FSP license, but intermediary services do not.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Only advice is subject to the General Code of Conduct.",
                isCorrect: false,
            },
        ],
        explanation: "The FAIS Act (Sec 1 Definitions) makes a clear distinction. 'Advice' involves a 'recommendation, guidance or proposal'. 'Intermediary services' are all other actions, such as processing applications, collecting premiums, or handling claims.",
        points: 5,
        categories: ["FAIS Act", "Service Definition", "Licensing"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 33,
        questionText: "Under the FIC Act, what does the term **'Beneficial Owner'** refer to?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "The person who is named as the beneficiary on a life insurance policy.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "The natural person who ultimately owns or controls a client (like a company or trust) or on whose behalf a transaction is conducted.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "The insurance company that issues the product.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The financial advisor who receives commission on the transaction.",
                isCorrect: false,
            },
        ],
        explanation: "A 'Beneficial Owner' (FIC Act, Sec 21B) is the *natural person* (human) hiding behind a legal entity. It is the person who ultimately owns or controls the entity, and FSPs are required to identify and verify this person as part of CDD.",
        points: 5,
        categories: ["FIC Act", "Definitions", "KYC"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 34,
        questionText: "A Representative convinces a client to cancel an existing investment policy and take out a new one, primarily so the Representative can earn a new commission, even though the switch is not in the client's best interest. This unethical practice is known as:",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Churning.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "Financial planning.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Due diligence.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Tipping off.",
                isCorrect: false,
            },
        ],
        explanation: "Churning is the unethical and illegal practice of encouraging a client to make unnecessary policy replacements (or transactions) for the main purpose of generating new commissions for the representative.",
        points: 5,
        categories: ["Ethics", "Misconduct", "Consumer Protection"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 35,
        questionText: "What is the primary purpose of the **Policyholder Protection Rules (PPRs)** issued under the Long-Term and Short-Term Insurance Acts?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To set minimum standards for the fair treatment of policyholders by insurers.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To determine the premium rates for all insurance products.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To license and debar insurance agents and brokers.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To manage the solvency and capital of insurance companies.",
                isCorrect: false,
            },
        ],
        explanation: "The PPRs are market conduct regulations that set the minimum standards for how insurers (Product Suppliers) must treat their policyholders. They cover areas like disclosure, complaints, and advertising, ensuring fair treatment.",
        points: 5,
        categories: ["Consumer Protection", "PPRs", "Insurance"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 36,
        questionText: "A person is found guilty of contravening a material provision of the FAIS Act. What is the maximum penalty the court can impose?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "A fine of R1 million and/or 1 year imprisonment.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "A fine of R5 million and/or 5 years imprisonment.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "A fine of R10 million and/or 10 years imprisonment.",
                isCorrect: true,
            },
            {
                id: "d",
                text: "There are no criminal penalties, only administrative fines.",
                isCorrect: false,
            },
        ],
        explanation: "Contravening the FAIS Act (e.g., acting as an unauthorized FSP) is a serious criminal offense. The Act (Sec 36) provides for a maximum penalty of a R10 million fine, or 10 years imprisonment, or both.",
        points: 5,
        categories: ["FAIS Act", "Penalties", "Compliance"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 37,
        questionText: "Which ONE of the following is a key component of a **Financial Needs Analysis (FNA)**?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Identifying the client's financial situation, needs, and risk profile.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "Calculating the Representative's potential commission.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Verifying the client's identity for FIC Act purposes.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Setting the premium for the insurance policy.",
                isCorrect: false,
            },
        ],
        explanation: "The FNA (or 'needs analysis' under the GCoC) is the process of gathering all relevant information about a client's current financial situation, their future goals (needs/objectives), and their willingness to take risk (risk profile) to form the basis for suitable advice.",
        points: 5,
        categories: ["Needs Analysis", "Best Practices", "Client Onboarding"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 38,
        questionText: "Which **TCF Outcome** ensures that 'Customers are provided with clear information and are kept appropriately informed before, during and after the point of sale'?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Outcome 2: Product Design",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Outcome 3: Clear Information",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Outcome 5: Product Performance",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Outcome 6: Claims & Complaints",
                isCorrect: false,
            },
        ],
        explanation: "TCF Outcome 3 ('Clear Information') specifically addresses the need for all communication and information (e.g., marketing, disclosures, advice) to be clear, fair, and not misleading at all stages of the client relationship.",
        points: 5,
        categories: ["TCF", "Communication", "Disclosure"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 39,
        questionText: "Under the 'Twin Peaks' model, what is the primary role of the **Prudential Authority (PA)**?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To supervise the safety and soundness (solvency) of financial institutions like banks and insurers.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To regulate the market conduct of all FSPs.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To resolve all consumer complaints against FSPs.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To combat money laundering and issue fines.",
                isCorrect: false,
            },
        ],
        explanation: "The 'Twin Peaks' model divides regulation. The Prudential Authority (PA) is 'Peak 1' and is responsible for 'prudential' supervision, which means ensuring the financial safety and soundness (solvency) of banks, insurers, and other key financial institutions.",
        points: 5,
        categories: ["Regulatory Bodies", "Twin Peaks", "Financial Stability"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 40,
        questionText: "South Africa's 'Twin Peaks' model of financial regulation refers to which two primary regulators?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "The South African Reserve Bank and the National Treasury.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "The Prudential Authority (PA) and the Financial Sector Conduct Authority (FSCA).",
                isCorrect: true,
            },
            {
                id: "c",
                text: "The FSCA and the FAIS Ombud.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The FSCA and the Financial Intelligence Centre (FIC).",
                isCorrect: false,
            },
        ],
        explanation: "The 'Twin Peaks' model, introduced by the FSR Act, created two main regulators: The Prudential Authority (PA) (Peak 1, for prudential soundness) and the Financial Sector Conduct Authority (FSCA) (Peak 2, for market conduct).",
        points: 5,
        categories: ["Regulatory Framework", "Twin Peaks", "Regulatory Bodies"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 41,
        questionText: "What is the primary purpose of the disclosure requirements under the FAIS Act's General Code of Conduct?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To provide clients with sufficient material information to enable them to make informed financial decisions.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To advertise the FSP's products as effectively as possible.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To collect as much personal information from the client as possible.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To ensure the FSP avoids paying taxes on commission.",
                isCorrect: false,
            },
        ],
        explanation: "The disclosure requirements (GCoC, Sec 4, etc.) are designed to ensure transparency. They require the FSP to give the client all 'material information' (about the FSP, the product, fees, and conflicts) so the client can make an 'informed decision'.",
        points: 5,
        categories: ["FAIS Act", "Disclosure", "Transparency"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 42,
        questionText: "Which of the following transactions would trigger **Enhanced Due Diligence (EDD)** under the FIC Act?\n\ni. A transaction involving a known Politically Exposed Person (PEP).\nii. A complex corporate transaction using offshore trusts to obscure ownership.\niii. A client making a standard, monthly R500 debit order for a funeral policy.\niv. A transaction with a client from a country known for high levels of corruption.",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "i & ii only",
                isCorrect: false,
            },
            {
                id: "b",
                text: "iii only",
                isCorrect: false,
            },
            {
                id: "c",
                text: "i, ii & iv only",
                isCorrect: true,
            },
            {
                id: "d",
                text: "i, ii, iii & iv",
                isCorrect: false,
            },
        ],
        explanation: "EDD is required for high-risk situations. These include dealing with PEPs (i), complex structures that obscure ownership (ii), and clients from high-risk geographic jurisdictions (iv). A simple, regular debit order (iii) is a low-risk transaction.",
        points: 5,
        categories: ["FIC Act", "Risk Management", "EDD"],
        difficulty: "advanced",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 43,
        questionText: "An FSP fails to ensure its representatives complete their mandatory CPD hours. This is a failure to meet the Fit and Proper requirement for:",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Financial Soundness.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "Honesty and Integrity.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Competence.",
                isCorrect: true,
            },
            {
                id: "d",
                text: "Operational Ability.",
                isCorrect: false,
            },
        ],
        explanation: "CPD is the mechanism for maintaining *ongoing* 'Competence'. An FSP (and its KI) has a duty to ensure its representatives remain competent. Failing to track or enforce CPD is a breach of this duty related to competence.",
        points: 5,
        categories: ["Professional Development", "CPD", "Compliance"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 44,
        questionText: "Under POPIA, which of the following actions are mandatory *before* an FSP can collect a new client's personal information?\n\ni. Obtain the client's consent.\nii. Inform the client of the specific purpose for which the information is being collected.\niii. Ensure the collection is lawful and does not infringe on the client's privacy.\niv. Register the client's details with the Information Regulator.",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "i & ii only",
                isCorrect: false,
            },
            {
                id: "b",
                text: "i, ii & iii only",
                isCorrect: true,
            },
            {
                id: "c",
                text: "iv only",
                isCorrect: false,
            },
            {
                id: "d",
                text: "i, ii, iii & iv",
                isCorrect: false,
            },
        ],
        explanation: "POPIA's 'Processing Limitation' (Condition 2) and 'Purpose Specification' (Condition 3) require that processing is lawful (iii) and that the client gives consent (i) for a specific, defined purpose (ii). There is no requirement to register every new client's details with the Regulator (iv).",
        points: 5,
        categories: ["POPIA", "Data Protection", "Consent"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 45,
        questionText: "What is the key difference between a **tied agent** and an **independent financial advisor (IFA)**?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "A tied agent represents one insurer, while an IFA is not tied and can offer products from multiple insurers.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "An IFA is an employee, while a tied agent is an independent contractor.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Tied agents are not regulated by the FAIS Act, but IFAs are.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "IFAs cannot earn commission, but tied agents can.",
                isCorrect: false,
            },
        ],
        explanation: "A 'tied agent' (or tied representative) is contracted to represent only one Product Supplier (or group). An 'independent' advisor (IFA) is not tied and is able to advise on and sell products from multiple different product suppliers, offering a wider market comparison.",
        points: 5,
        categories: ["FAIS Act", "Broker Types", "Industry Structure"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 46,
        questionText: "Which of the following scenarios would be considered a 'red flag' for potential money laundering?\n\ni. A client is reluctant to provide identification documents and is vague about their source of income.\nii. A client wishes to make a large, unusual cash deposit.\niii. A client makes consistent, small, monthly debit order payments for a funeral policy.\niv. A client makes frequent, complex international transfers to high-risk jurisdictions with no clear business reason.",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "i & ii only",
                isCorrect: false,
            },
            {
                id: "b",
                text: "iii only",
                isCorrect: false,
            },
            {
                id: "c",
                text: "i, ii & iv only",
                isCorrect: true,
            },
            {
                id: "d",
                text: "i, ii, iii & iv",
                isCorrect: false,
            },
        ],
        explanation: "Red flags for money laundering include secrecy/vagueness (i), large or unusual cash transactions (ii), and complex or high-risk international transfers with no logic (iv). A consistent, small debit order (iii) is a normal, low-risk activity.",
        points: 5,
        categories: ["Anti-Money Laundering", "FIC Act", "Risk Indicators"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 47,
        questionText: "What is the maximum period for submitting a complaint to the FAIS Ombud after the client becomes aware of the issue?",
        questionType: "single",
        options: [
            { id: "a", text: "3 months", isCorrect: false },
            { id: "b", text: "6 months", isCorrect: true },
            { id: "c", text: "1 year", isCorrect: false },
            { id: "d", text: "3 years", isCorrect: false },
        ],
        explanation: "A client must first complain to the FSP. If they get a final response (or no response after 6 weeks), they have 6 months from that date to submit their complaint to the FAIS Ombud. (Note: There is also a 3-year prescription from the date of the act or omission).",
        points: 5,
        categories: ["Complaints Management", "Ombud", "Timeframes"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 48,
        questionText: "Which ONE of the following is a fundamental principle of insurance law that requires a policyholder to have a financial interest in the insured item or life?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "Insurable Interest",
                isCorrect: true,
            },
            {
                id: "b",
                text: "Utmost Good Faith",
                isCorrect: false,
            },
            {
                id: "c",
                text: "Indemnity",
                isCorrect: false,
            },
            {
                id: "d",
                text: "Subrogation",
                isCorrect: false,
            },
        ],
        explanation: "The principle of 'Insurable Interest' states that the policyholder must stand to suffer a direct, measurable financial loss if the insured event occurs. Without this, the contract is a wager and is unenforceable.",
        points: 5,
        categories: ["Insurance Principles", "Legal Principles"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 49,
        questionText: "Under **Treating Customers Fairly (TCF)**, what is meant by the 'product lifecycle'?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "The warranty period of the product.",
                isCorrect: false,
            },
            {
                id: "b",
                text: "All stages from product design, marketing, advice, and sale, through to post-sale service, complaints, and claims.",
                isCorrect: true,
            },
            {
                id: "c",
                text: "Only the point-of-sale and advice stage.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "The policy's term or duration.",
                isCorrect: false,
            },
        ],
        explanation: "The TCF framework applies to the *entire* 'product lifecycle'. This means fairness must be embedded in the product's design, how it's marketed, the advice given at the sale, and all post-sale interactions, including administration, complaints, and claims.",
        points: 5,
        categories: ["TCF", "Product Management", "Consumer Protection"],
        difficulty: "intermediate",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
    {
        questionNumber: 50,
        questionText: "What is the primary purpose of the **Financial Intelligence Centre (FIC)**?",
        questionType: "single",
        options: [
            {
                id: "a",
                text: "To identify the proceeds of crime, combat money laundering, and terrorist financing.",
                isCorrect: true,
            },
            {
                id: "b",
                text: "To regulate the market conduct of FSPs.",
                isCorrect: false,
            },
            {
                id: "c",
                text: "To provide investment advice to the public.",
                isCorrect: false,
            },
            {
                id: "d",
                text: "To manage the government's budget and set interest rates.",
                isCorrect: false,
            },
        ],
        explanation: "The FIC is South Africa's national center for gathering and analyzing financial intelligence. Its primary purpose (as per the FIC Act) is to combat money laundering and the financing of terrorism.",
        points: 5,
        categories: ["FIC Act", "Regulatory Bodies", "Anti-Money Laundering"],
        difficulty: "beginner",
        tierAccess: ["free"],
        isFreeQuestion: true,
    },
];
async function deleteAllQuestionsAndExams() {
    console.log("🗑️  Deleting all existing exams and questions...");
    try {
        // Scan for all exam items
        const scanCommand = new lib_dynamodb_1.ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "begins_with(PK, :examPrefix)",
            ExpressionAttributeValues: {
                ":examPrefix": "EXAM#",
            },
        });
        const result = await docClient.send(scanCommand);
        if (result.Items && result.Items.length > 0) {
            console.log(`Found ${result.Items.length} items to delete`);
            // Delete each item
            for (const item of result.Items) {
                console.log(`Deleting: ${item["PK"]} - ${item["SK"]}`);
                const deleteCommand = new lib_dynamodb_1.DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        PK: item["PK"],
                        SK: item["SK"],
                    },
                });
                await docClient.send(deleteCommand);
            }
            console.log("✅ All existing exams and questions deleted");
        }
        else {
            console.log("No existing exams or questions found");
        }
    }
    catch (error) {
        console.error("Error deleting existing data:", error);
        throw error;
    }
}
async function createExam() {
    console.log("📝 Creating exam metadata...");
    try {
        const command = new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: examMetadata,
        });
        await docClient.send(command);
        console.log("✅ Exam metadata created");
    }
    catch (error) {
        console.error("Error creating exam:", error);
        throw error;
    }
}
async function createQuestions() {
    console.log("📝 Creating questions...");
    for (const question of questions) {
        const questionId = `q${question.questionNumber
            .toString()
            .padStart(3, "0")}`;
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            entityType: "QUESTION",
        };
        try {
            const command = new lib_dynamodb_1.PutCommand({
                TableName: TABLE_NAME,
                Item: questionItem,
            });
            await docClient.send(command);
            console.log(`✅ Question ${question.questionNumber} created: ${question.questionText.substring(0, 50)}...`);
        }
        catch (error) {
            console.error(`Error creating question ${question.questionNumber}:`, error);
            throw error;
        }
    }
    console.log("✅ All questions created");
}
async function main() {
    console.log("🚀 Starting RE5 Exam Seed Script");
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`📋 Exam ID: ${EXAM_ID}`);
    console.log("");
    try {
        // Step 1: Delete all existing data
        await deleteAllQuestionsAndExams();
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
        console.log("");
        console.log("✨ You can now navigate to /exam/re5-full-exam/start to view the exam");
    }
    catch (error) {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }
}
main();