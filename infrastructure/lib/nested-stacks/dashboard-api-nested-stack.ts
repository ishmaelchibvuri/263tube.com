import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { ApiNestedStackProps } from './api-base';

export class DashboardApiNestedStack extends cdk.NestedStack {
  constructor(scope: cdk.Stack, id: string, props: ApiNestedStackProps) {
    super(scope, id, props);

    const lambdaConfig = {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: props.databaseTable.tableName,
        ENVIRONMENT: props.environment,
      },
    };

    // Get Dashboard Stats Lambda (legacy debt-focused)
    const getDashboardStatsLambda = new lambda.NodejsFunction(this, 'GetDashboardStatsLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-get-dashboard-stats-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/dashboard/get-stats.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantReadData(getDashboardStatsLambda);

    // Get Budget Stats Lambda (budget-focused dashboard)
    const getBudgetStatsLambda = new lambda.NodejsFunction(this, 'GetBudgetStatsLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-get-budget-stats-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/dashboard/get-budget-stats.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantReadData(getBudgetStatsLambda);

    // API Routes
    const dashboard = props.api.root.addResource('dashboard');

    dashboard.addResource('stats').addMethod('GET',
      new apigateway.LambdaIntegration(getDashboardStatsLambda), {
      authorizer: props.authorizer,
    });

    dashboard.addResource('budget-stats').addMethod('GET',
      new apigateway.LambdaIntegration(getBudgetStatsLambda), {
      authorizer: props.authorizer,
    });
  }
}
