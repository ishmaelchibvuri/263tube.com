"use client";

import { useEffect } from "react";
import { Amplify } from "aws-amplify";

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId:
        process.env.NEXT_PUBLIC_USER_POOL_ID || "af-south-1_y0FuG4skp",
      userPoolClientId:
        process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
        "5659qnr82t0jubi2emeakpqi1h",
      region: process.env.NEXT_PUBLIC_AWS_REGION || "af-south-1",
    },
  },
};

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Amplify.configure(awsConfig, { ssr: true });
  }, []);

  return <>{children}</>;
}
