# User Deletion Script

This script completely removes user accounts from both DynamoDB and AWS Cognito.

## ⚠️ WARNING

**This script permanently deletes user data and CANNOT be undone!**

It will delete:
- User profile from DynamoDB
- All exam attempts and history
- User statistics
- Purchases and subscriptions
- Verification codes
- All other user-related data
- User account from AWS Cognito

## Users to be Deleted

The script is configured to delete these accounts:
- `support@activewave.co.za`
- `iverson.eulises@moonfee.com`

## Prerequisites

1. AWS credentials configured (via AWS CLI or environment variables)
2. Environment variables set in `backend/.env`:
   ```env
   TABLE_NAME=exam-platform-data
   USER_POOL_ID=your-cognito-user-pool-id
   AWS_REGION=your-aws-region
   ```

## How to Run

### Option 1: Windows (Batch File)

```bash
cd backend/scripts
run-delete-users.bat
```

### Option 2: Linux/Mac (Shell Script)

```bash
cd backend/scripts
chmod +x run-delete-users.sh
./run-delete-users.sh
```

### Option 3: Direct Node Execution

```bash
cd backend/scripts
node delete-users.js
```

## What the Script Does

1. **Looks up each user by email** in DynamoDB
2. **Queries all data** associated with the user ID
3. **Displays a breakdown** of what will be deleted (attempts, stats, etc.)
4. **Deletes all items** from DynamoDB in batches
5. **Deletes the user** from AWS Cognito
6. **Confirms completion** for each user

## Script Output

The script provides detailed logging:
- 🔍 Looking up users
- 📦 Fetching user data
- 📊 Breakdown of items by type
- 🗑️ Deletion progress
- ✅ Confirmation of completion

## Safety Features

- **Confirmation prompt** before deletion
- **Detailed logging** of all operations
- **Graceful error handling** if user not found
- **Batch processing** to handle large datasets
- **Separate Cognito check** even if user not in database

## Modifying the Script

To delete different users, edit the `USERS_TO_DELETE` array in `delete-users.js`:

```javascript
const USERS_TO_DELETE = [
  "user1@example.com",
  "user2@example.com",
];
```

## Troubleshooting

**Error: "User not found in database"**
- The user doesn't exist in DynamoDB
- Script will still check Cognito

**Error: "No USER_POOL_ID set"**
- Add `USER_POOL_ID` to your `.env` file
- Or accept to skip Cognito deletion

**Error: "Access Denied"**
- Ensure your AWS credentials have the required permissions:
  - `dynamodb:Query`
  - `dynamodb:BatchWriteItem`
  - `cognito-idp:AdminDeleteUser`

## Verification

After running the script, verify deletion:

1. **Check DynamoDB:**
   ```bash
   aws dynamodb query \
     --table-name exam-platform-data \
     --index-name GSI1 \
     --key-condition-expression "GSI1PK = :pk AND GSI1SK = :sk" \
     --expression-attribute-values '{":pk":{"S":"USER"},":sk":{"S":"email@example.com"}}'
   ```

2. **Check Cognito:**
   ```bash
   aws cognito-idp admin-get-user \
     --user-pool-id your-pool-id \
     --username email@example.com
   ```

Both should return "not found" errors.
