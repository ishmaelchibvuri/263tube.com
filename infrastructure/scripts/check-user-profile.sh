#!/bin/bash
# Check user profile data that goes into PayFast signature

echo "════════════════════════════════════════════════════════════"
echo "   User Profile Data Check"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Enter the userId (or email) to check:"
read USER_ID

echo ""
echo "Fetching user profile from DynamoDB..."
echo ""

# Query DynamoDB for user profile
aws dynamodb query \
  --table-name exam-platform-data-dev \
  --index-name GSI1 \
  --key-condition-expression "GSI1PK = :gsi1pk" \
  --expression-attribute-values "{\":gsi1pk\":{\"S\":\"USER#${USER_ID}\"}}" \
  --region af-south-1 \
  --output json | jq -r '
    .Items[] |
    select(.SK.S | startswith("PROFILE#")) |
    {
      userId: .PK.S,
      firstName: .firstName.S // "MISSING",
      lastName: .lastName.S // "MISSING",
      email: .email.S // "MISSING",
      tier: .tier.S // "MISSING"
    }
  '

echo ""
echo "════════════════════════════════════════════════════════════"
echo "WHAT TO CHECK:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. firstName and lastName must NOT be 'MISSING' or empty"
echo "2. email must be valid and NOT 'MISSING'"
echo "3. Special characters in names can affect signature"
echo "4. Spaces are OK, but encoded as %20 in signature"
echo ""
echo "If any field is MISSING, the signature will be incorrect!"
echo ""
