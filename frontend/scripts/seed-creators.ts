/**
 * 263Tube - Database Seed Script
 *
 * Populates the DynamoDB table with initial creator data
 *
 * Usage:
 *   npx ts-node scripts/seed-creators.ts
 *
 * Environment:
 *   Loads from .env.local for local development
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Also try .env if .env.local doesn't exist
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

// ============================================================================
// Configuration
// ============================================================================

const AWS_REGION = process.env.AWS_REGION || "af-south-1";
const ENVIRONMENT = process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || `263tube-${ENVIRONMENT}`;

console.log("\n========================================");
console.log("263Tube Database Seeder");
console.log("========================================");
console.log(`Environment: ${ENVIRONMENT}`);
console.log(`Region: ${AWS_REGION}`);
console.log(`Table: ${TABLE_NAME}`);
console.log("========================================\n");

// Create DynamoDB client
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

// ============================================================================
// Seed Data
// ============================================================================

interface Creator {
  slug: string;
  name: string;
  bio: string;
  profilePicUrl?: string;
  bannerUrl?: string;
  coverImageUrl?: string;
  niche: string;
  tags?: string[];
  location?: string;
  status: "ACTIVE" | "PENDING" | "FEATURED" | "INACTIVE";
  verified: boolean;
  platforms: Record<string, { label: string; url: string; handle?: string }[]>;
  metrics: {
    totalReach: number;
    monthlyViews?: number;
    engagement?: number;
    totalVideos?: number;
    subscribers?: Record<string, number>;
  };
  // Referral stats for gamification - initialized to 0
  referralStats?: {
    currentWeek: number;
    allTime: number;
  };
  topVideo?: {
    title: string;
    thumbnail?: string;
    views: number;
    embedUrl: string;
  };
  joinedDate?: string;
  contactEmail?: string;
}

const SEED_CREATORS: Creator[] = [
  // The Newbys - As specified in the requirements
  {
    slug: "the-newbys",
    name: "The Newbys",
    bio: "We are The Newbys - a Zimbabwean family documenting our homesteading journey in rural Zimbabwe. From building our dream home to growing our own food, we share the realities of returning to the land. Our channel is all about sustainable living, family values, and the beautiful Zim countryside.",
    niche: "Homesteading",
    tags: ["farming", "family", "sustainable-living", "rural", "lifestyle"],
    location: "Chegutu, Zimbabwe",
    status: "FEATURED",
    verified: true,
    platforms: {
      youtube: [
        {
          label: "Main Channel",
          url: "https://youtube.com/@TheNewbys",
          handle: "TheNewbys",
        },
      ],
      instagram: [
        {
          label: "Instagram",
          url: "https://instagram.com/thenewbys_zim",
          handle: "thenewbys_zim",
        },
      ],
      facebook: [
        {
          label: "Facebook Page",
          url: "https://facebook.com/TheNewbysZim",
        },
      ],
    },
    metrics: {
      totalReach: 150000,
      monthlyViews: 45000,
      engagement: 12.5,
      totalVideos: 120,
      subscribers: {
        youtube: 85000,
        instagram: 35000,
        facebook: 30000,
      },
    },
    topVideo: {
      title: "Building Our Dream Homestead in Zimbabwe",
      views: 250000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2020",
  },

  // Madam Boss - Top comedian
  {
    slug: "madam-boss",
    name: "Madam Boss",
    bio: "Award-winning Zimbabwean comedian and content creator known for my unique brand of humor that celebrates everyday Zimbabwean life. From market vendors to corporate meetings, I bring the laughs that hit home. My content reaches millions across Africa and the diaspora.",
    niche: "Comedy",
    tags: ["comedy", "skits", "entertainment", "viral"],
    location: "Harare, Zimbabwe",
    status: "FEATURED",
    verified: true,
    platforms: {
      youtube: [
        {
          label: "Main Channel",
          url: "https://youtube.com/@MadamBossComedy",
          handle: "MadamBossComedy",
        },
      ],
      instagram: [
        {
          label: "Official Page",
          url: "https://instagram.com/maaboranana",
          handle: "maaboranana",
        },
      ],
      tiktok: [
        {
          label: "TikTok",
          url: "https://tiktok.com/@madamboss",
          handle: "madamboss",
        },
      ],
      facebook: [
        {
          label: "Facebook",
          url: "https://facebook.com/MadamBoss",
        },
      ],
    },
    metrics: {
      totalReach: 4500000,
      monthlyViews: 2100000,
      engagement: 8.5,
      totalVideos: 450,
      subscribers: {
        youtube: 1200000,
        instagram: 1500000,
        tiktok: 800000,
        facebook: 1000000,
      },
    },
    topVideo: {
      title: "When Your Mother Visits From the Village",
      views: 2500000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2018",
  },

  // Munya & Tupi - Farming content
  {
    slug: "munya-and-tupi",
    name: "Munya & Tupi",
    bio: "Teaching Zimbabwe how to farm! We share practical farming tips, livestock management, and agricultural knowledge that helps both small-scale and commercial farmers succeed. Our mission is to make farming accessible and profitable for everyone.",
    niche: "Farming",
    tags: ["agriculture", "farming", "livestock", "education", "rural"],
    location: "Chinhoyi, Zimbabwe",
    status: "ACTIVE",
    verified: true,
    platforms: {
      youtube: [
        {
          label: "Main Channel",
          url: "https://youtube.com/@MunyaAndTupi",
          handle: "MunyaAndTupi",
        },
        {
          label: "Farming Tips",
          url: "https://youtube.com/@MunyaTupiFarmingTips",
          handle: "MunyaTupiFarmingTips",
        },
      ],
      facebook: [
        {
          label: "Facebook Page",
          url: "https://facebook.com/MunyaAndTupi",
        },
      ],
    },
    metrics: {
      totalReach: 950000,
      monthlyViews: 380000,
      engagement: 15.2,
      totalVideos: 280,
      subscribers: {
        youtube: 650000,
        facebook: 300000,
      },
    },
    topVideo: {
      title: "Complete Guide to Chicken Farming in Zimbabwe",
      views: 1200000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2019",
  },

  // TechZim - Technology news
  {
    slug: "techzim",
    name: "TechZim",
    bio: "Zimbabwe's leading technology news and reviews platform. We cover everything tech in Zimbabwe and Africa - from startups to smartphones, fintech to fiber. Stay informed about the digital transformation of our continent.",
    niche: "Technology",
    tags: ["tech", "news", "startups", "reviews", "africa"],
    location: "Harare, Zimbabwe",
    status: "ACTIVE",
    verified: true,
    platforms: {
      youtube: [
        {
          label: "TechZim TV",
          url: "https://youtube.com/@TechZimTV",
          handle: "TechZimTV",
        },
      ],
      twitter: [
        {
          label: "Twitter",
          url: "https://twitter.com/techaboranana",
          handle: "techaboranana",
        },
      ],
      website: [
        {
          label: "TechZim.co.zw",
          url: "https://www.techzim.co.zw",
        },
      ],
    },
    metrics: {
      totalReach: 520000,
      monthlyViews: 180000,
      engagement: 6.8,
      totalVideos: 450,
      subscribers: {
        youtube: 120000,
        twitter: 400000,
      },
    },
    topVideo: {
      title: "EcoCash vs InnBucks - Which is Better?",
      views: 450000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2011",
  },

  // Zimbo Kitchen - Cooking
  {
    slug: "zimbo-kitchen",
    name: "Zimbo Kitchen",
    bio: "Celebrating Zimbabwean cuisine one recipe at a time! From traditional sadza ne nyama to modern fusion dishes, I share authentic Zim recipes with easy-to-follow instructions. Join me in preserving and sharing our culinary heritage.",
    niche: "Cooking",
    tags: ["cooking", "food", "recipes", "traditional", "zimbabwean-cuisine"],
    location: "Bulawayo, Zimbabwe",
    status: "ACTIVE",
    verified: false,
    platforms: {
      youtube: [
        {
          label: "Zimbo Kitchen",
          url: "https://youtube.com/@ZimboKitchen",
          handle: "ZimboKitchen",
        },
      ],
      instagram: [
        {
          label: "Instagram",
          url: "https://instagram.com/zimbokitchen",
          handle: "zimbokitchen",
        },
      ],
      tiktok: [
        {
          label: "TikTok",
          url: "https://tiktok.com/@zimbokitchen",
          handle: "zimbokitchen",
        },
      ],
    },
    metrics: {
      totalReach: 780000,
      monthlyViews: 220000,
      engagement: 11.3,
      totalVideos: 180,
      subscribers: {
        youtube: 350000,
        instagram: 280000,
        tiktok: 150000,
      },
    },
    topVideo: {
      title: "Perfect Sadza - The Ultimate Guide",
      views: 680000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2020",
  },

  // Shadaya Knight - Commentary
  {
    slug: "shadaya-knight",
    name: "Shadaya Knight",
    bio: "Controversial social commentator and thought leader. I speak on relationships, society, and African masculinity. Love me or hate me, you can't ignore the conversation.",
    niche: "Commentary",
    tags: ["commentary", "relationships", "society", "podcast", "opinions"],
    location: "Harare, Zimbabwe",
    status: "ACTIVE",
    verified: true,
    platforms: {
      twitter: [
        {
          label: "Twitter",
          url: "https://twitter.com/ShadayaKnight",
          handle: "ShadayaKnight",
        },
      ],
      youtube: [
        {
          label: "YouTube",
          url: "https://youtube.com/@ShadayaKnight",
          handle: "ShadayaKnight",
        },
      ],
      instagram: [
        {
          label: "Instagram",
          url: "https://instagram.com/shadayaknight",
          handle: "shadayaknight",
        },
      ],
    },
    metrics: {
      totalReach: 1800000,
      monthlyViews: 650000,
      engagement: 18.5,
      totalVideos: 200,
      subscribers: {
        twitter: 800000,
        youtube: 450000,
        instagram: 550000,
      },
    },
    topVideo: {
      title: "The Truth About Modern Relationships",
      views: 890000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2019",
  },

  // Mai Titi - Entertainment
  {
    slug: "mai-titi",
    name: "Mai Titi",
    bio: "Entertainer, businesswoman, and social media personality. I keep Zimbabwe laughing and talking! From comedy skits to real talk about life, I share it all with my amazing fans.",
    niche: "Entertainment",
    tags: ["entertainment", "comedy", "lifestyle", "celebrity"],
    location: "Harare, Zimbabwe",
    status: "ACTIVE",
    verified: true,
    platforms: {
      instagram: [
        {
          label: "Main Page",
          url: "https://instagram.com/maaboranana",
          handle: "maaboranana",
        },
      ],
      facebook: [
        {
          label: "Facebook",
          url: "https://facebook.com/MaiTiti",
        },
      ],
      tiktok: [
        {
          label: "TikTok",
          url: "https://tiktok.com/@maiti",
          handle: "maiti",
        },
      ],
    },
    metrics: {
      totalReach: 3200000,
      monthlyViews: 1400000,
      engagement: 9.2,
      totalVideos: 380,
      subscribers: {
        instagram: 1500000,
        facebook: 1200000,
        tiktok: 500000,
      },
    },
    topVideo: {
      title: "A Day in My Life",
      views: 1800000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2017",
  },

  // Zim Diaspora Life - Lifestyle
  {
    slug: "zim-diaspora-life",
    name: "Zim Diaspora Life",
    bio: "Documenting the Zimbabwean diaspora experience. From navigating life abroad to staying connected to home, I share stories that resonate with Zimbos worldwide. We are everywhere, and our stories matter.",
    niche: "Lifestyle",
    tags: ["diaspora", "lifestyle", "travel", "culture", "immigration"],
    location: "London, UK (Originally Harare)",
    status: "ACTIVE",
    verified: false,
    platforms: {
      youtube: [
        {
          label: "Main Channel",
          url: "https://youtube.com/@ZimDiasporaLife",
          handle: "ZimDiasporaLife",
        },
      ],
      instagram: [
        {
          label: "Instagram",
          url: "https://instagram.com/zimdiasporalife",
          handle: "zimdiasporalife",
        },
      ],
      tiktok: [
        {
          label: "TikTok",
          url: "https://tiktok.com/@zimdiasporalife",
          handle: "zimdiasporalife",
        },
      ],
    },
    metrics: {
      totalReach: 340000,
      monthlyViews: 95000,
      engagement: 14.1,
      totalVideos: 150,
      subscribers: {
        youtube: 180000,
        instagram: 100000,
        tiktok: 60000,
      },
    },
    topVideo: {
      title: "What They Don't Tell You About Moving to the UK",
      views: 420000,
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    joinedDate: "2021",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function tableExists(): Promise<boolean> {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({ TableName: TABLE_NAME })
    );
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    throw error;
  }
}

async function createTable(): Promise<void> {
  console.log(`Creating table: ${TABLE_NAME}...`);

  const command = new CreateTableCommand({
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "GSI2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });

  await dynamoClient.send(command);
  console.log(`Table ${TABLE_NAME} created successfully!`);

  // Wait for table to be active
  console.log("Waiting for table to become active...");
  let tableActive = false;
  while (!tableActive) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const describe = await dynamoClient.send(
      new DescribeTableCommand({ TableName: TABLE_NAME })
    );
    tableActive = describe.Table?.TableStatus === "ACTIVE";
  }
  console.log("Table is now active!");
}

async function seedCreator(creator: Creator): Promise<void> {
  const now = new Date().toISOString();
  const reachSortKey = `${String(creator.metrics.totalReach).padStart(12, "0")}#${creator.slug}`;

  // Initialize referralStats to 0 if not provided
  const referralStats = creator.referralStats || { currentWeek: 0, allTime: 0 };

  // GSI_REFERRALS sort key: inverted count for descending sort
  // 999999999 - currentWeek gives us descending order with ScanIndexForward=true
  const invertedRefCount = 999999999 - referralStats.currentWeek;
  const referralSortKey = `${String(invertedRefCount).padStart(9, "0")}#${creator.slug}`;

  const item = {
    pk: `CREATOR#${creator.slug}`,
    sk: "METADATA",
    // GSI1: Status-based queries (active/featured creators)
    gsi1pk: `STATUS#${creator.status}`,
    gsi1sk: reachSortKey,
    // GSI2: Category-based queries (niche filtering)
    gsi2pk: `CATEGORY#${creator.niche.toLowerCase()}`,
    gsi2sk: reachSortKey,
    // GSI_REFERRALS (GSI3): Weekly referral leaderboard
    gsi3pk: "REFERRAL#WEEKLY",
    gsi3sk: referralSortKey,
    entityType: "CREATOR",
    ...creator,
    // Ensure referralStats is always initialized
    referralStats,
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  await docClient.send(command);
  console.log(`  ✓ Seeded: ${creator.name} (${creator.niche}) - Referrals: ${referralStats.currentWeek}`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  try {
    // Check if table exists
    const exists = await tableExists();

    if (!exists) {
      console.log(`Table ${TABLE_NAME} does not exist.`);
      console.log("Creating table with GSI1 (status) and GSI2 (category)...\n");
      await createTable();
    } else {
      console.log(`Table ${TABLE_NAME} already exists.\n`);
    }

    // Seed creators
    console.log(`Seeding ${SEED_CREATORS.length} creators...\n`);

    for (const creator of SEED_CREATORS) {
      await seedCreator(creator);
    }

    console.log("\n========================================");
    console.log("Seeding complete!");
    console.log(`${SEED_CREATORS.length} creators added to ${TABLE_NAME}`);
    console.log("========================================\n");

    // Print summary by status
    const featured = SEED_CREATORS.filter((c) => c.status === "FEATURED").length;
    const active = SEED_CREATORS.filter((c) => c.status === "ACTIVE").length;

    console.log("Summary:");
    console.log(`  - Featured: ${featured}`);
    console.log(`  - Active: ${active}`);
    console.log(`  - Total: ${SEED_CREATORS.length}`);

    // Print categories
    const categories = [...new Set(SEED_CREATORS.map((c) => c.niche))];
    console.log(`\nCategories: ${categories.join(", ")}`);

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  }
}

// Run the script
main();
