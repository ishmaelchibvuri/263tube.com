import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Get table name from command line argument or environment variable
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith("--env="));
const envName = envArg ? envArg.split("=")[1] : "dev";
const TABLE_NAME = process.env["TABLE_NAME"] || `exam-platform-data-${envName}`;
const SOURCE_EXAM_ID = "re5-premium-pro-exam"; // Source exam with 744 questions

// Define the 14 exam sets (B through O) for Premium/Pro users
// Set A (re5-free-exam) already exists for free tier users
// These sets are created from the 744 premium/pro questions
const EXAM_SETS = [
  { id: "re5-exam-set-b", letter: "B", tier: "premium", startIdx: 0, count: 50 },
  { id: "re5-exam-set-c", letter: "C", tier: "premium", startIdx: 50, count: 50 },
  { id: "re5-exam-set-d", letter: "D", tier: "premium", startIdx: 100, count: 50 },
  { id: "re5-exam-set-e", letter: "E", tier: "premium", startIdx: 150, count: 50 },
  { id: "re5-exam-set-f", letter: "F", tier: "premium", startIdx: 200, count: 50 },
  { id: "re5-exam-set-g", letter: "G", tier: "premium", startIdx: 250, count: 50 },
  { id: "re5-exam-set-h", letter: "H", tier: "premium", startIdx: 300, count: 50 },
  { id: "re5-exam-set-i", letter: "I", tier: "premium", startIdx: 350, count: 50 },
  { id: "re5-exam-set-j", letter: "J", tier: "premium", startIdx: 400, count: 50 },
  { id: "re5-exam-set-k", letter: "K", tier: "premium", startIdx: 450, count: 50 },
  { id: "re5-exam-set-l", letter: "L", tier: "premium", startIdx: 500, count: 50 },
  { id: "re5-exam-set-m", letter: "M", tier: "premium", startIdx: 550, count: 50 },
  { id: "re5-exam-set-n", letter: "N", tier: "premium", startIdx: 600, count: 50 },
  { id: "re5-exam-set-o", letter: "O", tier: "premium", startIdx: 650, count: 94 },
];

// Fetch all questions from the source exam in DynamoDB
async function fetchSourceQuestions(): Promise<any[]> {
  console.log(`📖 Fetching questions from source exam: ${SOURCE_EXAM_ID}...`);

  let questions: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  // Paginate through all questions
  do {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `EXAM#${SOURCE_EXAM_ID}`,
        ":sk": "QUESTION#",
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);
    questions = questions.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // Sort by question number to ensure proper ordering
  questions.sort((a, b) => a.questionNumber - b.questionNumber);

  console.log(`   ✅ Found ${questions.length} questions`);
  return questions;
}

// Create exam metadata for a specific set
function createExamMetadata(setConfig: typeof EXAM_SETS[0]) {
  const { id, letter, count } = setConfig;

  // Set duration: 120 minutes (7200 seconds) for standard sets, 240 minutes (14400 seconds) for Set O (larger set)
  const durationSeconds = count > 50 ? 14400 : 7200;

  return {
    PK: `EXAM#${id}`,
    SK: "METADATA",
    GSI1PK: "EXAM#ACTIVE",
    GSI1SK: `RE5#${new Date().toISOString()}`,
    GSI3PK: `EXAM#CATEGORY#RE5`,
    GSI3SK: `intermediate#${id}`,
    examId: id,
    title: `Full Exam Simulation - Set ${letter}`,
    description: `Comprehensive RE5 practice set ${letter} with ${count} challenging questions. Deepen your understanding of regulatory requirements and financial advisory standards.`,
    category: "RE5",
    difficulty: "intermediate",
    totalQuestions: count,
    totalTime: durationSeconds,
    duration: durationSeconds,
    passingScore: 70,
    pointsPerQuestion: 10,
    isActive: true,
    allowedTiers: ["premium", "pro"],
    isPremiumExam: true,
    isFreeExam: false,
    setLetter: letter,
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entityType: "EXAM",
  };
}

// Delete existing exam set data
async function deleteExamSet(examId: string) {
  console.log(`🗑️  Deleting existing exam: ${examId}...`);

  try {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":pk": `EXAM#${examId}`,
      },
    });

    const scanResult = await docClient.send(scanCommand);

    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log(`   Found ${scanResult.Items.length} items to delete`);

      for (const item of scanResult.Items) {
        const deleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: item["PK"],
            SK: item["SK"],
          },
        });
        await docClient.send(deleteCommand);
      }
      console.log(`   ✅ Deleted ${scanResult.Items.length} items`);
    } else {
      console.log(`   No existing data found`);
    }
  } catch (error) {
    console.error(`Error deleting exam ${examId}:`, error);
    throw error;
  }
}

