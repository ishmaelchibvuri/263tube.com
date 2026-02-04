import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";
import { getCallbackUrls, getLogoutUrls } from "./cors-config";

export interface AuthStackProps extends cdk.StackProps {
  environment: string;
  tableName: string;
  tableArn: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // Post-Confirmation Lambda Function
    const postConfirmationLambda = new NodejsFunction(
      this,
      "PostConfirmationLambda",
      {
        functionName: `quickbudget-post-confirmation-${props.environment}`,
        entry: path.join(
          process.cwd(),
          "../backend/lambdas/auth/post-confirmation.ts"
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        depsLockFilePath: path.join(process.cwd(), "../package-lock.json"),
        environment: {
          TABLE_NAME: props.tableName,
          ENVIRONMENT: props.environment,
          BREVO_API_KEY: process.env.BREVO_API_KEY || '',
          BREVO_LIST_ID: '20',
        },
        bundling: {
          minify: false,
          sourceMap: true,
          externalModules: ["aws-sdk"],
        },
      }
    );

    // Grant DynamoDB permissions to Post-Confirmation Lambda
    postConfirmationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
        ],
        resources: [props.tableArn, `${props.tableArn}/index/*`],
      })
    );

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, "QuickBudgetUserPool", {
      userPoolName: `quickbudget-users-${props.environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
        showOnLeaderboard: new cognito.BooleanAttribute({
          mutable: true,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        props.environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      lambdaTriggers: {
        postConfirmation: postConfirmationLambda,
      },
    });

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(
      this,
      "QuickBudgetUserPoolClient",
      {
        userPool: this.userPool,
        userPoolClientName: `quickbudget-client-${props.environment}`,
        generateSecret: false, // For web applications
        authFlows: {
          userPassword: true,
          userSrp: true,
          adminUserPassword: true,
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: getCallbackUrls(props.environment),
          logoutUrls: getLogoutUrls(props.environment),
        },
        refreshTokenValidity: cdk.Duration.days(30),
        accessTokenValidity: cdk.Duration.hours(1),
        idTokenValidity: cdk.Duration.hours(1),
      }
    );

    // User Pool Domain
    const userPoolDomain = new cognito.UserPoolDomain(
      this,
      "QuickBudgetUserPoolDomain",
      {
        userPool: this.userPool,
        cognitoDomain: {
          domainPrefix: `quickbudget-${props.environment}-${this.account}`,
        },
      }
    );

    // Cognito Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(
      this,
      "QuickBudgetIdentityPool",
      {
        identityPoolName: `quickbudget-identity-${props.environment}`,
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: this.userPoolClient.userPoolClientId,
            providerName: this.userPool.userPoolProviderName,
          },
        ],
      }
    );

    // IAM role for authenticated users
    const authenticatedRole = new iam.Role(this, "CognitoAuthenticatedRole", {
      roleName: `quickbudget-auth-role-${props.environment}`,
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    // Grant authenticated users permissions to get credentials
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cognito-identity:GetCredentialsForIdentity",
          "cognito-identity:GetId",
        ],
        resources: ["*"],
      })
    );

    // Attach the roles to the Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "IdentityPoolRoleAttachment",
      {
        identityPoolId: this.identityPool.ref,
        roles: {
          authenticated: authenticatedRole.roleArn,
        },
      }
    );

    // CloudWatch alarms for monitoring
    new cdk.aws_cloudwatch.Alarm(this, "CognitoSignInFailuresAlarm", {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: "AWS/Cognito",
        metricName: "SignInFailures",
        dimensionsMap: {
          UserPoolId: this.userPool.userPoolId,
        },
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cdk.aws_cloudwatch.Alarm(this, "CognitoSignUpFailuresAlarm", {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: "AWS/Cognito",
        metricName: "SignUpFailures",
        dimensionsMap: {
          UserPoolId: this.userPool.userPoolId,
        },
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "UserPoolDomain", {
      value: userPoolDomain.domainName,
      description: "Cognito User Pool Domain",
    });

    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: this.identityPool.ref,
      description: "Cognito Identity Pool ID",
    });

    new cdk.CfnOutput(this, "AuthenticatedRoleArn", {
      value: authenticatedRole.roleArn,
      description: "IAM Role ARN for authenticated users",
    });
  }
}
