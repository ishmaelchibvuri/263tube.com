#!/bin/bash

# API Testing Script for Exam Practice Platform
# This script tests the API endpoints to ensure they're working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
API_URL=${2:-""}

if [ -z "$API_URL" ]; then
    # Get API URL from CloudFormation stack
    API_URL=$(aws cloudformation describe-stacks --stack-name ExamPlatform-${ENVIRONMENT} --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text 2>/dev/null || echo "")
fi

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Could not find API URL. Please provide it as the second argument.${NC}"
    echo "Usage: $0 <environment> <api-url>"
    exit 1
fi

echo -e "${GREEN}🧪 Testing Exam Practice Platform API${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}API URL: ${API_URL}${NC}"
echo ""

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo -e "  ${method} ${endpoint}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X ${method} \
            -H "Content-Type: application/json" \
            -d "${data}" \
            "${API_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} \
            -H "Content-Type: application/json" \
            "${API_URL}${endpoint}")
    fi
    
    # Split response and status code
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✅ PASS${NC} (Status: ${status_code})"
    else
        echo -e "  ${RED}❌ FAIL${NC} (Expected: ${expected_status}, Got: ${status_code})"
        echo -e "  Response: ${body}"
    fi
    echo ""
}

# Test public endpoints
echo -e "${GREEN}📋 Testing Public Endpoints${NC}"
echo ""

test_endpoint "GET" "/exams" "" "200" "Get available exams"
test_endpoint "GET" "/leaderboard/daily" "" "200" "Get daily leaderboard"
test_endpoint "GET" "/leaderboard/weekly" "" "200" "Get weekly leaderboard"
test_endpoint "GET" "/leaderboard/monthly" "" "200" "Get monthly leaderboard"

# Test registration endpoint
echo -e "${GREEN}📝 Testing Registration${NC}"
echo ""

test_endpoint "POST" "/auth/register" '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "student",
    "showOnLeaderboard": true
}' "200" "User registration"

# Test login endpoint
echo -e "${GREEN}🔐 Testing Authentication${NC}"
echo ""

# Note: This will fail if the user doesn't exist, but we're testing the endpoint structure
test_endpoint "POST" "/auth/login" '{
    "email": "test@example.com",
    "password": "TestPassword123!"
}' "401" "User login (expected to fail with invalid credentials)"

# Test protected endpoints (these will fail without authentication, but we're testing the endpoint structure)
echo -e "${GREEN}🔒 Testing Protected Endpoints (Expected to fail without auth)${NC}"
echo ""

test_endpoint "GET" "/auth/profile" "" "401" "Get user profile (no auth)"
test_endpoint "GET" "/user/history" "" "401" "Get user history (no auth)"
test_endpoint "GET" "/user/stats" "" "401" "Get user stats (no auth)"
test_endpoint "GET" "/leaderboard/rank" "" "401" "Get user rank (no auth)"

# Test admin endpoints (these will fail without admin auth)
echo -e "${GREEN}👑 Testing Admin Endpoints (Expected to fail without admin auth)${NC}"
echo ""

test_endpoint "GET" "/admin/analytics" "" "401" "Get analytics (no auth)"
test_endpoint "GET" "/admin/users?action=list" "" "401" "List users (no auth)"
test_endpoint "GET" "/admin/exams?action=list" "" "401" "List exams (no auth)"

# Test invalid endpoints
echo -e "${GREEN}🚫 Testing Invalid Endpoints${NC}"
echo ""

test_endpoint "GET" "/invalid-endpoint" "" "404" "Invalid endpoint"
test_endpoint "POST" "/exams" '{"invalid": "data"}' "400" "Invalid exam creation data"

# Test CORS
echo -e "${GREEN}🌐 Testing CORS${NC}"
echo ""

echo -e "${YELLOW}Testing: CORS preflight request${NC}"
cors_response=$(curl -s -w "\n%{http_code}" -X OPTIONS \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "${API_URL}/exams")

cors_status=$(echo "$cors_response" | tail -n1)
cors_headers=$(curl -s -I -X OPTIONS \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "${API_URL}/exams" | grep -i "access-control")

if [ "$cors_status" = "200" ] && [ -n "$cors_headers" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} (CORS headers present)"
else
    echo -e "  ${RED}❌ FAIL${NC} (CORS not configured properly)"
fi
echo ""

# Performance test
echo -e "${GREEN}⚡ Testing Performance${NC}"
echo ""

echo -e "${YELLOW}Testing: API response time${NC}"
start_time=$(date +%s%N)
curl -s "${API_URL}/exams" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "  ${GREEN}✅ PASS${NC} (Response time: ${response_time}ms)"
else
    echo -e "  ${YELLOW}⚠️  SLOW${NC} (Response time: ${response_time}ms)"
fi
echo ""

echo -e "${GREEN}🎉 API testing completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo -e "  - Some tests are expected to fail without proper authentication"
echo -e "  - Register a user and get authentication tokens to test protected endpoints"
echo -e "  - Check the AWS CloudWatch logs for detailed error information"
echo -e "  - Monitor API Gateway metrics in the AWS console"
echo ""
echo -e "${GREEN}🔍 For detailed testing, use tools like Postman or curl with authentication tokens.${NC}"
