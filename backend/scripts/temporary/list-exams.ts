/**
 * List all exams and their question counts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

async function listExams() {
  console.log("=== Listing All Exams ===");
  console.log(`Table: ${TABLE_NAME}\n`);

  try {
    let hasMore = true;
    let lastEvaluatedKey: any = undefined;
    const examQuestions = new Map<string, any[]>();
    const examMetadata = new Map<string, any>();

    while (hasMore) {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      });

      const response = await docClient.send(command);
      const items = response.Items || [];

      for (const item of items) {
        const pk = String(item.PK || '');
        const sk = String(item.SK || '');

        // Check for exam metadata
        if (pk.startsWith('EXAM#') && sk === 'METADATA') {
          examMetadata.set(pk, item);
        }

        // Check for exam questions
        if (pk.startsWith('EXAM#') && sk.startsWith('QUESTION#')) {
          if (!examQuestions.has(pk)) {
            examQuestions.set(pk, []);
          }
          examQuestions.get(pk)!.push(item);
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;
    }

    console.log(`Found ${examMetadata.size} exams with metadata\n`);

    // List all exams
    for (const [examPK, metadata] of examMetadata.entries()) {
      const examId = examPK.replace('EXAM#', '');
      const questionCount = examQuestions.get(examPK)?.length || 0;

      console.log(`Exam: ${examId}`);
      console.log(`  Title: ${metadata.title || 'N/A'}`);
      console.log(`  Category: ${metadata.category || 'N/A'}`);
      console.log(`  Tier: ${metadata.tier || 'N/A'}`);
      console.log(`  Questions: ${questionCount}`);
      console.log(`  Active: ${metadata.isActive}`);
      console.log(`  Premium Only: ${metadata.premiumOnly || false}`);
      console.log(``);
    }

    // List exams with questions but no metadata
    for (const [examPK, questions] of examQuestions.entries()) {
      if (!examMetadata.has(examPK)) {
        const examId = examPK.replace('EXAM#', '');
        console.log(`⚠️  Exam with questions but NO metadata: ${examId}`);
        console.log(`  Questions: ${questions.length}`);
        console.log(``);
      }
    }

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

listExams()
  .then(() => {
    console.log("\n✓ Complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Failed:", error);
    process.exit(1);
  });
