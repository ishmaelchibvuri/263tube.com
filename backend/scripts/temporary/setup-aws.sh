#!/bin/bash

# AWS Setup Script for Exam Practice Platform
# This script sets up the necessary AWS resources and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Setting up AWS for Exam Practice Platform${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1)"
    echo "  - Default output format (json)"
    exit 1
fi

# Get current AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo -e "  Account ID: ${ACCOUNT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  User: ${USER_ARN}"
echo ""

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}📦 Installing AWS CDK...${NC}"
    npm install -g aws-cdk
fi

echo -e "${GREEN}✅ AWS CDK installed${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm ${NPM_VERSION} installed${NC}"

# Create IAM policy for the application
echo -e "${YELLOW}🔐 Creating IAM policy...${NC}"
cat > exam-platform-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem"
            ],
            "Resource": "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/exam-platform-data-*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminUpdateUserAttributes",
                "cognito-idp:AdminListGroupsForUser",
                "cognito-idp:AdminDisableUser",
                "cognito-idp:AdminEnableUser",
                "cognito-idp:AdminResetUserPassword"
            ],
            "Resource": "arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:${REGION}:${ACCOUNT_ID}:*"
        }
    ]
}
EOF

# Create the policy
aws iam create-policy \
    --policy-name ExamPlatformPolicy \
    --policy-document file://exam-platform-policy.json \
    --description "Policy for Exam Practice Platform" \
    --query 'Policy.Arn' \
    --output text > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Policy may already exist${NC}"

echo -e "${GREEN}✅ IAM policy created${NC}"

# Clean up policy file
rm exam-platform-policy.json

# Create S3 bucket for deployment artifacts
BUCKET_NAME="exam-platform-deployments-${ACCOUNT_ID}-${REGION}"
echo -e "${YELLOW}🪣 Creating S3 bucket for deployments...${NC}"

if [ "$REGION" = "us-east-1" ]; then
    aws s3 mb s3://${BUCKET_NAME} 2>/dev/null || echo -e "${YELLOW}⚠️  Bucket may already exist${NC}"
else
    aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Bucket may already exist${NC}"
fi

echo -e "${GREEN}✅ S3 bucket created: ${BUCKET_NAME}${NC}"

# Set up CloudWatch billing alerts
echo -e "${YELLOW}💰 Setting up billing alerts...${NC}"

# Create SNS topic for billing alerts
TOPIC_ARN=$(aws sns create-topic --name exam-platform-billing-alerts --query 'TopicArn' --output text 2>/dev/null || echo "")

if [ -n "$TOPIC_ARN" ]; then
    echo -e "${GREEN}✅ SNS topic created: ${TOPIC_ARN}${NC}"
    
    # Subscribe to the topic (you'll need to confirm this)
    echo -e "${YELLOW}📧 Please provide an email address for billing alerts:${NC}"
    read -p "Email: " EMAIL
    
    if [ -n "$EMAIL" ]; then
        aws sns subscribe \
            --topic-arn ${TOPIC_ARN} \
            --protocol email \
            --notification-endpoint ${EMAIL} \
            --query 'SubscriptionArn' \
            --output text > /dev/null
        
        echo -e "${GREEN}✅ Email subscription created. Please check your email to confirm.${NC}"
    fi
fi

# Create CloudWatch billing alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "ExamPlatform-Billing-Alert" \
    --alarm-description "Alert when AWS charges exceed $10" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 86400 \
    --threshold 10.0 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=Currency,Value=USD \
    --evaluation-periods 1 \
    --alarm-actions ${TOPIC_ARN} \
    --query 'AlarmArn' \
    --output text > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  Billing alarm may already exist${NC}"

echo -e "${GREEN}✅ Billing alarm created${NC}"

# Create environment file template
echo -e "${YELLOW}📝 Creating environment file template...${NC}"
cat > .env.example << EOF
# AWS Configuration
AWS_REGION=${REGION}
AWS_ACCOUNT_ID=${ACCOUNT_ID}

# Application Configuration
APP_NAME=exam-practice-platform
ENVIRONMENT=dev

# Cognito Configuration (will be filled after deployment)
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# API Configuration (will be filled after deployment)
API_GATEWAY_URL=your-api-gateway-url

# Database Configuration (will be filled after deployment)
DYNAMODB_TABLE_NAME=exam-platform-data-dev

# Frontend Configuration (will be filled after deployment)
NEXT_PUBLIC_API_URL=your-api-url
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_REGION=${REGION}

# Monitoring
CLOUDWATCH_LOG_GROUP=exam-platform-logs-dev
EOF

echo -e "${GREEN}✅ Environment file template created${NC}"

echo ""
echo -e "${GREEN}🎉 AWS setup completed successfully!${NC}"
echo ""
echo -e "${GREEN}📋 Setup Summary:${NC}"
echo -e "  Account ID: ${ACCOUNT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Deployment Bucket: ${BUCKET_NAME}"
echo -e "  Billing Topic: ${TOPIC_ARN}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Run './scripts/deploy.sh dev' to deploy the platform"
echo -e "  2. Check your email to confirm the billing alert subscription"
echo -e "  3. Monitor your AWS costs in the CloudWatch console"
echo ""
echo -e "${GREEN}🚀 You're ready to deploy the Exam Practice Platform!${NC}"
