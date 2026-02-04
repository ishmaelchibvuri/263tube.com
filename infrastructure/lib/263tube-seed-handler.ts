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

// Initial seed data
const SEED_CREATORS: Creator[] = [
  {
    slug: "the-newbys",
    name: "The Newbys",
    bio: "A Zimbabwean family documenting their homesteading journey in rural Zimbabwe. From building their dream home to growing their own food, sharing the realities of returning to the land.",
    niche: "Homesteading",
    location: "Chegutu, Zimbabwe",
    status: "FEATURED",
    verified: true,
    platforms: {
      youtube: [{ label: "Main Channel", url: "https://youtube.com/@TheNewbys", handle: "TheNewbys" }],
      instagram: [{ label: "Instagram", url: "https://instagram.com/thenewbys_zim", handle: "thenewbys_zim" }],
    },
    metrics: { totalReach: 150000, monthlyViews: 45000, engagement: 12.5, totalVideos: 120 },
    referralStats: { currentWeek: 45, allTime: 1250 },
    joinedDate: "2020",
  },
  {
    slug: "madam-boss",
    name: "Madam Boss",
    bio: "Award-winning Zimbabwean comedian known for unique humor celebrating everyday Zimbabwean life.",
    niche: "Comedy",
    location: "Harare, Zimbabwe",
    status: "FEATURED",
    verified: true,
    platforms: {
      youtube: [{ label: "Main Channel", url: "https://youtube.com/@MadamBossComedy", handle: "MadamBossComedy" }],
      instagram: [{ label: "Instagram", url: "https://instagram.com/maaboranana", handle: "maaboranana" }],
    },
    metrics: { totalReach: 4500000, monthlyViews: 2100000, engagement: 8.5, totalVideos: 450 },
    referralStats: { currentWeek: 120, allTime: 5600 },
    joinedDate: "2018",
  },
  {
    slug: "munya-and-tupi",
    name: "Munya & Tupi",
    bio: "Teaching Zimbabwe how to farm! Practical farming tips, livestock management, and agricultural knowledge.",
    niche: "Farming",
    location: "Chinhoyi, Zimbabwe",
    status: "ACTIVE",
    verified: true,
    platforms: {
      youtube: [{ label: "Main Channel", url: "https://youtube.com/@MunyaAndTupi", handle: "MunyaAndTupi" }],
    },
    metrics: { totalReach: 950000, monthlyViews: 380000, engagement: 15.2, totalVideos: 280 },
    referralStats: { currentWeek: 85, allTime: 3200 },
    joinedDate: "2019",
  },
];

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
