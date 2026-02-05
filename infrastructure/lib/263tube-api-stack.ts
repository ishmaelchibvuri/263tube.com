/**
 * 263Tube API Stack
 *
 * API Gateway + Lambda for the Zimbabwean Content Creators Directory
 *
 * Endpoints:
 * - GET /creators - List all active creators
 * - GET /creators/{slug} - Get single creator by slug
 * - GET /creators/category/{category} - Get creators by category
 * - GET /creators/featured - Get featured creators
 * - POST /referrals/{slug} - Track a referral
 */

import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

export interface Tube263ApiStackProps extends cdk.StackProps {
  environment: string;
  table: dynamodb.Table;
}

export class Tube263ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: Tube263ApiStackProps) {
    super(scope, id, props);

    const { environment, table } = props;

    // =========================================================================
    // API Gateway
    // =========================================================================
    this.api = new apigateway.RestApi(this, "263TubeApi", {
      restApiName: `263tube-api-${environment}`,
      description: "263Tube Content Creators Directory API",
      deployOptions: {
        stageName: environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: this.getCorsOrigins(environment),
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
    });

    // Store API URL
    this.apiUrl = this.api.url;

    // =========================================================================
    // Lambda Functions
    // =========================================================================

    // Get All Creators Lambda
    const getCreatorsLambda = new NodejsFunction(this, "GetCreatorsFunction", {
      functionName: `263tube-get-creators-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/263tube/get-creators.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        TABLE_NAME: table.tableName,
        ENVIRONMENT: environment,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ["@aws-sdk/*"],
      },
    });

    // Get Creator By Slug Lambda
    const getCreatorBySlugLambda = new NodejsFunction(
      this,
      "GetCreatorBySlugFunction",
      {
        functionName: `263tube-get-creator-by-slug-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "lambdas/263tube/get-creator-by-slug.ts"),
        handler: "handler",
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          TABLE_NAME: table.tableName,
          ENVIRONMENT: environment,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: false,
          externalModules: ["@aws-sdk/*"],
        },
      }
    );

    // Get Creators By Category Lambda
    const getCreatorsByCategoryLambda = new NodejsFunction(
      this,
      "GetCreatorsByCategoryFunction",
      {
        functionName: `263tube-get-creators-by-category-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "lambdas/263tube/get-creators-by-category.ts"
        ),
        handler: "handler",
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          TABLE_NAME: table.tableName,
          ENVIRONMENT: environment,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: false,
          externalModules: ["@aws-sdk/*"],
        },
      }
    );

    // Track Referral Lambda
    const trackReferralLambda = new NodejsFunction(
      this,
      "TrackReferralFunction",
      {
        functionName: `263tube-track-referral-${environment}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "lambdas/263tube/track-referral.ts"),
        handler: "handler",
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          TABLE_NAME: table.tableName,
          ENVIRONMENT: environment,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: false,
          externalModules: ["@aws-sdk/*"],
        },
      }
    );

    // =========================================================================
    // Grant DynamoDB Permissions
    // =========================================================================
    table.grantReadData(getCreatorsLambda);
    table.grantReadData(getCreatorBySlugLambda);
    table.grantReadData(getCreatorsByCategoryLambda);
    table.grantReadWriteData(trackReferralLambda);

    // =========================================================================
    // API Routes
    // =========================================================================

    // /creators resource
    const creatorsResource = this.api.root.addResource("creators");

    // GET /creators - List all active creators
    creatorsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCreatorsLambda)
    );

    // /creators/featured resource
    const featuredResource = creatorsResource.addResource("featured");
    featuredResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCreatorsLambda)
    );

    // /creators/category/{category} resource
    const categoryResource = creatorsResource.addResource("category");
    const categoryParamResource = categoryResource.addResource("{category}");
    categoryParamResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCreatorsByCategoryLambda)
    );

    // /creators/{slug} resource
    const creatorSlugResource = creatorsResource.addResource("{slug}");
    creatorSlugResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getCreatorBySlugLambda)
    );

    // /referrals/{slug} resource
    const referralsResource = this.api.root.addResource("referrals");
    const referralSlugResource = referralsResource.addResource("{slug}");
    referralSlugResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(trackReferralLambda)
    );

    // =========================================================================
    // Outputs
    // =========================================================================
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
      description: "API Gateway URL",
      exportName: `263tube-api-url-${environment}`,
    });

    new cdk.CfnOutput(this, "ApiId", {
      value: this.api.restApiId,
      description: "API Gateway ID",
      exportName: `263tube-api-id-${environment}`,
    });

    // =========================================================================
    // Tags
    // =========================================================================
    cdk.Tags.of(this).add("Project", "263Tube");
    cdk.Tags.of(this).add("Environment", environment);
    cdk.Tags.of(this).add("ManagedBy", "CDK");
  }

  private getCorsOrigins(environment: string): string[] {
    switch (environment) {
      case "prod":
        return [
          "https://263tube.com",
          "https://www.263tube.com",
          "http://localhost:3000",
        ];
      case "qa":
        return ["https://qa.263tube.com", "http://localhost:3000"];
      case "dev":
      default:
        return [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
        ];
    }
  }
}
