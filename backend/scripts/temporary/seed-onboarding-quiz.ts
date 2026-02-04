import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Get table name from environment or default to dev
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith("--env="));
const envName = envArg ? envArg.split("=")[1] : "dev";
const TABLE_NAME = process.env.TABLE_NAME || `exam-platform-data-${envName}`;

async function seedOnboardingQuiz() {
  console.log(`🌱 Seeding ONBOARDING_QUIZ exam to ${TABLE_NAME}...`);

  const now = new Date().toISOString();

  // Create exam metadata
  const examMetadata = {
    PK: "EXAM#ONBOARDING_QUIZ",
    SK: "METADATA",
    GSI1PK: "EXAM#ACTIVE",
    GSI1SK: `ONBOARDING#${now}`,
    GSI3PK: "EXAM#CATEGORY#ONBOARDING",
    GSI3SK: `beginner#ONBOARDING_QUIZ`,
    examId: "ONBOARDING_QUIZ",
    title: "Welcome Quiz",
    description: "Initial knowledge assessment quiz from the landing page",
    category: "Onboarding",
    difficulty: "beginner",
    totalQuestions: 10, // Landing page quiz typically has 10 questions
    totalTime: 0, // Not timed
    duration: 0,
    passingScore: 60,
    pointsPerQuestion: 10,
    isActive: true,
    allowedTiers: ["free", "premium", "pro"], // Available to all users
    isPremiumExam: false,
    isFreeExam: true,
    createdBy: "system",
    createdAt: now,
    updatedAt: now,
    entityType: "EXAM",
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: examMetadata,
      })
    );

    console.log("✅ ONBOARDING_QUIZ exam metadata created successfully");
    console.log("📋 Exam details:");
    console.log(`   - Exam ID: ${examMetadata.examId}`);
    console.log(`   - Title: ${examMetadata.title}`);
    console.log(`   - Description: ${examMetadata.description}`);
    console.log(`   - Total Questions: ${examMetadata.totalQuestions}`);
    console.log(`   - Allowed Tiers: ${examMetadata.allowedTiers.join(", ")}`);
    console.log("\n✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding ONBOARDING_QUIZ:", error);
    throw error;
  }
}

// Run the seed script
seedOnboardingQuiz()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
