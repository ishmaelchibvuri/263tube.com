import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { ApiNestedStackProps } from './api-base';

export class UserApiNestedStack extends cdk.NestedStack {
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

    // Get User Access Lambda
    const getUserAccessLambda = new lambda.NodejsFunction(this, 'GetUserAccessLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-get-user-access-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/user/get-access.ts'),
      handler: 'handler',
    });

    props.databaseTable.grantReadData(getUserAccessLambda);

    // Profile Lambda (GET, PUT, DELETE)
    const profileLambda = new lambda.NodejsFunction(this, 'ProfileLambda', {
      ...lambdaConfig,
      functionName: `quickbudget-profile-${props.environment}`,
      entry: path.join(process.cwd(), '../backend/lambdas/auth/profile.ts'),
      handler: 'handler',
      environment: {
        ...lambdaConfig.environment,
        USER_POOL_ID: props.userPoolId || '',
        BREVO_API_KEY: process.env.BREVO_API_KEY || '',
        BREVO_LIST_ID: '20',
        FROM_EMAIL: 'support@quickbudget.co.za',
      },
    });

    // Grant DynamoDB permissions for profile operations
    props.databaseTable.grantReadWriteData(profileLambda);

    // Grant Cognito permissions for user management
    if (props.userPoolArn) {
      profileLambda.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminUpdateUserAttributes',
        ],
        resources: [props.userPoolArn],
      }));
    }

    // Grant SES permissions for sending goodbye emails on account deletion
    profileLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail',
      ],
      resources: ['*'],
    }));

    // API Routes
    const user = props.api.root.addResource('user');

    user.addResource('access').addMethod('GET',
      new apigateway.LambdaIntegration(getUserAccessLambda), {
      authorizer: props.authorizer,
    });

    // Profile routes - /profile
    const profile = props.api.root.addResource('profile');
    const profileIntegration = new apigateway.LambdaIntegration(profileLambda);

    profile.addMethod('GET', profileIntegration, {
      authorizer: props.authorizer,
    });

    profile.addMethod('PUT', profileIntegration, {
      authorizer: props.authorizer,
    });

    profile.addMethod('DELETE', profileIntegration, {
      authorizer: props.authorizer,
    });
  }
}
