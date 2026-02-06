import { Amplify } from "aws-amplify";

// Debug: Log environment variables (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('🔍 AWS Config Environment Variables Check:');
  console.log('USER_POOL_ID:', process.env.NEXT_PUBLIC_USER_POOL_ID ? '✓ Present' : '✗ MISSING');
  console.log('USER_POOL_CLIENT_ID:', process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ? '✓ Present' : '✗ MISSING');
  console.log('IDENTITY_POOL_ID:', process.env.NEXT_PUBLIC_IDENTITY_POOL_ID ? '✓ Present' : '✗ MISSING');
  console.log('AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION ? '✓ Present' : '✗ MISSING');
}

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'af-south-1',
      loginWith: {
        email: true,
        username: true,
      },
      signUpVerificationMethod: "code" as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
};

// Validate required environment variables
if (typeof window !== 'undefined') {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_USER_POOL_ID) missing.push('NEXT_PUBLIC_USER_POOL_ID');
  if (!process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID) missing.push('NEXT_PUBLIC_USER_POOL_CLIENT_ID');
  if (!process.env.NEXT_PUBLIC_AWS_REGION) missing.push('NEXT_PUBLIC_AWS_REGION');

  if (missing.length > 0) {
    const errorMsg = `
⚠️ MISSING AWS COGNITO ENVIRONMENT VARIABLES ⚠️

The following required environment variables are not set:
${missing.map(v => `  - ${v}`).join('\n')}

SOLUTION:
1. Check that these variables exist in your .env.local file
2. If they exist, RESTART your Next.js dev server:
   - Stop the server (Ctrl+C)
   - Run: npm run dev

3. Verify variables in .env.local:
   NEXT_PUBLIC_USER_POOL_ID=af-south-1_tl53nFXtH
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=26v0nfdfbm36pd4orvd4e5cuip
   NEXT_PUBLIC_IDENTITY_POOL_ID=af-south-1:10f3b94d-4e95-4c16-961f-f794e8610b03
   NEXT_PUBLIC_AWS_REGION=af-south-1
`;
    console.error(errorMsg);

    if (process.env.NODE_ENV !== 'production') {
      // In development, show a helpful alert
      alert(errorMsg.replace(/\n/g, '\n'));
    }
  }
}

// Configure Amplify at module level so it's ready before any component renders
Amplify.configure(awsConfig as any, { ssr: true });

export default awsConfig;
