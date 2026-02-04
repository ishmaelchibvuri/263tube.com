/**
 * Check for questions with missing or placeholder explanations in DynamoDB
 *
 * This script scans the QUESTIONBANK table and identifies questions that have:
 * - Empty explanations
 * - "[Explanation to be added.]" placeholder text
 * - Missing explanation fields
 *
 * Run with:
 *   TABLE_NAME=exam-platform-data-dev node dist/scripts/check-missing-explanations.js
 *   TABLE_NAME=exam-platform-data-qa node dist/scripts/check-missing-explanations.js
 *   TABLE_NAME=exam-platform-data-prod node dist/scripts/check-missing-explanations.js
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";

const client = new DynamoDBClient({
  region: "af-south-1",
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

interface QuestionItem {
  PK: string;
  SK: string;
  questionId: string;
  questionNumber?: number;
  questionText: string;
  explanation?: string;
  taskCategory?: string;
  qcId?: string;
  Topic?: string;
}

async function checkMissingExplanations() {
  console.log("=== Checking for Missing Explanations ===");
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION || "af-south-1"}\n`);

  try {
    let hasMore = true;
    let lastEvaluatedKey: any = undefined;

    const questionsWithIssues: QuestionItem[] = [];
    const questionsOk: QuestionItem[] = [];
    let totalQuestions = 0;

    // Scan for questions (SK starts with QUESTION#)
    while (hasMore) {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":sk": "QUESTION#",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await docClient.send(command);
      const items = (response.Items || []) as QuestionItem[];

      for (const item of items) {
        totalQuestions++;

        const explanation = item.explanation?.trim() || "";

        // Check for missing or placeholder explanations
        if (
          !explanation ||
          explanation === "" ||
          explanation.toLowerCase().includes("[explanation to be added") ||
          explanation.toLowerCase() === "explanation to be added" ||
          explanation === "[Explanation to be added.]"
        ) {
          questionsWithIssues.push(item);
        } else {
          questionsOk.push(item);
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;

      if (hasMore) {
        console.log(`Scanned ${totalQuestions} questions so far...`);
      }
    }

    // Print summary
    console.log("\n=== SUMMARY ===");
    console.log(`Total Questions Scanned: ${totalQuestions}`);
    console.log(`Questions with Valid Explanations: ${questionsOk.length} (${((questionsOk.length / totalQuestions) * 100).toFixed(1)}%)`);
    console.log(`Questions with Missing/Placeholder Explanations: ${questionsWithIssues.length} (${((questionsWithIssues.length / totalQuestions) * 100).toFixed(1)}%)`);

    if (questionsWithIssues.length > 0) {
      console.log("\n=== QUESTIONS WITH ISSUES ===");
      console.log("First 20 questions with missing/placeholder explanations:\n");

      questionsWithIssues.slice(0, 20).forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q.questionId}`);
        console.log(`   PK: ${q.PK}`);
        console.log(`   Question: ${q.questionText?.substring(0, 80)}...`);
        console.log(`   Explanation: "${q.explanation || '(empty)'}"`);
        console.log(`   Task Category: ${q.taskCategory || 'N/A'}`);
        console.log(`   QC ID: ${q.qcId || 'N/A'}`);
        console.log(`   Topic: ${q.Topic || 'N/A'}`);
        console.log("");
      });

      if (questionsWithIssues.length > 20) {
        console.log(`... and ${questionsWithIssues.length - 20} more questions with issues.\n`);
      }

      // Save detailed report to file
      const reportPath = path.join(__dirname, `missing-explanations-report-${TABLE_NAME}.json`);
      fs.writeFileSync(
        reportPath,
        JSON.stringify({
          summary: {
            totalQuestions,
            questionsOk: questionsOk.length,
            questionsWithIssues: questionsWithIssues.length,
            timestamp: new Date().toISOString(),
          },
          questionsWithIssues: questionsWithIssues.map(q => ({
            questionId: q.questionId,
            PK: q.PK,
            SK: q.SK,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            explanation: q.explanation,
            taskCategory: q.taskCategory,
            qcId: q.qcId,
            Topic: q.Topic,
          })),
        }, null, 2)
      );
      console.log(`\nDetailed report saved to: ${reportPath}`);
    } else {
      console.log("\n✓ All questions have valid explanations!");
    }

    // Sample a few questions with good explanations
    if (questionsOk.length > 0) {
      console.log("\n=== SAMPLE QUESTIONS WITH VALID EXPLANATIONS ===");
      console.log("First 3 questions with valid explanations:\n");

      questionsOk.slice(0, 3).forEach((q, index) => {
        console.log(`${index + 1}. Question ID: ${q.questionId}`);
        console.log(`   Question: ${q.questionText?.substring(0, 80)}...`);
        console.log(`   Explanation: ${q.explanation?.substring(0, 100)}...`);
        console.log("");
      });
    }

  } catch (error) {
    console.error("Error checking explanations:", error);
    throw error;
  }
}

// Run the script
checkMissingExplanations()
  .then(() => {
    console.log("\n✓ Check completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Check failed:", error);
    process.exit(1);
  });
