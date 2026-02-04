#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DatabaseStack } from "../lib/database-stack";
import { AuthStack } from "../lib/auth-stack";
import { BudgetApiStack } from "../lib/api-stack";
import { MonitoringStack } from "../lib/monitoring-stack";

const app = new cdk.App();

const environment = app.node.tryGetContext("environment") || "dev";
const region = app.node.tryGetContext("region") || "af-south-1";
const account = process.env['CDK_DEFAULT_ACCOUNT'] || "672410555499";

// Database Stack
const databaseStack = new DatabaseStack(
  app,
  `quickbudget-database-${environment}`,
  {
    env: { account, region },
    environment,
    description: "Database infrastructure for Quick Budget",
  }
);

// Auth Stack (depends on Database for Post-Confirmation trigger)
const authStack = new AuthStack(app, `quickbudget-auth-${environment}`, {
  env: { account, region },
  environment,
  tableName: databaseStack.table.tableName,
  tableArn: databaseStack.table.tableArn,
  description: "Authentication infrastructure for Quick Budget",
});

// API Stack (depends on Database and Auth)
const apiStack = new BudgetApiStack(app, `quickbudget-api-${environment}`, {
  env: { account, region },
  environment,
  databaseTable: databaseStack.table,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  description: "API Gateway and Lambda functions for Quick Budget",
});

// Monitoring Stack
const monitoringStack = new MonitoringStack(
  app,
  `quickbudget-monitoring-${environment}`,
  {
    env: { account, region },
    environment,
    api: apiStack.api,
    databaseTable: databaseStack.table,
    description: "Monitoring and alerting for Quick Budget",
  }
);

// Add dependencies
authStack.addDependency(databaseStack); // Auth needs Database for Post-Confirmation trigger
apiStack.addDependency(databaseStack);
apiStack.addDependency(authStack);
monitoringStack.addDependency(apiStack);
monitoringStack.addDependency(databaseStack);

app.synth();
