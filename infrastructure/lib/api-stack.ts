import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';
import { BudgetApiNestedStack } from './nested-stacks/budget-api-nested-stack';
import { DashboardApiNestedStack } from './nested-stacks/dashboard-api-nested-stack';
import { UserApiNestedStack } from './nested-stacks/user-api-nested-stack';

export interface BudgetApiStackProps extends cdk.StackProps {
  environment: string;
  databaseTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class BudgetApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;

  constructor(scope: cdk.App, id: string, props: BudgetApiStackProps) {
    super(scope, id, props);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'QuickBudgetApi', {
      restApiName: `quickbudget-api-${props.environment}`,
      description: 'Quick Budget API',
      deployOptions: {
        stageName: props.environment,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'http://localhost:3000',
          'https://dev.quickbudget.co.za',
          'https://qa.quickbudget.co.za',
          'https://quickbudget.co.za',
          'https://www.quickbudget.co.za',
        ],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Add CORS headers to error responses (401, 403, 400, 500)
    this.api.addGatewayResponse('UnauthorizedResponse', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse('ForbiddenResponse', {
      type: apigateway.ResponseType.ACCESS_DENIED,
      statusCode: '403',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse('DefaultResponse', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse('BadRequestResponse', {
      type: apigateway.ResponseType.BAD_REQUEST_BODY,
      statusCode: '400',
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    // Create Custom Authorizer
    const authorizerLambda = new lambda.NodejsFunction(this, 'AuthorizerFunction', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      functionName: `quickbudget-authorizer-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/auth/authorizer.ts'),
      handler: 'handler',
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
    });

    const authorizer = new apigateway.TokenAuthorizer(this, 'CustomAuthorizer', {
      handler: authorizerLambda,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    // Create nested stacks - Budget module only (core functionality)
    new BudgetApiNestedStack(this, 'Budget', {
      environment: props.environment,
      api: this.api,
      databaseTable: props.databaseTable,
      authorizer,
    });

    new DashboardApiNestedStack(this, 'Dashboard', {
      environment: props.environment,
      api: this.api,
      databaseTable: props.databaseTable,
      authorizer,
    });

    new UserApiNestedStack(this, 'User', {
      environment: props.environment,
      api: this.api,
      databaseTable: props.databaseTable,
      authorizer,
      userPoolId: props.userPool.userPoolId,
      userPoolArn: props.userPool.userPoolArn,
    });

    this.apiUrl = this.api.url;

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `quickbudget-${props.environment}-api-url`,
    });
  }
}
