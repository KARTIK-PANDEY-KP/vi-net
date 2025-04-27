import { z } from "zod";
import { defineDAINService } from "@dainprotocol/service-sdk";
import express from "express";

// Import OAuth and token context
import { oauthTokensContext, storeGoogleTokens } from './auth-utils';

// Import tool configurations
import { sendEmailConfig } from './gmail-tool';
import { linkedInSearchConfig, scheduleCoffeeChatConfig } from './linkedin-tools';
import { profileEnrichmentConfig } from './profile-enrichment-tool';

// Import SignalHire webhook
import { initializeSignalHireWebhook } from './signalhire-webhook';

// Create express app for webhooks
const app = express();

// DAIN Service Definition
const dainService = defineDAINService({
  metadata: {
    title: "LinkedIn & Gmail Tools",
    description: "A service to search LinkedIn profiles, schedule coffee chats, and send emails via Gmail",
    version: "1.0.0",
    author: "Your Name",
    tags: ["LinkedIn", "Gmail", "Schedule", "Coffee Chat", "Sales", "Email", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
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
    }
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  // Add all tool configurations
  tools: [
    linkedInSearchConfig, 
    scheduleCoffeeChatConfig, 
    sendEmailConfig,
    profileEnrichmentConfig
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

// Initialize SignalHire webhook
initializeSignalHireWebhook(app);

// Start the service with both DAIN service and webhook support
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3000');

// Start the express app for webhooks on a different port than the DAIN service
app.listen(WEBHOOK_PORT, () => {
  console.log(`Webhook server is running on port ${WEBHOOK_PORT}`);
});

// Start the DAIN service (this will use the port already assigned by the DAIN system)
dainService.startNode().then(({ address }) => {
  const dainPort = address().port;
  console.log(`DAIN LinkedIn & Gmail Service is running at port: ${dainPort}`);
  
  // Use the TUNNEL_URL if provided, otherwise use localhost with the webhook port
  const baseUrl = process.env.TUNNEL_URL || `http://localhost:${WEBHOOK_PORT}`;
  console.log(`Make sure to set your SignalHire callback URL to: ${baseUrl}/signalhire/callback`);
});