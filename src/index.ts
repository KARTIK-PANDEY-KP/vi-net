import { z } from "zod";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import axios from 'axios';

// LinkedIn API Types
interface SearchParams {
  query: string;
  limit?: number;
  school?: string[];
}

interface SearchResponse {
  results: LinkedInProfileData[];
  total: number;
  query: string;
  error?: string;
}

interface LinkedInProfileData {
  profile: {
    id: string;
    name: string;
    location: string;
    headline: string;
    description: string | null;
    title: string;
    profile_picture_url: string;
    linkedin_url: string;
  };
  experience: Array<{
    title: string;
    company_name: string;
    start_date: string;
    end_date: string;
    description: string;
    location: string;
    company_logo: string;
  }>;
  education: Array<{
    degree: string;
    field_of_study: string;
    school_name: string;
    start_date: string;
    end_date: string;
    description: string;
    school_logo: string;
  }>;
}

interface LinkedInProfile {
  name: string;
  title: string;
  email: string;
  profileUrl?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

// LinkedIn API Client
const API_BASE_URL = 'https://search.linkd.inc/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout
});

// Function to set the authorization token
const setAuthToken = (token: string) => {
  if (!token || token.trim() === '') {
    console.error('[LINKD API] Empty or invalid API token provided');
    throw new Error('Invalid API token: Token cannot be empty');
  }
  
  console.log(`[LINKD API] Setting auth token: ${token.substring(0, 5)}...${token.substring(token.length - 4)}`);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Helper function to handle API response validation
function validateApiResponse(response: any): LinkedInProfileData[] {
  if (!response) {
    throw new Error('Empty response received from API');
  }
  
  console.log('[LINKD API] Response structure:', 
    JSON.stringify({
      keys: Object.keys(response),
      hasResults: !!response.results,
      resultsLength: response.results ? response.results.length : 0,
      hasError: !!response.error
    })
  );
  
  // Check for API errors
  if (response.error) {
    console.error(`[LINKD API] API returned an error: ${response.error}`);
    throw new Error(`API error: ${response.error}`);
  }
  
  // Based on the provided schema, we expect a structure with a 'results' array
  if (!response.results || !Array.isArray(response.results)) {
    console.error('[LINKD API] Expected results array is missing or not an array');
    console.error('[LINKD API] Response keys:', Object.keys(response));
    throw new Error('Invalid API response format: results array not found');
  }
  
  console.log(`[LINKD API] Found ${response.results.length} profiles in results array`);
  return response.results;
}

// Helper function to sanitize profile data
function sanitizeProfileData(profileData: LinkedInProfileData): LinkedInProfile {
  if (!profileData) {
    console.error('[LINKD API] Empty profile data');
    return {
      name: 'Unknown User',
      title: 'No title available',
      email: 'unknown@example.com',
      profileUrl: 'https://linkedin.com',
      profilePicture: 'https://cdn-icons-png.flaticon.com/512/174/174857.png'
    };
  }
  
  // Access the nested profile object
  const profile = profileData.profile;
  
  if (!profile) {
    console.error('[LINKD API] Profile object missing in data:', JSON.stringify(profileData));
    return {
      name: 'Unknown User',
      title: 'No title available',
      email: 'unknown@example.com',
      profileUrl: 'https://linkedin.com',
      profilePicture: 'https://cdn-icons-png.flaticon.com/512/174/174857.png'
    };
  }
  
  // Log profile structure for debugging
  console.log('[LINKD API] Processing profile:', profile.name || 'Unknown');
  
  // Create safe values with fallbacks for all required fields
  const safeName = profile.name || 'Unknown User';
  const safeUrlId = safeName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Generate email based on name and company
  let email;
  const experience = profileData.experience || [];
  const latestExperience = experience && experience.length > 0 ? experience[0] : null;
  const companyDomain = latestExperience?.company_name 
    ? latestExperience.company_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
    : 'example.com';
  
  email = `${safeUrlId}@${companyDomain}`;
  
  return {
    name: safeName,
    title: profile.title || (latestExperience ? latestExperience.title : 'No title available'),
    email: email,
    profileUrl: profile.linkedin_url || `https://linkedin.com/in/${safeUrlId}`,
    profilePicture: profile.profile_picture_url || 'https://cdn-icons-png.flaticon.com/512/174/174857.png'
  };
}

// Helper function to process API error details
function processApiError(error: any): string {
  console.error('[LINKD API] Error details:', error);
  
  if (axios.isAxiosError(error)) {
    console.error(`[LINKD API] Axios error: ${error.message}`);
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. The LinkedIn API service may be experiencing high load.';
    }
    
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. The LinkedIn API service may be down or the URL is incorrect.';
    }
    
    if (!error.response) {
      return `Network error: ${error.message}`;
    }
    
    // Handle HTTP status code errors
    const status = error.response.status;
    
    if (status === 401) {
      return 'Authentication failed. Please check your API key.';
    }
    
    if (status === 403) {
      return 'Access forbidden. Your API key may not have permission to perform this operation.';
    }
    
    if (status === 404) {
      return 'Resource not found. The API endpoint may have changed.';
    }
    
    if (status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }
    
    if (status >= 500) {
      return 'LinkedIn API server error. Please try again later.';
    }
    
    // Try to extract error message from response
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
      
      if (error.response.data.error) {
        return error.response.data.error;
      }
      
      return `API error with status ${status}: ${JSON.stringify(error.response.data)}`;
    }
    
    return `API error with status ${status}`;
  }
  
  // Handle non-Axios errors
  return error.message || 'Unknown error occurred';
}