// Create an exam set
async function createExamSet(setConfig: typeof EXAM_SETS[0], allQuestions: any[]) {
  const { id, letter, startIdx, count } = setConfig;

  console.log(`\n📚 Creating Exam Set ${letter} (${id})...`);

  // Delete existing data first
  await deleteExamSet(id);

  // Create exam metadata
  const metadata = createExamMetadata(setConfig);
  const metadataCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: metadata,
  });
  await docClient.send(metadataCommand);
  console.log(`   ✅ Exam metadata created`);

  // Get the questions for this set
  const setQuestions = allQuestions.slice(startIdx, startIdx + count);

  if (setQuestions.length !== count) {
    throw new Error(`Expected ${count} questions for set ${letter}, but got ${setQuestions.length}`);
  }

  // Create questions with renumbered indices (1 to count)
  console.log(`   📝 Creating ${count} questions...`);
  for (let i = 0; i < setQuestions.length; i++) {
    const originalQuestion = setQuestions[i];
    const newQuestionNumber = i + 1; // Renumber from 1
    const questionId = `q${newQuestionNumber.toString().padStart(4, "0")}`;

    const questionItem = {
      PK: `EXAM#${id}`,
      SK: `QUESTION#${questionId}`,
      questionId,
      questionNumber: newQuestionNumber,
      questionText: originalQuestion.questionText,
      questionType: originalQuestion.questionType,
      options: originalQuestion.options,
      explanation: originalQuestion.explanation,
      points: 10, // Standard 10 points per question
      categories: originalQuestion.categories,
      difficulty: originalQuestion.difficulty,
      examId: id,
      tierAccess: setConfig.tier === "free" ? ["free", "premium", "pro"] : ["premium", "pro"],
      isPremiumQuestion: setConfig.tier !== "free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entityType: "QUESTION",
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: questionItem,
    });
    await docClient.send(command);
  }

  console.log(`   ✅ Created ${count} questions`);
  console.log(`   ℹ️  Tier: ${setConfig.tier === "free" ? "FREE (all users)" : "Premium/Pro only"}`);
}

async function main() {
  console.log("🚀 Starting Premium/Pro Exam Simulation Sets Seed Script");
  console.log(`📊 Table: ${TABLE_NAME}`);
  console.log(`📋 Creating ${EXAM_SETS.length} separate exam sets (Sets B-O)`);
  console.log("ℹ️  Set A (re5-free-exam) already exists for free tier users");
  console.log("");

  try {
    // Fetch questions from existing exam in database
    const allQuestions = await fetchSourceQuestions();

    if (allQuestions.length < 650) {
      throw new Error(`Expected at least 650 questions (for Sets B-N), but found ${allQuestions.length}`);
    }

    // Adjust Set O count based on actual questions available
    const lastSetConfig = EXAM_SETS[EXAM_SETS.length - 1];
    if (lastSetConfig) {
      const availableForLastSet = allQuestions.length - lastSetConfig.startIdx;
      if (availableForLastSet > 0 && availableForLastSet !== lastSetConfig.count) {
        console.log(`ℹ️  Adjusting Set O from ${lastSetConfig.count} to ${availableForLastSet} questions based on available data`);
        lastSetConfig.count = availableForLastSet;
      }
    }

    // Create each exam set
    for (const setConfig of EXAM_SETS) {
      await createExamSet(setConfig, allQuestions);
    }

    console.log("\n🎉 All Premium/Pro exam sets created successfully!");
    console.log("\n📊 Summary:");
    console.log("   FREE Tier (already exists):");
    console.log("   - Set A: 50 questions (/exam/re5-free-exam/start)");
    console.log("\n   PREMIUM/PRO Tier (newly created):");
    for (const set of EXAM_SETS) {
      console.log(`   - Set ${set.letter}: ${set.count} questions (/exam/${set.id}/start)`);
    }
    const totalPremiumQuestions = EXAM_SETS.reduce((sum, set) => sum + set.count, 0);
    console.log(`\n   Total: ${totalPremiumQuestions} premium questions across ${EXAM_SETS.length} exam sets`);
    console.log("   Combined with Set A: 794 total questions across 15 exam simulations");
    console.log("\n✨ Premium/Pro users can now select from 15 different exam simulations!");

  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

main();
