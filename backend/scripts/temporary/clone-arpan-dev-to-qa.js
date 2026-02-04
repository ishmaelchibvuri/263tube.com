"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
// Environment configurations
const DEV_CONFIG = {
    tableName: "exam-platform-data-dev",
    userPoolId: "af-south-1_DujUfW9wf",
};
const QA_CONFIG = {
    tableName: "exam-platform-data-qa",
    userPoolId: "af-south-1_fcKpAgQe3",
};
// User to clone and their password
const USER_EMAIL = "arpan.maxi@moonfee.com";
const NEW_PASSWORD = "e%lqUZ@HBc1ETGVw*E@y";
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: "af-south-1" });
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
    region: "af-south-1",
});
async function getUserByEmail(email, tableName) {
    const command = new client_dynamodb_1.QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues: {
            ":pk": { S: "USER" },
            ":sk": { S: email },
        },
    });
    const response = await dynamoClient.send(command);
    if (!response.Items || response.Items.length === 0)
        return null;
    return (0, util_dynamodb_1.unmarshall)(response.Items[0]);
}
async function getUserItems(userId, tableName) {
    const items = [];
    let lastEvaluatedKey = undefined;
    do {
        const command = new client_dynamodb_1.QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": { S: `USER#${userId}` },
            },
            ExclusiveStartKey: lastEvaluatedKey,
        });
        const response = await dynamoClient.send(command);
        if (response.Items && response.Items.length > 0) {
            items.push(...response.Items.map((item) => (0, util_dynamodb_1.unmarshall)(item)));
        }
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return items;
}
async function getCognitoUserAttributes(email, userPoolId) {
    try {
        const command = new client_cognito_identity_provider_1.AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: email,
        });
        const response = await cognitoClient.send(command);
        if (!response.UserAttributes)
            return null;
        const attrs = { email };
        for (const attr of response.UserAttributes) {
            if (attr.Name === "given_name")
                attrs.givenName = attr.Value;
            else if (attr.Name === "family_name")
                attrs.familyName = attr.Value;
            else if (attr.Name === "email")
                attrs.email = attr.Value || email;
            else if (attr.Name === "custom:role")
                attrs["custom:role"] = attr.Value;
            else if (attr.Name === "custom:showOnLeaderboard")
                attrs["custom:showOnLeaderboard"] = attr.Value;
        }
        return attrs;
    }
    catch (error) {
        if (error.name === "UserNotFoundException")
            return null;
        throw error;
    }
}
async function writeItemsBatch(items, tableName) {
    if (items.length === 0)
        return 0;
    const BATCH_SIZE = 25;
    let count = 0;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const putRequests = batch.map((item) => ({
            PutRequest: { Item: (0, util_dynamodb_1.marshall)(item, { removeUndefinedValues: true }) },
        }));
        await dynamoClient.send(new client_dynamodb_1.BatchWriteItemCommand({ RequestItems: { [tableName]: putRequests } }));
        count += batch.length;
    }
    return count;
}
async function createCognitoUser(attributes, userPoolId) {
    const userAttributes = [
        { Name: "email", Value: attributes.email },
        { Name: "email_verified", Value: "true" },
    ];
    if (attributes.givenName)
        userAttributes.push({ Name: "given_name", Value: attributes.givenName });
    if (attributes.familyName)
        userAttributes.push({ Name: "family_name", Value: attributes.familyName });
    if (attributes["custom:role"])
        userAttributes.push({ Name: "custom:role", Value: attributes["custom:role"] });
    if (attributes["custom:showOnLeaderboard"])
        userAttributes.push({
            Name: "custom:showOnLeaderboard",
            Value: attributes["custom:showOnLeaderboard"],
        });
    await cognitoClient.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: attributes.email,
        UserAttributes: userAttributes,
        MessageAction: client_cognito_identity_provider_1.MessageActionType.SUPPRESS,
        TemporaryPassword: NEW_PASSWORD,
    }));
    await cognitoClient.send(new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: attributes.email,
        Password: NEW_PASSWORD,
        Permanent: true,
    }));
}
async function main() {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`   CLONE ${USER_EMAIL} FROM DEV TO QA`);
    console.log(`${"=".repeat(70)}\n`);
    // Get user from DEV
    console.log(`Fetching from DEV...`);
    const user = await getUserByEmail(USER_EMAIL, DEV_CONFIG.tableName);
    if (!user) {
        console.log(`ERROR: User not found in DEV database`);
        process.exit(1);
    }
    const items = await getUserItems(user.userId, DEV_CONFIG.tableName);
    const cognitoAttrs = await getCognitoUserAttributes(USER_EMAIL, DEV_CONFIG.userPoolId);
    console.log(`Found ${items.length} DynamoDB items`);
    console.log(`Cognito user: ${cognitoAttrs ? "Yes" : "No"}`);
    // Log item types
    const itemTypes = items.reduce((acc, item) => {
        const type = item.entityType || item.SK?.split("#")[0] || "UNKNOWN";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    console.log(`Item breakdown:`);
    Object.entries(itemTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
    });
    // Clone to QA
    console.log(`\nCloning to QA...`);
    const itemsCloned = await writeItemsBatch(items, QA_CONFIG.tableName);
    console.log(`   DynamoDB items cloned: ${itemsCloned}`);
    if (cognitoAttrs) {
        console.log(`   Creating Cognito user with password: ${NEW_PASSWORD}`);
        await createCognitoUser(cognitoAttrs, QA_CONFIG.userPoolId);
        console.log(`   Cognito user created successfully`);
    }
    console.log(`\n${"=".repeat(70)}`);
    console.log(`   CLONE COMPLETE`);
    console.log(`${"=".repeat(70)}`);
    console.log(`\n   User: ${USER_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log(`   DynamoDB items: ${itemsCloned}`);
    console.log(`   Cognito: Created with permanent password\n`);
}
main().catch((error) => {
    console.error("\nFatal error:", error);
    process.exit(1);
});
