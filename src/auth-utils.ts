import { OAuth2Client } from 'google-auth-library';
import { ServiceContext, AgentInfo } from "@dainprotocol/service-sdk";

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI || 'https://your-redirect-uri.com'
);

// Define token types
interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface TokenStore {
  [key: string]: OAuthTokens;
}

// OAuth tokens context - this will store OAuth tokens in the context
// instead of using an in-memory store
const oauthTokensContext: ServiceContext = {
  id: "oauthTokens",
  name: "OAuth Tokens",
  description: "User's OAuth tokens for various services",
  getContextData: async (agentInfo: AgentInfo) => {
    // This function creates context data for the assistant
    // We don't want to expose actual tokens to the assistant
    // Just provide information about what's connected
    
    const tokenStore = await getContextStore(agentInfo.id);
    if (!tokenStore) {
      return "No OAuth connections are currently set up for this user.";
    }
    
    // Create a safe representation of what's connected
    const connectedServices = [];
    if (tokenStore.google) {
      const expiryDate = new Date(tokenStore.google.expiry_date);
      const isValid = Date.now() < tokenStore.google.expiry_date;
      connectedServices.push(`Google (Gmail): Connected, token ${isValid ? 'valid' : 'expired'}, expires ${expiryDate.toISOString()}`);
    }
    
    if (connectedServices.length === 0) {
      return "No OAuth connections are currently set up for this user.";
    }
    
    return `
User has the following OAuth connections:
${connectedServices.join('\n')}
    `.trim();
  }
};

// Context storage and retrieval functions
// In a production app, these would use a database
let contextStoreData: { [agentId: string]: { [contextId: string]: any } } = {};

// Store data in context
async function setContextStore(agentId: string, data: TokenStore): Promise<void> {
  if (!contextStoreData[agentId]) {
    contextStoreData[agentId] = {};
  }
  contextStoreData[agentId].oauthTokens = data;
  
  // For production, this would be saved to a database
  console.log(`[AUTH] Stored OAuth tokens for agent ${agentId}`);
}

// Get data from context
async function getContextStore(agentId: string): Promise<TokenStore | null> {
  if (!contextStoreData[agentId] || !contextStoreData[agentId].oauthTokens) {
    return null;
  }
  return contextStoreData[agentId].oauthTokens;
}

// Store Google OAuth tokens in context
async function storeGoogleTokens(agentId: string, tokens: any): Promise<void> {
  const tokenStore = await getContextStore(agentId) || {};
  tokenStore.google = tokens;
  await setContextStore(agentId, tokenStore);
  console.log(`[AUTH] Successfully stored Google tokens for agent ${agentId}`);
}

// Get Google OAuth tokens from context
async function getGoogleTokens(agentId: string): Promise<OAuthTokens | null> {
  const tokenStore = await getContextStore(agentId);
  if (!tokenStore || !tokenStore.google) {
    return null;
  }
  return tokenStore.google;
}

// Check if tokens are valid and refresh if needed
async function getValidGoogleClient(agentId: string): Promise<OAuth2Client | null> {
  const tokens = await getGoogleTokens(agentId);
  if (!tokens) {
    console.error('[AUTH] No Google tokens found for user');
    return null;
  }
  
  // Check if tokens are expired and need refreshing
  if (tokens.expiry_date && Date.now() > tokens.expiry_date && tokens.refresh_token) {
    try {
      console.log('[AUTH] Refreshing expired Google token');
      oauth2Client.setCredentials(tokens);
      const response = await oauth2Client.refreshAccessToken();
      const newTokens = response.credentials;
      
      // Store the refreshed tokens
      await storeGoogleTokens(agentId, newTokens);
      oauth2Client.setCredentials(newTokens);
    } catch (error) {
      console.error('[AUTH] Error refreshing Google token:', error);
      return null;
    }
  } else {
    // Set the existing tokens
    oauth2Client.setCredentials(tokens);
  }
  
  return oauth2Client;
}

export {
  oauth2Client,
  oauthTokensContext,
  storeGoogleTokens,
  getGoogleTokens,
  getValidGoogleClient
};