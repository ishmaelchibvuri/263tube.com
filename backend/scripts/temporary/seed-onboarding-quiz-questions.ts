import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Get table name from environment or default to dev
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith("--env="));
const envName = envArg ? envArg.split("=")[1] : "dev";
const TABLE_NAME = process.env.TABLE_NAME || `exam-platform-data-${envName}`;

const EXAM_ID = "ONBOARDING_QUIZ";

const questions = [
  {
    questionNumber: 1,
    questionText: "What is the primary objective of the Financial Advisory and Intermediary Services Act (FAIS Act)?",
    options: [
      { id: "A", text: "To regulate tax collection in South Africa", isCorrect: false },
      { id: "B", text: "To protect consumers of financial services and ensure the professional and ethical standards of financial service providers", isCorrect: true },
      { id: "C", text: "To manage the national budget", isCorrect: false },
      { id: "D", text: "To regulate imports and exports", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "The FAIS Act was enacted to protect consumers of financial services by ensuring that financial service providers (FSPs) maintain high professional and ethical standards. It regulates the conduct of FSPs and their representatives to promote transparency and fair treatment of clients.",
    category: "Regulatory Frameworks",
    difficulty: "beginner",
  },
  {
    questionNumber: 2,
    questionText: "Under FICA, what is the main purpose of Customer Due Diligence (CDD)?",
    options: [
      { id: "A", text: "To verify the identity of clients and assess money laundering risks", isCorrect: true },
      { id: "B", text: "To determine investment preferences", isCorrect: false },
      { id: "C", text: "To calculate tax obligations", isCorrect: false },
      { id: "D", text: "To market additional products", isCorrect: false },
    ],
    correctAnswer: "A",
    explanation: "Customer Due Diligence (CDD) under FICA (Financial Intelligence Centre Act) is a critical process to verify client identities and assess the risk of money laundering and terrorist financing. CDD helps financial institutions understand who their clients are and detect suspicious activities.",
    category: "Compliance & Risk Management",
    difficulty: "beginner",
  },
  {
    questionNumber: 3,
    questionText: "Which body is responsible for supervising compliance with the FAIS Act?",
    options: [
      { id: "A", text: "South African Reserve Bank (SARB)", isCorrect: false },
      { id: "B", text: "Financial Sector Conduct Authority (FSCA)", isCorrect: true },
      { id: "C", text: "National Treasury", isCorrect: false },
      { id: "D", text: "Companies and Intellectual Property Commission (CIPC)", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "The Financial Sector Conduct Authority (FSCA) is responsible for supervising and enforcing compliance with the FAIS Act. The FSCA replaced the Financial Services Board (FSB) and is dedicated to protecting financial customers and promoting market integrity.",
    category: "Regulatory Frameworks",
    difficulty: "beginner",
  },
  {
    questionNumber: 4,
    questionText: "What is the meaning of 'Know Your Client' (KYC) in financial services?",
    options: [
      { id: "A", text: "Marketing strategy to personalize communication", isCorrect: false },
      { id: "B", text: "Process of verifying client identity and understanding their financial needs and risk profile", isCorrect: true },
      { id: "C", text: "Social media strategy", isCorrect: false },
      { id: "D", text: "Customer satisfaction survey", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "Know Your Client (KYC) is a fundamental process in financial services where advisors verify the identity of their clients and gain a comprehensive understanding of their financial situation, goals, needs, and risk tolerance. This ensures suitable advice and helps prevent fraud and money laundering.",
    category: "Client Engagement",
    difficulty: "beginner",
  },
  {
    questionNumber: 5,
    questionText: "What is the minimum CPD (Continuing Professional Development) requirement for FSPs per year?",
    options: [
      { id: "A", text: "10 hours", isCorrect: false },
      { id: "B", text: "15 hours", isCorrect: false },
      { id: "C", text: "20 hours", isCorrect: true },
      { id: "D", text: "30 hours", isCorrect: false },
    ],
    correctAnswer: "C",
    explanation: "Financial Service Providers (FSPs) are required to complete a minimum of 20 hours of Continuing Professional Development (CPD) annually. This requirement ensures that FSPs stay current with industry developments, regulatory changes, and best practices in financial services.",
    category: "Professional Standards",
    difficulty: "beginner",
  },
  {
    questionNumber: 6,
    questionText: "Which document must be provided to a client after financial advice is given?",
    options: [
      { id: "A", text: "Marketing brochure", isCorrect: false },
      { id: "B", text: "Record of Advice (ROA)", isCorrect: true },
      { id: "C", text: "Company annual report", isCorrect: false },
      { id: "D", text: "Investment dictionary", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "A Record of Advice (ROA) is a mandatory document under the FAIS Act that must be provided to clients after financial advice is given. The ROA details the advice provided, the client's needs and circumstances, the products recommended, and the reasons for the recommendations.",
    category: "Client Engagement",
    difficulty: "beginner",
  },
  {
    questionNumber: 7,
    questionText: "Under FICA, suspicious transactions must be reported to which authority?",
    options: [
      { id: "A", text: "Financial Intelligence Centre (FIC)", isCorrect: true },
      { id: "B", text: "South African Police Service", isCorrect: false },
      { id: "C", text: "National Treasury", isCorrect: false },
      { id: "D", text: "Local municipality", isCorrect: false },
    ],
    correctAnswer: "A",
    explanation: "The Financial Intelligence Centre (FIC) is the designated authority to receive reports of suspicious and unusual transactions under FICA. The FIC analyzes this information to combat money laundering, terrorist financing, and other financial crimes.",
    category: "Compliance & Risk Management",
    difficulty: "beginner",
  },
  {
    questionNumber: 8,
    questionText: "Under the Treating Customers Fairly (TCF) principles, which outcome focuses on product suitability?",
    options: [
      { id: "A", text: "Outcome 1: Fair culture", isCorrect: false },
      { id: "B", text: "Outcome 3: Suitable advice", isCorrect: false },
      { id: "C", text: "Outcome 4: Products and services meet needs", isCorrect: true },
      { id: "D", text: "Outcome 6: No unreasonable barriers", isCorrect: false },
    ],
    correctAnswer: "C",
    explanation: "TCF Outcome 4 states that 'Products and services marketed and sold in the retail market are designed to meet the needs of identified customer groups and are targeted accordingly.' This outcome ensures that financial products are suitable for the clients they are marketed to and meet their needs.",
    category: "Client Engagement",
    difficulty: "intermediate",
  },
  {
    questionNumber: 9,
    questionText: "What does POPIA stand for and what is its main purpose?",
    options: [
      { id: "A", text: "Protection of Personal Information Act - to protect personal information", isCorrect: true },
      { id: "B", text: "Prevention of Organized Crime Act - to fight organized crime", isCorrect: false },
      { id: "C", text: "Public Order and Prevention Act - to maintain public order", isCorrect: false },
      { id: "D", text: "Professional Organizations and Practices Act - to regulate professions", isCorrect: false },
    ],
    correctAnswer: "A",
    explanation: "POPIA (Protection of Personal Information Act) is South African legislation that regulates how personal information must be processed. It aims to protect individuals' privacy by setting conditions for the lawful processing of personal information, ensuring that organizations handle data responsibly and transparently.",
    category: "Compliance & Risk Management",
    difficulty: "beginner",
  },
  {
    questionNumber: 10,
    questionText: "Which principle of insurance requires full disclosure of all material facts?",
    options: [
      { id: "A", text: "Insurable interest", isCorrect: false },
      { id: "B", text: "Utmost good faith (uberrima fides)", isCorrect: true },
      { id: "C", text: "Indemnity", isCorrect: false },
      { id: "D", text: "Subrogation", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "Utmost good faith (uberrima fides) is a fundamental principle of insurance that requires both parties to an insurance contract to act honestly and disclose all material facts. This means the insured must provide complete and accurate information that could affect the insurer's decision to provide coverage or the terms of the policy.",
    category: "Insurance Principles",
    difficulty: "beginner",
  },
];

async function seedOnboardingQuizQuestions() {
  console.log(`🌱 Seeding ONBOARDING_QUIZ questions to ${TABLE_NAME}...`);

  const now = new Date().toISOString();
  let successCount = 0;

  for (const question of questions) {
    const questionId = `Q${question.questionNumber.toString().padStart(3, "0")}`;

    const questionItem = {
      PK: `EXAM#${EXAM_ID}`,
      SK: `QUESTION#${questionId}`,
      questionId,
      examId: EXAM_ID,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      questionType: "multiple-choice",
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      category: question.category,
      categories: [question.category],
      difficulty: question.difficulty,
      points: 10,
      timeLimit: 0, // No time limit per question
      tierAccess: ["free", "premium", "pro"],
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
      entityType: "QUESTION",
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: questionItem,
        })
      );

      successCount++;
      console.log(`   ✅ Question ${question.questionNumber}: ${question.questionText.substring(0, 60)}...`);
    } catch (error) {
      console.error(`   ❌ Failed to create question ${question.questionNumber}:`, error);
    }
  }

  console.log(`\n✅ Successfully seeded ${successCount}/${questions.length} questions to ONBOARDING_QUIZ`);
}

// Run the seed script
seedOnboardingQuizQuestions()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
