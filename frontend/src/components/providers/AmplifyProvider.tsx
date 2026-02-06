"use client";

// Import aws-config to trigger Amplify.configure() at module level
import "@/lib/aws-config";

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
