#!/usr/bin/env node
/**
 * 263Tube CDK Application
 *
 * Infrastructure for the Zimbabwean Content Creators Directory
 *
 * Deploys:
 * - DynamoDB table with Single Table Design
 * - GSI1: Status-based queries (active/featured creators)
 * - GSI2: Category-based queries (niche filtering)
 * - GSI3: Referral leaderboard (weekly traffic drivers)
 *
 * Environments: dev, qa, prod
 */

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { TubeDatabase263Stack } from "../lib/263tube-database-stack";

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

// 263Tube Database Stack
const databaseStack = new TubeDatabase263Stack(
  app,
  `263tube-database-${environment}`,
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

// Output important values
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
