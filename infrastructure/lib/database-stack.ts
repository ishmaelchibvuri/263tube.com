import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cr from "aws-cdk-lib/custom-resources";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export interface DatabaseStackProps extends cdk.StackProps {
  environment: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Main DynamoDB table with single table design
    this.table = new dynamodb.Table(this, "QuickBudgetData", {
      tableName: `quickbudget-data-${props.environment}`,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand for free tier optimization
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy:
        props.environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // GSI1: For leaderboard queries
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GSI1PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // GSI2: For time-based queries
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "GSI2PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI2SK",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // GSI3: For exam category queries
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: {
        name: "GSI3PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI3SK",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Add TTL attribute for automatic cleanup
    this.table.addGlobalSecondaryIndex({
      indexName: "TTLIndex",
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "TTL",
        type: dynamodb.AttributeType.NUMBER,
      },
    });

    // CloudWatch alarms for monitoring
    new cdk.aws_cloudwatch.Alarm(this, "DatabaseThrottleAlarm", {
      metric: this.table.metricThrottledRequests(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cdk.aws_cloudwatch.Alarm(this, "DatabaseConsumedReadCapacityAlarm", {
      metric: this.table.metricConsumedReadCapacityUnits(),
      threshold: 20, // 80% of 25 RCU free tier
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cdk.aws_cloudwatch.Alarm(this, "DatabaseConsumedWriteCapacityAlarm", {
      metric: this.table.metricConsumedWriteCapacityUnits(),
      threshold: 20, // 80% of 25 WCU free tier
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Create custom resource Lambda for seeding features
    const seedFeaturesFunction = new NodejsFunction(this, "SeedFeaturesFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "seed-features-handler.ts"),
      handler: "handler",
      timeout: cdk.Duration.minutes(5),
      environment: {
        TABLE_NAME: this.table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant DynamoDB permissions
    this.table.grantReadWriteData(seedFeaturesFunction);

    // Create custom resource provider
    const seedFeaturesProvider = new cr.Provider(this, "SeedFeaturesProvider", {
      onEventHandler: seedFeaturesFunction,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create custom resource
    new cdk.CustomResource(this, "SeedFeaturesResource", {
      serviceToken: seedFeaturesProvider.serviceToken,
      properties: {
        // Change this value to trigger re-seeding
        Version: "1.0",
      },
    });
  }
}
