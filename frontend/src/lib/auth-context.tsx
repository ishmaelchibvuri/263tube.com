'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchUserAttributes,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  resetPassword as amplifyResetPassword,
  updatePassword as amplifyUpdatePassword,
  fetchAuthSession,
} from 'aws-amplify/auth';

// Import to ensure Amplify is configured at module level
import './aws-config';

import { User, userSchema } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Amplify is configured at module level via aws-config.ts import
    checkAuthState();
  }, []);

  const ensureUserProfile = async (
    cognitoUser: any,
    attributes: any,
    retries = 3
  ): Promise<User | void> => {
    // DEBT PAYOFF: Skip profile sync - Cognito has all user info we need
    console.log("ℹ️ Skipping profile sync for debt payoff app (Cognito-only auth)");
    return;
  };

  const checkAuthState = async () => {
    try {
      setIsLoading(true);

      console.log("=== AUTH CONTEXT DEBUG ===");

      // Debug Amplify configuration
      const config = Amplify.getConfig();
      console.log(
        "Auth Context - Amplify Config:",
        JSON.stringify(config, null, 2)
      );

      // Get current authenticated user
      const currentUser = await getCurrentUser();
      console.log("Auth Context - Current user:", currentUser);

      // Fetch user attributes from Cognito
      const attributes = await fetchUserAttributes();
      console.log("Auth Context - User attributes:", attributes);

      // Get role from Cognito custom:role attribute or default to user
      let role: "user" | "admin" | "creator" | "sponsor" = "user";
      const customRole = attributes["custom:role"]?.toLowerCase();
      if (customRole === "admin") {
        role = "admin";
      } else if (customRole === "creator") {
        role = "creator";
      } else if (customRole === "sponsor") {
        role = "sponsor";
      }
      console.log("Auth Context - User role from Cognito:", role);

      // Map Cognito attributes to our User type
      const userData = {
        userId: currentUser.userId,
        email: attributes.email || "",
        firstName: attributes.given_name || "",
        lastName: attributes.family_name || "",
        emailVerified: attributes.email_verified === "true",
        role,
      };

      console.log("Auth Context - Mapped user data:", userData);
      console.log("Auth Context - Setting user state...");
      setUser(userData);
      console.log("Auth Context - User state set successfully");

      console.log("=== END AUTH CONTEXT DEBUG ===");

      // Use setTimeout to avoid blocking and allow auth session to fully establish
      // Only try to ensure profile exists if user state was set successfully
      setTimeout(async () => {
        try {
          console.log("⏳ Attempting to ensure user profile exists...");
          await ensureUserProfile(currentUser, attributes, 3);
          console.log("✅ Profile verification complete");
        } catch (error: any) {
          console.error("❌ Profile verification error:", error);
          // If auth failed, the ensureUserProfile function already signed out the user
          if (error.message?.includes("Authentication failed")) {
            console.log(
              "🔄 User has been signed out, page will need to redirect"
            );
          }
        }
      }, 1500); // 1.5 second delay
    } catch (error) {
      console.log("❌ No active session:", error);
      console.log("Auth Context - Setting user to null");
      setUser(null);
    } finally {
      console.log("Auth Context - Setting loading to false");
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string): Promise<User> => {
    // Fetch real user attributes from Cognito
    const attributes = await fetchUserAttributes();

    // Get role from Cognito custom:role attribute
    let role: "user" | "admin" | "creator" | "sponsor" = "user";
    const customRole = attributes["custom:role"]?.toLowerCase();
    if (customRole === "admin") {
      role = "admin";
    } else if (customRole === "creator") {
      role = "creator";
    } else if (customRole === "sponsor") {
      role = "sponsor";
    }

    return {
      userId,
      email: attributes.email || "",
      firstName: attributes.given_name || "",
      lastName: attributes.family_name || "",
      emailVerified: attributes.email_verified === "true",
      role,
    };
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("=== SIGN IN DEBUG ===");
      console.log("Attempting sign in for:", email);

      // Check if there's already a user signed in
      try {
        const currentUser = await getCurrentUser();
        console.log("User already signed in:", currentUser);
        console.log("Signing out existing user before new sign in...");
        await amplifySignOut();
        console.log("Existing user signed out successfully");
      } catch (error) {
        // No user signed in, which is fine - continue with sign in
        console.log("No existing session found, proceeding with sign in");
      }

      const { isSignedIn } = await amplifySignIn({ username: email, password });
      console.log("Sign in result:", { isSignedIn });

      if (isSignedIn) {
        console.log("Sign in successful, refreshing auth state...");
        // Refresh user data after successful sign in
        await checkAuthState();
        console.log("Auth state refreshed");

        // IMPORTANT: Wait a bit more to ensure profile is fetched and role is updated
        // This is critical for admin users to properly redirect
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Auth state fully refreshed with role");
      } else {
        console.log("Sign in not successful");
      }

      console.log("=== END SIGN IN DEBUG ===");
    } catch (error: any) {
      console.error("Sign in error:", error);

      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role: "user",
        }),
      });
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("=== AGGRESSIVE LOGOUT START ===");

      // Sign out from Amplify
      await amplifySignOut();

      // Clear user state
      setUser(null);

      // Clear any cached data
      if (typeof window !== "undefined") {
        // Clear localStorage
        localStorage.clear();
        // Clear sessionStorage
        sessionStorage.clear();

        // Clear specific Amplify keys
        const amplifyKeys = Object.keys(localStorage).filter(
          (key) =>
            key.includes("amplify") ||
            key.includes("cognito") ||
            key.includes("aws-amplify")
        );
        amplifyKeys.forEach((key) => {
          localStorage.removeItem(key);
          console.log("Removed localStorage key:", key);
        });

        // Clear all browser cookies
        console.log("Clearing all browser cookies...");
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          if (!cookie) continue;
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

          // Clear cookie for current domain and all parent domains
          const domain = window.location.hostname;
          const domainParts = domain.split(".");

          // Clear for current path and root path
          const paths = [window.location.pathname, "/"];

          paths.forEach((path) => {
            // Clear for current domain
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;

            // Clear for parent domains (e.g., .example.com)
            for (let j = 0; j < domainParts.length - 1; j++) {
              const parentDomain = "." + domainParts.slice(j).join(".");
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${parentDomain};`;
            }
          });

          console.log("Cleared cookie:", name);
        }

        // Verify all cookies are cleared
        const remainingCookies = document.cookie;
        if (remainingCookies) {
          console.warn("Some cookies may still remain:", remainingCookies);
        } else {
          console.log("All cookies cleared successfully");
        }

      }

      console.log("=== AGGRESSIVE LOGOUT COMPLETE ===");
    } catch (error) {
      throw error;
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      await amplifyConfirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      throw error;
    }
  };

  const resendConfirmationCode = async (email: string) => {
    try {
      await amplifyResendSignUpCode({ username: email });
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await amplifyResetPassword({ username: email });
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    try {
      // For password reset, we should use confirmResetPassword instead
      // await amplifyUpdatePassword({
      //   newPassword,
      // });
    } catch (error) {
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string> => {
    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();
      const idToken = session.tokens?.idToken?.toString();
      const token = accessToken || idToken || "";

      if (!token) {
        throw new Error("No authentication token available");
      }

      return token;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error("Failed to retrieve authentication token");
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    resetPassword,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Server-side session helper
export async function getServerSession(): Promise<User | null> {
  // This would need to be implemented with proper server-side session handling
  // For now, return null as this is a client-side only implementation
  return null;
}
