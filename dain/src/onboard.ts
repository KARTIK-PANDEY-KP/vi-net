import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { firestoreHelpers, UserData } from "./firestore";
import { enforceOnboarding } from "./utils";

// Define output schemas
const getUserDataOutputSchema = z.object({
  name: z.string(),
  age: z.number(),
  resumeUrl: z.string().url(),
  goals: z.string(),
});

const updateUserProfileOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Get User Data tool
export const getUserDataTool: ToolConfig = {
  id: "get-user-data",
  name: "Get User Data",
  description: "Retrieves user's profile data (requires onboarding)",
  input: z.object({}),
  output: getUserDataOutputSchema,
  handler: enforceOnboarding(async (input, agentInfo, context) => {
    try {
      const userData = await firestoreHelpers.getUserData(agentInfo.id);
      if (!userData) {
        throw new Error("User data not found");
      }
      return {
        text: "Retrieved user data",
        data: {
          name: userData.name,
          age: userData.age,
          resumeUrl: userData.resumeUrl,
          goals: userData.goals
        },
        ui: {
          type: "info",
          content: "Here's your profile information"
        }
      };
    } catch (error) {
      console.error('[USER DATA] Error retrieving user data:', error);
      return {
        text: "Error retrieving user data",
        data: null,
        ui: {
          type: "error",
          content: "Failed to retrieve user data. Please try again."
        }
      };
    }
  }, getUserDataOutputSchema)
};

// Onboarding tool
export const onboardingTool: ToolConfig = {
  id: "onboard-user",
  name: "Onboard User",
  description: "Onboards a new user to the service. Collects user's resume, goals, and basic information.",
  input: z.object({
    name: z.string().describe("Your full name"),
    age: z.number().min(18).describe("Your age"),
    resumeUrl: z.string().url().describe("Resume Upload - Use the file feature"),
    goals: z.string().min(50).describe("Brief description of your career goals")
  }),
  output: updateUserProfileOutputSchema,
  handler: async (input, agentInfo, context) => {
    const userId = agentInfo.id;
    
    try {
      // Check if user is already onboarded
      const isOnboarded = await firestoreHelpers.isUserOnboarded(userId);
      if (isOnboarded) {
        return {
          text: "User already onboarded",
          data: {
            success: false,
            message: "You have already been onboarded.",
          },
          ui: {
            type: "warning",
            content: "You have already completed onboarding."
          }
        };
      }

      // Create user data
      const userData: Partial<UserData> = {
        name: input.name,
        age: input.age,
        resumeUrl: input.resumeUrl,
        goals: input.goals,
        onboarded: true
      };

      // Store in Firestore
      await firestoreHelpers.setUserData(userId, userData);

      return {
        text: "User successfully onboarded",
        data: {
          success: true,
          message: "Welcome! You've been successfully onboarded. You can now use all features of the service.",
        },
        ui: {
          type: "success",
          content: "You've been successfully onboarded!"
        }
      };
    } catch (error) {
      console.error('[ONBOARDING] Error during onboarding:', error);
      return {
        text: "Error during onboarding",
        data: {
          success: false,
          message: "An error occurred during onboarding. Please try again.",
        },
        ui: {
          type: "error",
          content: "Failed to complete onboarding. Please try again."
        }
      };
    }
  }
};

// Update User Profile tool
export const updateUserProfileTool: ToolConfig = {
  id: "update-user-profile",
  name: "Update User Profile",
  description: "Updates user's profile information (requires onboarding)",
  input: z.object({
    name: z.string().optional(),
    age: z.number().min(18).optional(),
    resumeUrl: z.string().url().optional(),
    goals: z.string().min(50).optional(),
  }),
  output: updateUserProfileOutputSchema,
  handler: enforceOnboarding(async (input, agentInfo, context) => {
    try {
      const userId = agentInfo.id;
      await firestoreHelpers.setUserData(userId, input);
      return {
        text: "Profile updated successfully",
        data: {
          success: true,
          message: "Your profile has been updated successfully.",
        },
        ui: {
          type: "success",
          content: "Your profile has been updated!"
        }
      };
    } catch (error) {
      console.error('[PROFILE UPDATE] Error updating profile:', error);
      return {
        text: "Error updating profile",
        data: {
          success: false,
          message: "Failed to update profile. Please try again.",
        },
        ui: {
          type: "error",
          content: "Failed to update profile. Please try again."
        }
      };
    }
  }, updateUserProfileOutputSchema)
};