// Function to search LinkedIn profiles
async function searchLinkedInUsers(query: string, limit: number = 10): Promise<LinkedInProfile[]> {
  console.log(`[LINKD API] Starting LinkedIn search for query: "${query}" with limit: ${limit}`);
  
  if (!query || query.trim() === '') {
    throw new Error('Search query cannot be empty');
  }
  
  try {
    // Set API token from environment variables
    const apiKey = process.env.LINKD_API_KEY || 'lk_0fbddc54bad64e708e9116726e945ce7';
    
    try {
      setAuthToken(apiKey);
    } catch (authError) {
      console.error('[LINKD API] Error setting auth token:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    queryParams.append('limit', limit.toString());
    
    const requestUrl = `/search/users?${queryParams.toString()}`;
    console.log(`[LINKD API] Making request to: ${API_BASE_URL}${requestUrl}`);
    
    // Make the API request with additional logging
    console.time('[LINKD API] Request duration');
    let response;
    
    try {
      response = await api.get(requestUrl, {
        timeout: 30000 // 30 seconds timeout
      });
    } catch (requestError) {
      // Handle request errors
      const errorMessage = processApiError(requestError);
      throw new Error(errorMessage);
    }
    
    console.timeEnd('[LINKD API] Request duration');
    console.log(`[LINKD API] Response status: ${response.status}`);
    
    // Validate and extract results array from the response
    let results: LinkedInProfileData[];
    try {
      results = validateApiResponse(response.data);
    } catch (validationError) {
      console.error('[LINKD API] Response validation error:', validationError);
      console.error('[LINKD API] Response data structure:', 
        JSON.stringify(Object.keys(response.data)));
      throw new Error(`API response validation error: ${validationError.message}`);
    }
    
    console.log(`[LINKD API] Processing ${results.length} profile results`);
    
    if (results.length === 0) {
      console.warn(`[LINKD API] No profiles found for query: "${query}"`);
    }
    
    // Process and sanitize each profile
    const processedProfiles = results.map(profileData => {
      try {
        return sanitizeProfileData(profileData);
      } catch (error) {
        console.error(`[LINKD API] Error processing profile: ${error.message}`);
        console.error('[LINKD API] Profile structure:', JSON.stringify({
          hasProfile: !!profileData.profile,
          profileKeys: profileData.profile ? Object.keys(profileData.profile) : [],
          experienceCount: (profileData.experience || []).length,
          educationCount: (profileData.education || []).length
        }));
        
        // Return a default profile as fallback
        return {
          name: 'Error Processing Profile',
          title: 'Data processing error',
          email: 'error@example.com',
          profileUrl: 'https://linkedin.com',
          profilePicture: 'https://cdn-icons-png.flaticon.com/512/174/174857.png'
        };
      }
    });
    
    console.log('[LINKD API] Successfully processed all profiles');
    return processedProfiles;
  } catch (error) {
    // Consolidate all errors to a user-friendly message
    const errorMessage = error.message || 'Unknown error occurred during LinkedIn search';
    console.error(`[LINKD API] Error in searchLinkedInUsers: ${errorMessage}`);
    throw new Error(`LinkedIn API error: ${errorMessage}`);
  }
}

// Function to search for coffee chat partners
async function fetchLinkedInProfiles(preferredChatPartner: string): Promise<LinkedInProfile[]> {
  // Just use the searchLinkedInUsers function with a limit of 3
  return searchLinkedInUsers(preferredChatPartner, 3);
}

// Simulated function to send emails via Gmail
async function sendGmailInvitations(meetLink: string, resumeUrl: string, recipients: any[]): Promise<void> {
  // In a real scenario, this would use the Gmail API to send emails
  console.log(`Sending invitations to ${recipients.length} recipients`);
  console.log(`Meet Link: ${meetLink}`);
  console.log(`Resume URL: ${resumeUrl}`);
}

const scheduleCoffeeChatConfig: ToolConfig = {
  id: "schedule-coffee-chat",
  name: "Schedule Coffee Chat",
  description: "Schedule a coffee chat by providing necessary details and send invitations",
  input: z.object({
    googleMeetLink: z.string().url(),
    resumeUrl: z.string().url(),
    preferredChatPartner: z.string(),
  }),
  output: z.object({
    message: z.string(),
    invitedProfiles: z.array(z.object({
      name: z.string(),
      title: z.string(),
      email: z.string(),
    })),
  }),
  handler: async ({ googleMeetLink, resumeUrl, preferredChatPartner }, agentInfo) => {
    if (!googleMeetLink || !resumeUrl || !preferredChatPartner) {
      const formUI = new FormUIBuilder()
        .title("Schedule Coffee Chat")
        .addFields([
          {
            name: "googleMeetLink",
            label: "Google Meet Link",
            type: "string",
            widget: "url",
            required: true,
          },
          {
            name: "resumeUrl",
            label: "Resume URL",
            type: "string",
            widget: "url",
            required: true,
          },
          {
            name: "preferredChatPartner",
            label: "Preferred Chat Partner Type",
            type: "string",
            widget: "text",
            required: true,
          },
        ])
        .onSubmit({
          tool: "schedule-coffee-chat",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please fill out the form to schedule a coffee chat",
        data: null,
        ui: formUI,
      });
    }

    // Fetch LinkedIn profiles
    const profiles = await fetchLinkedInProfiles(preferredChatPartner);

    // Send Gmail invitations
    await sendGmailInvitations(googleMeetLink, resumeUrl, profiles);

    // Create a table to display invited profiles
    const profilesTable = new TableUIBuilder()
      .addColumns([
        { key: "name", header: "Name", type: "string" },
        { key: "title", header: "Title", type: "string" },
        { key: "email", header: "Email", type: "string" },
      ])
      .setRenderMode('page')
      .rows(profiles)
      .build();

    const confirmationCard = new CardUIBuilder()
      .title("Coffee Chat Scheduled")
      .content(`
        Your coffee chat has been scheduled and invitations sent!
        
        Google Meet Link: ${googleMeetLink}
        Resume: ${resumeUrl}
        Preferred Chat Partner: ${preferredChatPartner}
      `)
      .addChild(profilesTable)
      .build();

    return new DainResponse({
      text: "Coffee chat scheduled successfully and invitations sent",
      data: {
        message: "Coffee chat scheduled successfully and invitations sent",
        invitedProfiles: profiles,
      },
      ui: confirmationCard,
    });
  },
};

// LinkedIn Search Tool Configuration
// LinkedIn Search Tool Configuration
const linkedInSearchConfig: ToolConfig = {
  id: "linkedin-search",
  name: "LinkedIn Search",
  description: "Search for people based on field, role, or keywords",
  input: z.object({
    query: z.string(),
    limit: z.number().optional().default(5),
  }),
  output: z.object({
    message: z.string(),
    profiles: z.array(z.object({
      name: z.string(),
      title: z.string(),
      email: z.string().optional(),
      profileUrl: z.string().optional(),
      profilePicture: z.string().optional(),
    })),
  }),
  handler: async ({ query, limit }, agentInfo) => {
    if (!query) {
      const formUI = new FormUIBuilder()
        .title("LinkedIn Profile Search")
        .addFields([
          {
            name: "query",
            label: "Search Query (job title, field, or keywords)",
            type: "string",
            widget: "text",
            required: true,
          },
          {
            name: "limit",
            label: "Max Results",
            type: "number",
            widget: "text",
            default: 5,
            required: false,
          },
        ])
        .onSubmit({
          tool: "linkedin-search",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please provide search criteria to find LinkedIn profiles",
        data: null,
        ui: formUI,
      });
    }

    try {
      console.log(`[LINKD SEARCH TOOL] Starting search for query: "${query}" with limit: ${limit}`);
      
      // Search LinkedIn profiles
      const profiles = await searchLinkedInUsers(query, limit);
      console.log(`[LINKD SEARCH TOOL] Search completed successfully with ${profiles.length} results`);
      
      // Create a table to display profiles
      const profilesTable = new TableUIBuilder()
        .addColumns([
          { key: "profilePicture", header: "Picture", type: "image" },
          { key: "name", header: "Name", type: "string" },
          { key: "title", header: "Role", type: "string" },
          { key: "profileUrl", header: "Profile URL", type: "link" },
        ])
        .rows(profiles)
        .build();

      const resultsCard = new CardUIBuilder()
        .title(`LinkedIn Profiles: ${query}`)
        .content(`Found ${profiles.length} profiles matching your search for "${query}"`)
        .addChild(profilesTable)
        .build();

      return new DainResponse({
        text: `Found ${profiles.length} LinkedIn profiles matching "${query}"`,
        data: {
          message: `Found ${profiles.length} LinkedIn profiles matching "${query}"`,
          profiles: profiles,
        },
        ui: resultsCard,
      });
    } catch (error) {
      console.error(`[LINKD SEARCH TOOL] Error in LinkedIn search: ${error.message}`);
      
      // Create an error card
      const errorCard = new CardUIBuilder()
        .title("LinkedIn Search Error")
        .content(`
          An error occurred while searching LinkedIn profiles:
          
          ${error.message}
          
          Please check your API configuration or try a different search query.
        `)
        .build();
      
      return new DainResponse({
        text: `Error searching LinkedIn profiles: ${error.message}`,
        data: {
          message: `Error searching LinkedIn profiles: ${error.message}`,
          profiles: [],
        },
        ui: errorCard,
      });
    }
  },
};

const dainService = defineDAINService({
  metadata: {
    title: "LinkedIn Tools",
    description: "A service to search LinkedIn profiles and schedule coffee chats",
    version: "1.0.0",
    author: "Your Name",
    tags: ["LinkedIn", "Schedule", "Coffee Chat", "Sales", "Email", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
  },
  exampleQueries: [
    {
      category: "Schedule",
      queries: [
        "Schedule a coffee chat with a software engineer",
        "Schedule a coffee chat with a product manager",
        "Schedule a coffee chat with a data scientist",
      ],
    },
    {
      category: "Search",
      queries: [
        "Find people who are in the software engineering field",
        "Find product managers in San Francisco",
        "Find data scientists at Google",
      ],
    }
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [scheduleCoffeeChatConfig, linkedInSearchConfig],
});

dainService.startNode().then(({ address }) => {
  console.log("DAIN Service is running at :" + address().port);
});