import { OAuth2Client } from 'google-auth-library';
import { ServiceContext, AgentInfo } from "@dainprotocol/service-sdk";
import * as fs from 'fs';
import * as path from 'path';
import { db, COLLECTIONS, firestoreHelpers } from './firestore';

// Load Google credentials from JSON file
const credentialsPath = path.join(process.cwd(), 'GCP_gmail_api_credentials.json');
let credentials: any;

try {
  const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
  credentials = JSON.parse(credentialsFile);
} catch (error) {
  console.error('[AUTH] Error loading Google credentials:', error);
  throw new Error('Failed to load Google credentials. Please ensure GCP_gmail_api_credentials.json exists in the root directory.');
}

// Create OAuth2 client with credentials from JSON
const oauth2Client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
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

// OAuth tokens context
const oauthTokensContext: ServiceContext = {
  id: "oauthTokens",
  name: "OAuth Tokens",
  description: "User's OAuth tokens for various services",
  getContextData: async (agentInfo: AgentInfo) => {
    const tokenStore = await getContextStore(agentInfo.id);
    if (!tokenStore) {
      return "No OAuth connections are currently set up for this user.";
    }
    
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

// Store data in Firestore
async function setContextStore(agentId: string, data: TokenStore): Promise<void> {
  try {
    await firestoreHelpers.setDocData(COLLECTIONS.OAUTH_TOKENS, agentId, { tokens: data });
    console.log(`[AUTH] Stored OAuth tokens for agent ${agentId} in Firestore`);
  } catch (error) {
    console.error(`[AUTH] Error storing tokens for agent ${agentId}:`, error);
    throw error;
  }
}

// Get data from Firestore
async function getContextStore(agentId: string): Promise<TokenStore | null> {
  try {
    const data = await firestoreHelpers.getDocData(COLLECTIONS.OAUTH_TOKENS, agentId);
    return data?.tokens || null;
  } catch (error) {
    console.error(`[AUTH] Error retrieving tokens for agent ${agentId}:`, error);
    return null;
  }
}

// Store Google OAuth tokens in Firestore
async function storeGoogleTokens(agentId: string, tokens: any): Promise<void> {
  const tokenStore = await getContextStore(agentId) || {};
  tokenStore.google = tokens;
  await setContextStore(agentId, tokenStore);
  console.log(`[AUTH] Successfully stored Google tokens for agent ${agentId}`);
}

// Get Google OAuth tokens from Firestore
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
  
  if (tokens.expiry_date && Date.now() > tokens.expiry_date && tokens.refresh_token) {
    try {
      console.log('[AUTH] Refreshing expired Google token');
      oauth2Client.setCredentials(tokens);
      const response = await oauth2Client.refreshAccessToken();
      const newTokens = response.credentials;
      
      await storeGoogleTokens(agentId, newTokens);
      oauth2Client.setCredentials(newTokens);
    } catch (error) {
      console.error('[AUTH] Error refreshing Google token:', error);
      return null;
    }
  } else {
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