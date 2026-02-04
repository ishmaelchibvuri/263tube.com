import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface ApiNestedStackProps extends cdk.NestedStackProps {
  environment: string;
  api: apigateway.RestApi;
  databaseTable: dynamodb.Table;
  authorizer: apigateway.IAuthorizer;
  userPoolId?: string;
  userPoolArn?: string;
}
