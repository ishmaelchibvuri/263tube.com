import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

interface Feature {
  featureId: string;
  featureName: string;
  description: string;
  type: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
}

interface TierAssignment {
  tier: string;
  featureId: string;
  isEnabled: boolean;
}

export const handler = async (event: any): Promise<any> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const requestType = event.RequestType;
  const responseData: any = {};

  try {
    if (requestType === "Create" || requestType === "Update") {
      // Check if features already exist
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
          ExpressionAttributeValues: {
            ":prefix": "FEATURE#",
            ":sk": "METADATA",
          },
          Limit: 1,
        })
      );

      if (scanResult.Items && scanResult.Items.length > 0) {
        console.log("Features already seeded, skipping...");
        responseData.message = "Features already exist, skipped seeding";
        await sendResponse(event, "SUCCESS", responseData);
        return;
      }

      const createdBy = "system";
      const now = new Date().toISOString();

      // Define initial features for Quick Budget
      const initialFeatures: Feature[] = [
        {
          featureId: "budget_tracking",
          featureName: "Budget Tracking",
          description: "Track your monthly income and expenses",
          type: "functionality",
          category: "budget",
          displayOrder: 1,
          isActive: true,
          createdBy,
        },
        {
          featureId: "expense_categories",
          featureName: "Expense Categories",
          description: "Organize expenses by category",
          type: "functionality",
          category: "budget",
          displayOrder: 2,
          isActive: true,
          createdBy,
        },
        {
          featureId: "budget_history",
          featureName: "Budget History",
          description: "View historical budget data",
          type: "functionality",
          category: "analytics",
          displayOrder: 3,
          isActive: true,
          createdBy,
        },
        {
          featureId: "custom_categories",
          featureName: "Custom Categories",
          description: "Create custom expense categories",
          type: "functionality",
          category: "budget",
          displayOrder: 4,
          isActive: true,
          createdBy,
        },
        {
          featureId: "spending_insights",
          featureName: "Spending Insights",
          description: "Get insights on spending patterns",
          type: "functionality",
          category: "analytics",
          displayOrder: 5,
          isActive: true,
          createdBy,
        },
        {
          featureId: "budget_alerts",
          featureName: "Budget Alerts",
          description: "Get alerts when approaching budget limits",
          type: "functionality",
          category: "notifications",
          displayOrder: 6,
          isActive: true,
          createdBy,
        },
        {
          featureId: "export_data",
          featureName: "Export Data",
          description: "Export budget data to CSV/PDF",
          type: "functionality",
          category: "export",
          displayOrder: 7,
          isActive: true,
          createdBy,
        },
        {
          featureId: "multi_currency",
          featureName: "Multi-Currency Support",
          description: "Support for multiple currencies",
          type: "functionality",
          category: "budget",
          displayOrder: 8,
          isActive: true,
          createdBy,
        },
      ];

      // Create features
      for (const feature of initialFeatures) {
        const displayOrder = String(feature.displayOrder).padStart(5, "0");

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `FEATURE#${feature.featureId}`,
              SK: "METADATA",
              GSI1PK: `FEATURE#CATEGORY#${feature.category}`,
              GSI1SK: `${displayOrder}#${feature.featureId}`,
              ...feature,
              createdAt: now,
              updatedAt: now,
              entityType: "FEATURE",
            },
          })
        );
        console.log(`Created feature: ${feature.featureId}`);
      }

      // Define tier assignments
      const tierAssignments: TierAssignment[] = [
        // Premium tier
        { tier: "premium", featureId: "budget_tracking", isEnabled: true },
        { tier: "premium", featureId: "expense_categories", isEnabled: true },
        { tier: "premium", featureId: "budget_history", isEnabled: true },
        { tier: "premium", featureId: "custom_categories", isEnabled: true },
        { tier: "premium", featureId: "spending_insights", isEnabled: false },
        { tier: "premium", featureId: "budget_alerts", isEnabled: false },
        { tier: "premium", featureId: "export_data", isEnabled: false },
        { tier: "premium", featureId: "multi_currency", isEnabled: false },

        // Pro tier - all features
        { tier: "pro", featureId: "budget_tracking", isEnabled: true },
        { tier: "pro", featureId: "expense_categories", isEnabled: true },
        { tier: "pro", featureId: "budget_history", isEnabled: true },
        { tier: "pro", featureId: "custom_categories", isEnabled: true },
        { tier: "pro", featureId: "spending_insights", isEnabled: true },
        { tier: "pro", featureId: "budget_alerts", isEnabled: true },
        { tier: "pro", featureId: "export_data", isEnabled: true },
        { tier: "pro", featureId: "multi_currency", isEnabled: true },

        // Free tier - basic features
        { tier: "free", featureId: "budget_tracking", isEnabled: true },
        { tier: "free", featureId: "expense_categories", isEnabled: true },
        { tier: "free", featureId: "budget_history", isEnabled: false },
        { tier: "free", featureId: "custom_categories", isEnabled: false },
      ];

      // Create tier assignments
      for (const assignment of tierAssignments) {
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `TIER#${assignment.tier}`,
              SK: `FEATURE#${assignment.featureId}`,
              GSI1PK: `FEATURE#${assignment.featureId}`,
              GSI1SK: `TIER#${assignment.tier}`,
              tier: assignment.tier,
              featureId: assignment.featureId,
              isEnabled: assignment.isEnabled,
              assignedAt: now,
              assignedBy: createdBy,
              entityType: "TIER_FEATURE",
            },
          })
        );
        console.log(
          `Assigned feature ${assignment.featureId} to tier ${assignment.tier}: ${assignment.isEnabled}`
        );
      }

      responseData.message = `Successfully seeded ${initialFeatures.length} features and ${tierAssignments.length} tier assignments`;
      responseData.featuresCount = initialFeatures.length;
      responseData.assignmentsCount = tierAssignments.length;
    }

    await sendResponse(event, "SUCCESS", responseData);
  } catch (error) {
    console.error("Error:", error);
    await sendResponse(event, "FAILED", { error: String(error) });
  }
};

async function sendResponse(
  event: any,
  responseStatus: string,
  responseData: any
): Promise<void> {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: responseData.error || "See the details in CloudWatch Log Stream",
    PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  console.log("Response body:", responseBody);

  const https = await import("https");
  const url = new URL(event.ResponseURL);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: "PUT",
    headers: {
      "Content-Type": "",
      "Content-Length": responseBody.length,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      console.log(`Status code: ${response.statusCode}`);
      resolve();
    });

    request.on("error", (error) => {
      console.error("Error sending response:", error);
      reject(error);
    });

    request.write(responseBody);
    request.end();
  });
}
