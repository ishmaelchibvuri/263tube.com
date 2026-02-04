#!/bin/bash

# Exam Practice Platform Deployment Script
# This script deploys the entire platform to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${GREEN}🚀 Starting deployment of Exam Practice Platform${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"
echo -e "${YELLOW}Account: ${ACCOUNT_ID}${NC}"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK not installed. Please install it first.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build backend
echo -e "${YELLOW}🔨 Building backend...${NC}"
cd backend
npm install
npm run build
cd ..

# Build frontend
echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Deploy infrastructure
echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
cd infrastructure
npm install
npm run build

# Bootstrap CDK if needed
echo -e "${YELLOW}🚀 Bootstrapping CDK...${NC}"
cdk bootstrap aws://${ACCOUNT_ID}/${REGION}

# Deploy the stack
echo -e "${YELLOW}☁️  Deploying CDK stack...${NC}"
cdk deploy --context environment=${ENVIRONMENT} --context region=${REGION} --require-approval never

# Get outputs
echo -e "${YELLOW}📋 Getting deployment outputs...${NC}"
API_URL=$(aws cloudformation describe-stacks --stack-name ExamPlatform-${ENVIRONMENT} --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
FRONTEND_URL=$(aws cloudformation describe-stacks --stack-name ExamPlatform-${ENVIRONMENT} --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name ExamPlatform-${ENVIRONMENT} --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name ExamPlatform-${ENVIRONMENT} --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)

cd ..

# Create environment file
echo -e "${YELLOW}📝 Creating environment file...${NC}"
cat > .env.${ENVIRONMENT} << EOF
# AWS Configuration
AWS_REGION=${REGION}
AWS_ACCOUNT_ID=${ACCOUNT_ID}

# Application Configuration
APP_NAME=exam-practice-platform
ENVIRONMENT=${ENVIRONMENT}

# Cognito Configuration
COGNITO_USER_POOL_ID=${USER_POOL_ID}
COGNITO_CLIENT_ID=${USER_POOL_CLIENT_ID}

# API Configuration
API_GATEWAY_URL=${API_URL}

# Database Configuration
DYNAMODB_TABLE_NAME=exam-platform-data-${ENVIRONMENT}

# Frontend Configuration
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${USER_POOL_ID}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${USER_POOL_CLIENT_ID}
NEXT_PUBLIC_COGNITO_REGION=${REGION}

# Monitoring
CLOUDWATCH_LOG_GROUP=exam-platform-logs-${ENVIRONMENT}
EOF

# Seed sample data
echo -e "${YELLOW}🌱 Seeding sample data...${NC}"
if [ -f "scripts/seed-sample-exams.ts" ]; then
    npx ts-node scripts/seed-sample-exams.ts ${ENVIRONMENT}
fi

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}📊 Deployment Summary:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Region: ${REGION}"
echo -e "  API URL: ${API_URL}"
echo -e "  Frontend URL: ${FRONTEND_URL}"
echo -e "  User Pool ID: ${USER_POOL_ID}"
echo -e "  User Pool Client ID: ${USER_POOL_CLIENT_ID}"
echo ""
echo -e "${GREEN}🎉 Your Exam Practice Platform is now live!${NC}"
echo -e "${YELLOW}Visit: ${FRONTEND_URL}${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Update your DNS to point to the CloudFront distribution"
echo -e "  2. Configure email settings for Cognito"
echo -e "  3. Set up monitoring and alerts"
echo -e "  4. Create your first exam as an admin user"
