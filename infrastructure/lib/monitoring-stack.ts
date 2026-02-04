import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  api: apigateway.RestApi;
  databaseTable: dynamodb.Table;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, "QuickBudgetDashboard", {
      dashboardName: `QuickBudget-${props.environment}`,
    });

    // API Gateway metrics
    const apiGatewayWidget = new cloudwatch.GraphWidget({
      title: "API Gateway Metrics",
      left: [
        props.api.metricCount(),
        props.api.metricLatency(),
        props.api.metricClientError(),
        props.api.metricServerError(),
      ],
      width: 12,
      height: 6,
    });

    // DynamoDB metrics
    const dynamoDBWidget = new cloudwatch.GraphWidget({
      title: "DynamoDB Metrics",
      left: [
        props.databaseTable.metricConsumedReadCapacityUnits(),
        props.databaseTable.metricConsumedWriteCapacityUnits(),
        props.databaseTable.metricThrottledRequests(),
      ],
      width: 12,
      height: 6,
    });

    // Lambda metrics - commented out until Lambda functions are passed to this stack
    // TODO: Add Lambda metrics widget when Lambda functions are available
    // const lambdaWidget = new cloudwatch.GraphWidget({
    //   title: "Lambda Metrics",
    //   left: [
    //     // Add Lambda function metrics here
    //   ],
    //   width: 12,
    //   height: 6,
    // });

    // Add widgets to dashboard
    dashboard.addWidgets(apiGatewayWidget, dynamoDBWidget);

    // Billing alarm
    new cloudwatch.Alarm(this, "BillingAlarm", {
      metric: new cloudwatch.Metric({
        namespace: "AWS/Billing",
        metricName: "EstimatedCharges",
        dimensionsMap: {
          Currency: "USD",
        },
        statistic: "Maximum",
      }),
      threshold: 10, // Alert when charges exceed $10
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Cost optimization alarms
    new cloudwatch.Alarm(this, "HighDynamoDBReadCapacityAlarm", {
      metric: props.databaseTable.metricConsumedReadCapacityUnits(),
      threshold: 20, // 80% of 25 RCU free tier
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, "HighDynamoDBWriteCapacityAlarm", {
      metric: props.databaseTable.metricConsumedWriteCapacityUnits(),
      threshold: 20, // 80% of 25 WCU free tier
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, "HighApiGatewayRequestCountAlarm", {
      metric: props.api.metricCount(),
      threshold: 1000, // Alert if requests exceed 1000 per period
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Outputs
    new cdk.CfnOutput(this, "DashboardUrl", {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: "CloudWatch Dashboard URL",
    });
  }
}
