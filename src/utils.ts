import { ToolConfig } from "@dainprotocol/service-sdk";
import { firestoreHelpers } from "./firestore";
import { z } from "zod";

// Wrapper function to enforce onboarding
export const enforceOnboarding = (toolHandler: ToolConfig['handler'], outputSchema?: z.ZodObject<any>): ToolConfig['handler'] => {
  return async (input, agentInfo, context) => {
    process.stdout.write(`[ENFORCE ONBOARDING] Checking onboarding status for agent: ${agentInfo.id}\n`);
    const isOnboarded = await firestoreHelpers.isUserOnboarded(agentInfo.id);
    process.stdout.write(`[ENFORCE ONBOARDING] Onboarding status: ${isOnboarded}\n`);
    
    if (!isOnboarded) {
      process.stdout.write('[ENFORCE ONBOARDING] User not onboarded, returning message\n');
      
      if (!outputSchema) {
        return {
          text: "Please complete onboarding by typing 'initiate onboarding'",
          data: {},
          ui: null
        };
      }

      // Create a default response that matches the schema
      const defaultResponse = {};
      Object.keys(outputSchema.shape).forEach(key => {
        const field = outputSchema.shape[key];
        if (field instanceof z.ZodArray) {
          defaultResponse[key] = [];
        } else if (field instanceof z.ZodString) {
          defaultResponse[key] = "";
        } else if (field instanceof z.ZodNumber) {
          defaultResponse[key] = 0;
        } else if (field instanceof z.ZodBoolean) {
          defaultResponse[key] = false;
        } else if (field instanceof z.ZodObject) {
          defaultResponse[key] = {};
        } else {
          defaultResponse[key] = null;
        }
      });

      return {
        text: "Please complete onboarding by typing 'initiate onboarding'",
        data: defaultResponse,
        ui: null
      };
    }
    
    process.stdout.write('[ENFORCE ONBOARDING] User is onboarded, proceeding with tool handler\n');
    return toolHandler(input, agentInfo, context);
  };
}; 