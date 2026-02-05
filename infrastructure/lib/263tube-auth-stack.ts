/**
 * 263Tube Auth Stack
 *
 * AWS Cognito Authentication for the Zimbabwean Content Creators Directory
 *
 * Features:
 * - User Pool for creator/admin authentication
 * - Identity Pool for AWS credentials
 * - OAuth configuration
 */

import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface Tube263AuthStackProps extends cdk.StackProps {
  environment: string;
}

export class Tube263AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props: Tube263AuthStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // =========================================================================
    // Cognito User Pool
    // =========================================================================
    this.userPool = new cognito.UserPool(this, "263TubeUserPool", {
      userPoolName: `263tube-users-${environment}`,
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
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
        creatorSlug: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 100,
          mutable: true,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        environment === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // =========================================================================
    // User Pool Client
    // =========================================================================
    this.userPoolClient = new cognito.UserPoolClient(
      this,
      "263TubeUserPoolClient",
      {
        userPool: this.userPool,
        userPoolClientName: `263tube-client-${environment}`,
        generateSecret: false,
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
          callbackUrls: this.getCallbackUrls(environment),
          logoutUrls: this.getLogoutUrls(environment),
        },
        refreshTokenValidity: cdk.Duration.days(30),
        accessTokenValidity: cdk.Duration.hours(1),
        idTokenValidity: cdk.Duration.hours(1),
      }
    );

    // =========================================================================
    // User Pool Domain
    // =========================================================================
    new cognito.UserPoolDomain(this, "263TubeUserPoolDomain", {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `tube263-${environment}-${this.account}`,
      },
    });

    // =========================================================================
    // Cognito Identity Pool
    // =========================================================================
    this.identityPool = new cognito.CfnIdentityPool(
      this,
      "263TubeIdentityPool",
      {
        identityPoolName: `263tube-identity-${environment}`,
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: this.userPoolClient.userPoolClientId,
            providerName: this.userPool.userPoolProviderName,
          },
        ],
      }
    );

    // =========================================================================
    // IAM Role for Authenticated Users
    // =========================================================================
    const authenticatedRole = new iam.Role(this, "CognitoAuthenticatedRole", {
      roleName: `263tube-auth-role-${environment}`,
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

    // Attach role to Identity Pool
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

    // =========================================================================
    // Outputs
    // =========================================================================
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: `263tube-user-pool-id-${environment}`,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
      exportName: `263tube-user-pool-client-id-${environment}`,
    });

    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: this.identityPool.ref,
      description: "Cognito Identity Pool ID",
      exportName: `263tube-identity-pool-id-${environment}`,
    });

    new cdk.CfnOutput(this, "AuthenticatedRoleArn", {
      value: authenticatedRole.roleArn,
      description: "IAM Role ARN for authenticated users",
      exportName: `263tube-auth-role-arn-${environment}`,
    });

    // =========================================================================
    // Tags
    // =========================================================================
    cdk.Tags.of(this).add("Project", "263Tube");
    cdk.Tags.of(this).add("Environment", environment);
    cdk.Tags.of(this).add("ManagedBy", "CDK");
  }

  private getCallbackUrls(environment: string): string[] {
    switch (environment) {
      case "prod":
        return [
          "https://263tube.com/auth/callback",
          "https://www.263tube.com/auth/callback",
          "http://localhost:3000/auth/callback",
        ];
      case "qa":
        return [
          "https://qa.263tube.com/auth/callback",
          "http://localhost:3000/auth/callback",
        ];
      case "dev":
      default:
        return [
          "http://localhost:3000/auth/callback",
          "http://localhost:3001/auth/callback",
          "http://127.0.0.1:3000/auth/callback",
        ];
    }
  }

  private getLogoutUrls(environment: string): string[] {
    switch (environment) {
      case "prod":
        return [
          "https://263tube.com/auth/logout",
          "https://www.263tube.com/auth/logout",
          "http://localhost:3000/auth/logout",
        ];
      case "qa":
        return [
          "https://qa.263tube.com/auth/logout",
          "http://localhost:3000/auth/logout",
        ];
      case "dev":
      default:
        return [
          "http://localhost:3000/auth/logout",
          "http://localhost:3001/auth/logout",
          "http://127.0.0.1:3000/auth/logout",
        ];
    }
  }
}
