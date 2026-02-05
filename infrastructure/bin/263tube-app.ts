#!/usr/bin/env node
/**
 * 263Tube CDK Application
 *
 * Infrastructure for the Zimbabwean Content Creators Directory
 *
 * Deploys:
 * - DynamoDB table with Single Table Design
 * - Cognito User Pool & Identity Pool for authentication
 * - API Gateway with Lambda functions
 *
 * Environments: dev, qa, prod
 */

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { TubeDatabase263Stack } from "../lib/263tube-database-stack";
import { Tube263AuthStack } from "../lib/263tube-auth-stack";
import { Tube263ApiStack } from "../lib/263tube-api-stack";

const app = new cdk.App();

// Get environment from context or default to dev
const environment = app.node.tryGetContext("environment") || "dev";
const region = app.node.tryGetContext("region") || "af-south-1";
const account = process.env["CDK_DEFAULT_ACCOUNT"] || "672410555499";

console.log(`\n========================================`);
console.log(`Deploying 263Tube - ${environment.toUpperCase()}`);
console.log(`Region: ${region}`);
console.log(`Account: ${account}`);
console.log(`========================================\n`);

// ============================================================================
// 263Tube Database Stack
// ============================================================================
const databaseStack = new TubeDatabase263Stack(
  app,
  `tube263-database-${environment}`,
  {
    env: { account, region },
    environment,
    description: `263Tube DynamoDB infrastructure (${environment})`,
    tags: {
      Project: "263Tube",
      Environment: environment,
      ManagedBy: "CDK",
    },
  }
);

// ============================================================================
// 263Tube Auth Stack
// ============================================================================
const authStack = new Tube263AuthStack(app, `tube263-auth-${environment}`, {
  env: { account, region },
  environment,
  description: `263Tube Cognito authentication (${environment})`,
  tags: {
    Project: "263Tube",
    Environment: environment,
    ManagedBy: "CDK",
  },
});

// ============================================================================
// 263Tube API Stack
// ============================================================================
const apiStack = new Tube263ApiStack(app, `tube263-api-${environment}`, {
  env: { account, region },
  environment,
  table: databaseStack.table,
  description: `263Tube API Gateway infrastructure (${environment})`,
  tags: {
    Project: "263Tube",
    Environment: environment,
    ManagedBy: "CDK",
  },
});

// ============================================================================
// Stack Dependencies
// ============================================================================
apiStack.addDependency(databaseStack);

// ============================================================================
// Stack Outputs
// ============================================================================

// Database outputs
new cdk.CfnOutput(databaseStack, "TableName", {
  value: databaseStack.table.tableName,
  description: "DynamoDB table name",
  exportName: `263tube-table-name-${environment}`,
});

new cdk.CfnOutput(databaseStack, "TableArn", {
  value: databaseStack.table.tableArn,
  description: "DynamoDB table ARN",
  exportName: `263tube-table-arn-${environment}`,
});

new cdk.CfnOutput(databaseStack, "Region", {
  value: region,
  description: "AWS Region",
  exportName: `263tube-region-${environment}`,
});

app.synth();
