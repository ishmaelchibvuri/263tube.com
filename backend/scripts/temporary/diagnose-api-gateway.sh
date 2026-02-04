#!/bin/bash

# ============================================
# Backend Configuration Diagnostic Script
# ============================================

API_ID="1dxxnmcn4b"
REGION="af-south-1"
STAGE="dev"

echo "========================================"
echo "AWS API Gateway Configuration Diagnosis"
echo "========================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "Please install it: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI is installed"
echo ""

# Get API details
echo "📋 Fetching API Gateway details..."
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "Stage: $STAGE"
echo ""

# Get API info
echo "=== API Information ==="
aws apigateway get-rest-api \
    --rest-api-id $API_ID \
    --region $REGION \
    --query '{name:name,createdDate:createdDate,description:description}' \
    --output table

echo ""

# Get authorizers
echo "=== Authorizers ==="
aws apigateway get-authorizers \
    --rest-api-id $API_ID \
    --region $REGION \
    --output table

echo ""

# Get all resources
echo "=== API Resources ==="
RESOURCES=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --output json)

echo "$RESOURCES" | jq -r '.items[] | "\(.path) - \(.id)"'

echo ""

# Check /auth/profile method configuration
echo "=== Checking /auth/profile Configuration ==="
PROFILE_RESOURCE_ID=$(echo "$RESOURCES" | jq -r '.items[] | select(.path=="/auth/profile") | .id')

if [ -z "$PROFILE_RESOURCE_ID" ]; then
    echo "❌ /auth/profile resource not found!"
else
    echo "✅ Resource ID: $PROFILE_RESOURCE_ID"
    
    # Get GET method details
    echo ""
    echo "--- GET Method Configuration ---"
    aws apigateway get-method \
        --rest-api-id $API_ID \
        --resource-id $PROFILE_RESOURCE_ID \
        --http-method GET \
        --region $REGION \
        --output json | jq '{
            authorizationType: .authorizationType,
            authorizerId: .authorizerId,
            authorizationScopes: .authorizationScopes,
            apiKeyRequired: .apiKeyRequired
        }'
    
    # Get authorizer details
    AUTHORIZER_ID=$(aws apigateway get-method \
        --rest-api-id $API_ID \
        --resource-id $PROFILE_RESOURCE_ID \
        --http-method GET \
        --region $REGION \
        --query 'authorizerId' \
        --output text 2>/dev/null)
    
    if [ "$AUTHORIZER_ID" != "None" ] && [ ! -z "$AUTHORIZER_ID" ]; then
        echo ""
        echo "--- Authorizer Details ---"
        aws apigateway get-authorizer \
            --rest-api-id $API_ID \
            --authorizer-id $AUTHORIZER_ID \
            --region $REGION \
            --output json | jq '{
                name: .name,
                type: .type,
                providerARNs: .providerARNs,
                authorizerUri: .authorizerUri,
                identitySource: .identitySource,
                authorizerResultTtlInSeconds: .authorizerResultTtlInSeconds
            }'
    fi
fi

echo ""

# Check /user/stats method configuration  
echo "=== Checking /user/stats Configuration ==="
STATS_RESOURCE_ID=$(echo "$RESOURCES" | jq -r '.items[] | select(.path=="/user/stats") | .id')

if [ -z "$STATS_RESOURCE_ID" ]; then
    echo "❌ /user/stats resource not found!"
else
    echo "✅ Resource ID: $STATS_RESOURCE_ID"
    
    echo ""
    echo "--- GET Method Configuration ---"
    aws apigateway get-method \
        --rest-api-id $API_ID \
        --resource-id $STATS_RESOURCE_ID \
        --http-method GET \
        --region $REGION \
        --output json | jq '{
            authorizationType: .authorizationType,
            authorizerId: .authorizerId,
            authorizationScopes: .authorizationScopes,
            apiKeyRequired: .apiKeyRequired
        }'
fi

echo ""

# Check deployments
echo "=== Recent Deployments ==="
aws apigateway get-deployments \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[0:3].{id:id,createdDate:createdDate,description:description}' \
    --output table

echo ""

# Check stage configuration
echo "=== Stage Configuration ==="
aws apigateway get-stage \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --region $REGION \
    --output json | jq '{
        stageName: .stageName,
        deploymentId: .deploymentId,
        cacheClusterEnabled: .cacheClusterEnabled,
        tracingEnabled: .tracingEnabled,
        lastUpdatedDate: .lastUpdatedDate
    }'

echo ""
echo "========================================"
echo "Diagnosis Complete"
echo "========================================"
echo ""

# Analysis
echo "🔍 Analysis:"
echo ""

# Check if authorizer types match
AUTH_TYPE_PROFILE=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $PROFILE_RESOURCE_ID \
    --http-method GET \
    --region $REGION \
    --query 'authorizationType' \
    --output text 2>/dev/null)

AUTH_TYPE_STATS=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $STATS_RESOURCE_ID \
    --http-method GET \
    --region $REGION \
    --query 'authorizationType' \
    --output text 2>/dev/null)

if [ "$AUTH_TYPE_PROFILE" != "$AUTH_TYPE_STATS" ]; then
    echo "⚠️  WARNING: Different authorization types detected!"
    echo "   /auth/profile: $AUTH_TYPE_PROFILE"
    echo "   /user/stats: $AUTH_TYPE_STATS"
    echo "   This might explain why one endpoint works and the other doesn't."
fi

# Check for OAuth scopes
OAUTH_SCOPES=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $PROFILE_RESOURCE_ID \
    --http-method GET \
    --region $REGION \
    --query 'authorizationScopes' \
    --output text 2>/dev/null)

if [ "$OAUTH_SCOPES" != "None" ] && [ ! -z "$OAUTH_SCOPES" ]; then
    echo "⚠️  WARNING: OAuth Scopes are configured: $OAUTH_SCOPES"
    echo "   With OAuth scopes, you must use ACCESS token, not ID token"
    echo "   Either remove OAuth scopes or switch to access token"
fi

echo ""
echo "✅ Next Steps:"
echo ""
echo "1. If authorizer types differ, make them consistent"
echo "2. If OAuth scopes are set, either:"
echo "   - Remove them to use ID tokens (recommended)"
echo "   - Switch client to use access tokens"
echo "3. Redeploy the API after any changes"
echo "4. Check CloudWatch logs for detailed error messages"
echo ""

# CloudWatch logs command
echo "📊 To check CloudWatch logs, run:"
echo ""
echo "aws logs tail \"/aws/apigateway/$API_ID/$STAGE\" --follow --region $REGION"
echo ""
