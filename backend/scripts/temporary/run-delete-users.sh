#!/bin/bash

# User Deletion Script Runner
# This script deletes specified users from both DynamoDB and Cognito

set -e  # Exit on any error

echo "=========================================="
echo "USER DELETION SCRIPT"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ../.env ]; then
    echo "❌ Error: .env file not found in backend directory"
    echo "Please create a .env file with:"
    echo "  TABLE_NAME=your-dynamodb-table-name"
    echo "  USER_POOL_ID=your-cognito-user-pool-id"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
export $(grep -v '^#' ../.env | xargs)

# Check required variables
if [ -z "$TABLE_NAME" ]; then
    echo "❌ Error: TABLE_NAME not set in .env"
    exit 1
fi

if [ -z "$USER_POOL_ID" ]; then
    echo "⚠️  Warning: USER_POOL_ID not set in .env"
    echo "   Users will only be deleted from DynamoDB, not Cognito"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Configuration:"
echo "  Table: $TABLE_NAME"
echo "  User Pool: ${USER_POOL_ID:-Not set}"
echo ""
echo "⚠️  WARNING: This will permanently delete the following users:"
echo "  - support@activewave.co.za"
echo "  - iverson.eulises@moonfee.com"
echo ""
echo "This action CANNOT be undone!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deletion cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting deletion process..."
echo ""

# Run the Node.js script
node delete-users.js

echo ""
echo "✅ Script execution complete!"
