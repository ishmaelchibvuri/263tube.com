/**
 * 263Tube Database Stack
 *
 * DynamoDB Single Table Design for Content Creators Directory
 *
 * Access Patterns:
 * 1. Get single creator: PK=CREATOR#{slug}, SK=METADATA
 * 2. Get all active/featured creators: GSI1PK=STATUS#{status}, GSI1SK={reach}#{slug}
 * 3. Get creators by category: GSI2PK=CATEGORY#{niche}, GSI2SK={reach}#{slug}
 * 4. Get top referrers (weekly): GSI3PK=REFERRAL#WEEKLY, GSI3SK={count}#{slug}
 * 5. Track referral event: PK=REFERRAL#{slug}#{date}, SK=EVENT#{timestamp}
 */

import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cr from "aws-cdk-lib/custom-resources";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export interface TubeDatabase263StackProps extends cdk.StackProps {
  environment: string;
}

export class TubeDatabase263Stack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: TubeDatabase263StackProps) {
    super(scope, id, props);

    const { environment } = props;

    // =========================================================================
    // Main DynamoDB Table
    // =========================================================================
    this.table = new dynamodb.Table(this, "263TubeData", {
      tableName: `263tube-${environment}`,
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      // On-demand billing for cost optimization (free tier friendly)
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // Point-in-time recovery for data protection
      pointInTimeRecovery: true,
      // AWS managed encryption
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // Retention policy based on environment
      removalPolicy:
        environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // =========================================================================
    // GSI1: Status-Based Queries
    // =========================================================================
    // Access Pattern: Get all active/featured creators, sorted by reach
    // Example: gsi1pk = "STATUS#ACTIVE", gsi1sk = "000004500000#madam-boss"
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "gsi1pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi1sk",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =========================================================================
    // GSI2: Category-Based Queries
    // =========================================================================
    // Access Pattern: Get creators by niche/category, sorted by reach
    // Example: gsi2pk = "CATEGORY#comedy", gsi2sk = "000004500000#madam-boss"
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "gsi2pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi2sk",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =========================================================================
    // GSI3: Referral Leaderboard (GSI_REFERRALS)
    // =========================================================================
    // Access Pattern: Get top referrers for the current week
    // Example: gsi3pk = "REFERRAL#WEEKLY", gsi3sk = "000000150#the-newbys"
    // The sort key is padded referral count + slug for proper sorting
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI_REFERRALS",
      partitionKey: {
        name: "gsi3pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi3sk",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =========================================================================
    // TTL Support for Cleanup
    // =========================================================================
    // Used for auto-expiring referral events and other temporary data
    this.table.addGlobalSecondaryIndex({
      indexName: "TTLIndex",
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "ttl",
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // Enable TTL on the 'ttl' attribute
    const cfnTable = this.table.node.defaultChild as dynamodb.CfnTable;
    cfnTable.addPropertyOverride("TimeToLiveSpecification", {
      AttributeName: "ttl",
      Enabled: true,
    });

    // =========================================================================
    // CloudWatch Alarms
    // =========================================================================
    // Throttle alarm
    new cdk.aws_cloudwatch.Alarm(this, "ThrottleAlarm", {
      alarmName: `263tube-throttle-${environment}`,
      metric: this.table.metricThrottledRequests(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: "DynamoDB throttled requests exceeded threshold",
    });

    // Read capacity alarm (80% of free tier)
    new cdk.aws_cloudwatch.Alarm(this, "ReadCapacityAlarm", {
      alarmName: `263tube-read-capacity-${environment}`,
      metric: this.table.metricConsumedReadCapacityUnits(),
      threshold: 20,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: "DynamoDB read capacity approaching free tier limit",
    });

    // Write capacity alarm (80% of free tier)
    new cdk.aws_cloudwatch.Alarm(this, "WriteCapacityAlarm", {
      alarmName: `263tube-write-capacity-${environment}`,
      metric: this.table.metricConsumedWriteCapacityUnits(),
      threshold: 20,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: "DynamoDB write capacity approaching free tier limit",
    });

    // =========================================================================
    // Custom Resource for Seeding Initial Data
    // =========================================================================
    const seedFunction = new NodejsFunction(this, "SeedCreatorsFunction", {
      functionName: `263tube-seed-creators-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "263tube-seed-handler.ts"),
      handler: "handler",
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: {
        TABLE_NAME: this.table.tableName,
        ENVIRONMENT: environment,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
        sourceMap: false,
      },
    });

    // Grant DynamoDB permissions to seed function
    this.table.grantReadWriteData(seedFunction);

    // Create custom resource provider
    const seedProvider = new cr.Provider(this, "SeedProvider", {
      onEventHandler: seedFunction,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create custom resource that triggers seeding
    new cdk.CustomResource(this, "SeedCreatorsResource", {
      serviceToken: seedProvider.serviceToken,
      properties: {
        // Change this version to trigger re-seeding
        Version: "1.0.0",
        Timestamp: Date.now().toString(),
      },
    });

    // =========================================================================
    // Stack Tags
    // =========================================================================
    cdk.Tags.of(this).add("Project", "263Tube");
    cdk.Tags.of(this).add("Environment", environment);
    cdk.Tags.of(this).add("ManagedBy", "CDK");
  }
}
