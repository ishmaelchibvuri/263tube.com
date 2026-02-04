import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, StatementEffect } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;
const REGION = process.env.AWS_REGION || 'af-south-1';

// Initialize JWKS client
const client = jwksClient({
  jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
}

function generatePolicy(principalId: string, effect: StatementEffect, resource: string): APIGatewayAuthorizerResult {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  return authResponse;
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Authorizer event:', JSON.stringify(event, null, 2));

  const token = event.authorizationToken;

  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }

  // Remove 'Bearer ' prefix if present
  const cleanToken = token.replace('Bearer ', '');

  try {
    // Verify JWT token
    // Note: Access tokens and ID tokens have different audience claims:
    // - ID tokens: aud = client_id
    // - Access tokens: aud is not set, but client_id claim exists
    // We verify without audience check first, then validate manually
    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(
        cleanToken,
        getKey,
        {
          issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
          // Don't validate audience here - we'll do it manually below
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });

    // Validate audience/client_id based on token type
    const tokenUse = decoded.token_use;
    if (tokenUse === 'id') {
      // ID token: check aud claim
      if (decoded.aud !== CLIENT_ID) {
        throw new Error('Invalid audience for ID token');
      }
    } else if (tokenUse === 'access') {
      // Access token: check client_id claim
      if (decoded.client_id !== CLIENT_ID) {
        throw new Error('Invalid client_id for access token');
      }
    } else {
      throw new Error('Unknown token type');
    }

    console.log('Token verified successfully:', JSON.stringify(decoded, null, 2));

    // Extract user ID from token (sub claim is the unique user identifier)
    const userId = decoded.sub || decoded['cognito:username'];

    if (!userId) {
      throw new Error('Unauthorized: No user ID in token');
    }

    // Generate allow policy with wildcard resource to allow all API methods
    // The methodArn format is: arn:aws:execute-api:{region}:{accountId}:{apiId}/{stage}/{method}/{resource}
    // We convert it to: arn:aws:execute-api:{region}:{accountId}:{apiId}/* to allow all methods
    const arnParts = event.methodArn.split('/');
    const apiArn = arnParts.slice(0, 2).join('/') + '/*';
    const policy = generatePolicy(userId, 'Allow', apiArn);

    // Add user context to be available in Lambda functions
    // Note: ID tokens use 'cognito:username', access tokens use 'username'
    policy.context = {
      userId,
      email: decoded.email || '',
      username: decoded['cognito:username'] || decoded.username || userId,
      role: decoded['custom:role'] || 'user',
    };

    return policy;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized: Invalid token');
  }
};
