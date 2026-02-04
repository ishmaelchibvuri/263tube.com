/**
 * Check ANSWER records for missing or placeholder explanations
 *
 * This checks the answers saved when users submit exams, not the master questions.
 * Run with: TABLE_NAME=exam-platform-data-prod node dist/scripts/check-answer-explanations.js
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";

const client = new DynamoDBClient({ region: "af-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "exam-platform-data-dev";

interface AnswerItem {
  PK: string;
  SK: string;
  questionNumber: number;
  questionText?: string;
  explanation?: string;
  isCorrect?: boolean;
}

async function checkAnswerExplanations() {
  console.log("=== Checking ANSWER Records for Missing Explanations ===");
  console.log(`Table: ${TABLE_NAME}\n`);

  try {
    let hasMore = true;
    let lastEvaluatedKey: any = undefined;

    const answersWithIssues: AnswerItem[] = [];
    const answersOk: AnswerItem[] = [];
    let totalAnswers = 0;

    // Scan for ANSWER records
    while (hasMore) {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":sk": "ANSWER#",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await docClient.send(command);
      const items = (response.Items || []) as AnswerItem[];

      for (const item of items) {
        totalAnswers++;

        const explanation = item.explanation?.trim() || "";

        // Check for missing or placeholder explanations
        if (
          !explanation ||
          explanation === "" ||
          explanation.toLowerCase().includes("[explanation to be added") ||
          explanation.toLowerCase() === "explanation to be added" ||
          explanation === "[Explanation to be added.]" ||
          explanation === "[Explanation]"
        ) {
          answersWithIssues.push(item);
        } else {
          answersOk.push(item);
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
      hasMore = !!lastEvaluatedKey;

      if (totalAnswers % 100 === 0) {
        console.log(`Scanned ${totalAnswers} answers so far...`);
      }
    }

    // Print summary
    console.log("\n=== SUMMARY ===");
    console.log(`Total Answers Scanned: ${totalAnswers}`);
    console.log(`Answers with Valid Explanations: ${answersOk.length} (${((answersOk.length / totalAnswers) * 100).toFixed(1)}%)`);
    console.log(`Answers with Missing/Placeholder Explanations: ${answersWithIssues.length} (${((answersWithIssues.length / totalAnswers) * 100).toFixed(1)}%)`);

    if (answersWithIssues.length > 0) {
      console.log("\n=== ANSWERS WITH ISSUES ===");
      console.log("First 20 answers with missing/placeholder explanations:\n");

      // Group by attempt ID to show unique attempts
      const attemptCounts = new Map<string, number>();
      answersWithIssues.forEach(a => {
        const attemptId = a.PK.replace('ATTEMPT#', '');
        attemptCounts.set(attemptId, (attemptCounts.get(attemptId) || 0) + 1);
      });

      console.log(`Affected Attempts: ${attemptCounts.size} unique exam attempts`);
      console.log(`\nSample answers:\n`);

      answersWithIssues.slice(0, 20).forEach((a, index) => {
        const attemptId = a.PK.replace('ATTEMPT#', '');
        console.log(`${index + 1}. Attempt: ${attemptId}`);
        console.log(`   Question #${a.questionNumber}`);
        console.log(`   Question: ${a.questionText?.substring(0, 60)}...`);
        console.log(`   Explanation: "${a.explanation || '(empty)'}"`);
        console.log(`   Correct: ${a.isCorrect}`);
        console.log("");
      });

      if (answersWithIssues.length > 20) {
        console.log(`... and ${answersWithIssues.length - 20} more answers with issues.\n`);
      }

      // Save detailed report
      const reportPath = path.join(__dirname, `answer-explanations-report-${TABLE_NAME}.json`);
      fs.writeFileSync(
        reportPath,
        JSON.stringify({
          summary: {
            totalAnswers,
            answersOk: answersOk.length,
            answersWithIssues: answersWithIssues.length,
            affectedAttempts: attemptCounts.size,
            timestamp: new Date().toISOString(),
          },
          attemptCounts: Array.from(attemptCounts.entries()).map(([attemptId, count]) => ({
            attemptId,
            questionsWithIssues: count,
          })),
          answersWithIssues: answersWithIssues.slice(0, 100).map(a => ({
            PK: a.PK,
            SK: a.SK,
            questionNumber: a.questionNumber,
            questionText: a.questionText,
            explanation: a.explanation,
            isCorrect: a.isCorrect,
          })),
        }, null, 2)
      );
      console.log(`\nDetailed report saved to: ${reportPath}`);
    } else {
      console.log("\n✓ All answer records have valid explanations!");
    }

  } catch (error) {
    console.error("Error checking answer explanations:", error);
    throw error;
  }
}

checkAnswerExplanations()
  .then(() => {
    console.log("\n✓ Check completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Check failed:", error);
    process.exit(1);
  });
