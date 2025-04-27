import { z } from "zod";
import { defineDAINService } from "@dainprotocol/service-sdk";
import express from "express";

// Import OAuth and token context
import { oauthTokensContext, storeGoogleTokens } from './auth-utils';

// Import tool configurations
import { sendEmailConfig } from './gmail-tool';
import { linkedInSearchConfig, scheduleCoffeeChatConfig } from './linkedin-tools';
import { profileEnrichmentConfig } from './profile-enrichment-tool';
import { linkedInProfileDataConfig } from './linkedin-profile-data-tool';
import { getContactVisualizationTool } from './data-tools';
import { emailFinderConfig } from './email-finder-tool';

// Create express app for webhooks
const app = express();
import { onboardingTool, getUserDataTool, updateUserProfileTool } from './onboard';

// DAIN Service Definition
const dainService = defineDAINService({
  metadata: {
    title: "VI Network Service",
    description: "Provides tools for managing and visualizing professional networks",
    version: "1.0.0",
    author: "VI Network",
    tags: ["networking", "contacts", "visualization"]
  },
  exampleQueries: [
    {
      category: "LinkedIn",
      queries: [
        "Find people who are in the software engineering field",
        "Find product managers in San Francisco",
        "Find data scientists at Google",
      ],
    },
    {
      category: "Coffee Chat",
      queries: [
        "Schedule a coffee chat with a software engineer",
        "Schedule a coffee chat with a product manager",
        "Schedule a coffee chat with a data scientist",
      ],
    },
    {
      category: "Email",
      queries: [
        "Send an email to a recruiter",
        "Send an coffee chat invitation to",
        "Send a follow-up email after an interview",
        "Send a thank you email after a coffee chat",
      ],
    },
    {
      category: "Profile Enrichment",
      queries: [
        "Get talking points for professionals at Microsoft",
        "Find personalization details for CTOs in healthcare",
        "Research VPs of Engineering for outreach",
      ],
    },
    {
      category: "Email Finder",
      queries: [
        "Find email address for this LinkedIn profile: https://linkedin.com/in/username",
        "What's the email for https://www.linkedin.com/in/john-doe",
        "Get email from LinkedIn URL",
      ],
    },
    {
      category: "Profile Data",
      queries: [
        "Give me the profile data for https://www.linkedin.com/in/someprofile",
        "Get detailed information about this LinkedIn profile: https://linkedin.com/in/username",
        "What can you tell me about https://www.linkedin.com/in/personname",
        "Can you show me information about this LinkedIn profile:"
      ],
    },
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  // Add all tool configurations
  tools: [
    sendEmailConfig,
    profileEnrichmentConfig,
    linkedInProfileDataConfig,
    linkedInSearchConfig,
    scheduleCoffeeChatConfig,
    profileEnrichmentConfig,
    onboardingTool,
    getUserDataTool,
    updateUserProfileTool,
    getContactVisualizationTool,
    emailFinderConfig
  ],
  // Add context for storing OAuth tokens
  contexts: [
    oauthTokensContext
  ],
  // Configure OAuth for Gmail
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || 'http://localhost:3000',
    providers: {
      google: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
        onSuccess: async (agentId, tokens) => {
          // Store tokens in the context
          await storeGoogleTokens(agentId, tokens);
        }
      }
    }
  }
});

// Start the DAIN service (this will use the port already assigned by the DAIN system)
dainService.startNode().then(({ address }) => {
  const dainPort = address().port;
  console.log(`DAIN LinkedIn & Gmail Service is running at port: ${dainPort}`);
});