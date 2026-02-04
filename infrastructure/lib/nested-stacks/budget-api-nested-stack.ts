import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { ApiNestedStackProps } from './api-base';

export class BudgetApiNestedStack extends cdk.NestedStack {
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

    // Get Budget Lambda
    const getBudgetLambda = new lambda.NodejsFunction(this, 'GetBudgetLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-get-budget-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/budget/get-budget.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantReadData(getBudgetLambda);

    // Save Budget Lambda
    const saveBudgetLambda = new lambda.NodejsFunction(this, 'SaveBudgetLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-save-budget-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/budget/save-budget.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantReadWriteData(saveBudgetLambda);

    // Get Budget History Lambda
    const getBudgetHistoryLambda = new lambda.NodejsFunction(this, 'GetBudgetHistoryLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-get-budget-history-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/budget/get-budget-history.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantReadData(getBudgetHistoryLambda);

    // Delete Budget Lambda
    const deleteBudgetLambda = new lambda.NodejsFunction(this, 'DeleteBudgetLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-delete-budget-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/budget/delete-budget.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantWriteData(deleteBudgetLambda);

    // API Routes
    const budget = props.api.root.addResource('budget');

    budget.addMethod('GET', new apigateway.LambdaIntegration(getBudgetLambda), {
      authorizer: props.authorizer,
    });

    budget.addMethod('PUT', new apigateway.LambdaIntegration(saveBudgetLambda), {
      authorizer: props.authorizer,
    });

    budget.addMethod('POST', new apigateway.LambdaIntegration(saveBudgetLambda), {
      authorizer: props.authorizer,
    });

    budget.addMethod('DELETE', new apigateway.LambdaIntegration(deleteBudgetLambda), {
      authorizer: props.authorizer,
    });

    const history = budget.addResource('history');
    history.addMethod('GET', new apigateway.LambdaIntegration(getBudgetHistoryLambda), {
      authorizer: props.authorizer,
    });
  }
}
