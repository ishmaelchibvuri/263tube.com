/**
 * 263Tube CDK Seed Handler
 *
 * Custom resource handler that seeds the DynamoDB table with initial creator data
 * when the stack is deployed.
 */

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = process.env.TABLE_NAME!;

interface Creator {
  slug: string;
  name: string;
  bio: string;
  niche: string;
  location?: string;
  status: "ACTIVE" | "FEATURED";
  verified: boolean;
  platforms: Record<string, { label: string; url: string; handle?: string }[]>;
  metrics: {
    totalReach: number;
    monthlyViews?: number;
    engagement?: number;
    totalVideos?: number;
  };
  referralStats: {
    currentWeek: number;
    allTime: number;
  };
  joinedDate?: string;
}

// Seed creators are now managed via the discovery script
// (seed-youtube-creators-with-niches.mjs) using real YouTube data.
const SEED_CREATORS: Creator[] = [];

async function seedCreator(creator: Creator): Promise<void> {
  const now = new Date().toISOString();
  const reachSortKey = `${String(creator.metrics.totalReach).padStart(12, "0")}#${creator.slug}`;
  const referralSortKey = `${String(creator.referralStats.currentWeek).padStart(9, "0")}#${creator.slug}`;

  const item = {
    pk: `CREATOR#${creator.slug}`,
    sk: "METADATA",
    gsi1pk: `STATUS#${creator.status}`,
    gsi1sk: reachSortKey,
    gsi2pk: `CATEGORY#${creator.niche.toLowerCase()}`,
    gsi2sk: reachSortKey,
    gsi3pk: "REFERRAL#WEEKLY",
    gsi3sk: referralSortKey,
    entityType: "CREATOR",
    ...creator,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  console.log(`Seeded: ${creator.name}`);
}

export async function handler(event: any): Promise<any> {
  console.log("Event:", JSON.stringify(event, null, 2));

  const requestType = event.RequestType;

  if (requestType === "Delete") {
    console.log("Delete request - nothing to do");
    return { PhysicalResourceId: event.PhysicalResourceId || "seed-creators" };
  }

  // Create or Update
  console.log(`Seeding ${SEED_CREATORS.length} creators to ${TABLE_NAME}...`);

  for (const creator of SEED_CREATORS) {
    try {
      await seedCreator(creator);
    } catch (error) {
      console.error(`Failed to seed ${creator.name}:`, error);
    }
  }

  console.log("Seeding complete!");

  return {
    PhysicalResourceId: "seed-creators",
    Data: {
      CreatorsSeeded: SEED_CREATORS.length,
      TableName: TABLE_NAME,
    },
  };
}
