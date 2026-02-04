#!/bin/bash

##############################################################################
# PayFast Payment Status Checker
#
# This script helps you check the status of PayFast payments and webhooks
#
# Usage:
#   ./check-payment-status.sh [purchase-id]
#   ./check-payment-status.sh                    # Interactive mode
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="af-south-1"
TABLE_NAME="regulatory-exams-data"
WEBHOOK_LOG_GROUP="/aws/lambda/exam-platform-payfast-webhook-dev"
PAYMENT_LOG_GROUP="/aws/lambda/exam-platform-create-payment-dev"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}   $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

##############################################################################
# Check Functions
##############################################################################

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    print_success "AWS CLI found"
}

check_recent_webhook_logs() {
    print_header "Recent Webhook Activity (Last 10 minutes)"

    echo "Fetching logs..."
    aws logs tail "$WEBHOOK_LOG_GROUP" \
        --since 10m \
        --region "$AWS_REGION" \
        --format short 2>/dev/null || {
            print_error "No webhook logs found in last 10 minutes"
            return 1
        }
}

check_recent_payment_logs() {
    print_header "Recent Payment Creation (Last 10 minutes)"

    echo "Fetching logs..."
    aws logs tail "$PAYMENT_LOG_GROUP" \
        --since 10m \
        --region "$AWS_REGION" \
        --format short 2>/dev/null || {
            print_error "No payment creation logs found in last 10 minutes"
            return 1
        }
}

check_purchase_record() {
    local purchase_id=$1

    print_header "Purchase Record: $purchase_id"

    local key="{\"PK\": {\"S\": \"PURCHASE#$purchase_id\"}, \"SK\": {\"S\": \"PURCHASE\"}}"

    echo "Querying DynamoDB..."
    local result=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "$key" \
        --region "$AWS_REGION" \
        2>&1)

    if echo "$result" | grep -q "Item"; then
        print_success "Purchase record found"
        echo ""
        echo "$result" | jq -r '.Item | {
            purchaseId: .purchaseId.S,
            userId: .userId.S,
            tier: .tier.S,
            status: .status.S,
            amount: .amount.N,
            createdAt: .createdAt.S,
            expiresAt: .expiresAt.S,
            payfastPaymentId: .payfastPaymentId.S
        }' 2>/dev/null || echo "$result"
    else
        print_error "Purchase record not found"
        echo ""
        echo "$result"
    fi
}

check_user_subscription() {
    local user_id=$1

    print_header "User Subscription: $user_id"

    local key="{\"PK\": {\"S\": \"USER#$user_id\"}, \"SK\": {\"S\": \"PROFILE\"}}"

    echo "Querying DynamoDB..."
    local result=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "$key" \
        --region "$AWS_REGION" \
        2>&1)

    if echo "$result" | grep -q "Item"; then
        print_success "User profile found"
        echo ""
        echo "$result" | jq -r '.Item | {
            email: .email.S,
            currentTier: .currentTier.S,
            subscriptionStatus: .subscriptionStatus.S,
            subscriptionExpiresAt: .subscriptionExpiresAt.S,
            activePurchaseId: .activePurchaseId.S
        }' 2>/dev/null || echo "$result"
    else
        print_error "User profile not found"
        echo ""
        echo "$result"
    fi
}

search_webhook_for_purchase() {
    local purchase_id=$1

    print_header "Searching Webhooks for Purchase: $purchase_id"

    echo "Searching last 24 hours of webhook logs..."
    aws logs filter-log-events \
        --log-group-name "$WEBHOOK_LOG_GROUP" \
        --start-time $(($(date +%s) - 86400))000 \
        --filter-pattern "$purchase_id" \
        --region "$AWS_REGION" \
        --query 'events[*].message' \
        --output text 2>/dev/null || {
            print_error "No webhook logs found for this purchase ID"
        }
}

list_recent_purchases() {
    print_header "Recent Purchases (Last 24 hours)"

    local yesterday=$(date -u -d "yesterday" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-1d +%Y-%m-%dT%H:%M:%SZ)

    echo "Scanning DynamoDB for recent purchases..."
    aws dynamodb scan \
        --table-name "$TABLE_NAME" \
        --filter-expression "begins_with(PK, :pk) AND createdAt > :date" \
        --expression-attribute-values "{\":pk\":{\"S\":\"PURCHASE#\"},\":date\":{\"S\":\"$yesterday\"}}" \
        --region "$AWS_REGION" \
        --output json | jq -r '.Items[] | {
            purchaseId: .purchaseId.S,
            userId: .userId.S,
            tier: .tier.S,
            status: .status.S,
            amount: .amount.N,
            createdAt: .createdAt.S
        }' 2>/dev/null || {
            print_error "Error scanning for purchases"
        }
}

test_webhook_endpoint() {
    print_header "Testing Webhook Endpoint"

    local webhook_url="https://1dxxnmcn4b.execute-api.af-south-1.amazonaws.com/dev/payment/webhook/payfast"

    echo "Testing: $webhook_url"
    echo ""

    local response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$webhook_url" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "test=true" 2>&1)

    local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    local body=$(echo "$response" | grep -v "HTTP_CODE:")

    echo "HTTP Status: $http_code"
    echo "Response: $body"
    echo ""

    if [ "$http_code" == "400" ]; then
        print_success "Webhook endpoint is accessible (400 = validation failed, as expected)"
    elif [ "$http_code" == "200" ]; then
        print_success "Webhook endpoint is accessible"
    elif [ "$http_code" == "404" ]; then
        print_error "Webhook endpoint not found (404)"
    elif [ "$http_code" == "403" ]; then
        print_error "Webhook endpoint forbidden (403)"
    else
        print_info "Webhook returned status: $http_code"
    fi
}

##############################################################################
# Interactive Menu
##############################################################################

show_menu() {
    print_header "PayFast Payment Status Checker"

    echo "What would you like to check?"
    echo ""
    echo "1. Recent webhook activity (last 10 min)"
    echo "2. Recent payment creations (last 10 min)"
    echo "3. Recent purchases (last 24 hours)"
    echo "4. Check specific purchase by ID"
    echo "5. Check user subscription by user ID"
    echo "6. Test webhook endpoint"
    echo "7. Search webhook logs for purchase ID"
    echo "8. Exit"
    echo ""
    read -p "Enter choice [1-8]: " choice

    case $choice in
        1)
            check_recent_webhook_logs
            ;;
        2)
            check_recent_payment_logs
            ;;
        3)
            list_recent_purchases
            ;;
        4)
            read -p "Enter purchase ID: " purchase_id
            check_purchase_record "$purchase_id"
            ;;
        5)
            read -p "Enter user ID (Cognito sub): " user_id
            check_user_subscription "$user_id"
            ;;
        6)
            test_webhook_endpoint
            ;;
        7)
            read -p "Enter purchase ID: " purchase_id
            search_webhook_for_purchase "$purchase_id"
            ;;
        8)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

##############################################################################
# Main
##############################################################################

main() {
    check_aws_cli

    if [ $# -eq 0 ]; then
        # Interactive mode
        show_menu
    else
        # Command line mode
        local purchase_id=$1
        check_purchase_record "$purchase_id"
        echo ""
        search_webhook_for_purchase "$purchase_id"
    fi
}

main "$@"
