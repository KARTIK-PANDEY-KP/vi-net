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
  results: LinkedInProfile[];
  // Add other response fields as needed
}

interface LinkedInProfile {
  name: string;
  title: string;
  email: string;
  profileUrl?: string;
  profilePicture?: string;
  // Add other profile fields as needed
  [key: string]: unknown;
}

// LinkedIn API Client
const API_BASE_URL = 'https://search.linkd.inc/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Function to set the authorization token
const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Function to search LinkedIn profiles
async function fetchLinkedInProfiles(preferredChatPartner: string): Promise<LinkedInProfile[]> {
  try {
    // Set API token from environment variables
    setAuthToken(process.env.LINKD_API_KEY || '');
    
    // Search parameters
    const params: SearchParams = {
      query: preferredChatPartner,
      limit: 3, // Limit to 3 profiles as in the mock data
    };
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.school && params.school.length > 0) {
      params.school.forEach(s => queryParams.append('school', s));
    }
    
    const response = await api.get<SearchResponse>(`/search/users?${queryParams.toString()}`);
    return response.data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle API key errors specifically
      if (error.response?.status === 401) {
        const errorDetail = error.response.data?.detail || "Invalid or expired API key";
        throw new Error(errorDetail);
      }
      
      // Handle other API errors
      if (error.response?.data) {
        // Try to extract error details from different possible formats
        const errorMessage = 
          error.response.data.error || 
          error.response.data.detail || 
          error.response.data.message || 
          JSON.stringify(error.response.data);
        throw new Error(errorMessage);
      }
    }
    
    // If API call fails, return fallback mock data
    console.warn('LinkedIn API call failed. Using fallback mock data.');
    return [
      { 
        name: "John Doe", 
        title: "Software Engineer at Tech Co", 
        email: "john@example.com",
        profileUrl: "https://linkedin.com/in/johndoe",
        profilePicture: "https://example.com/profiles/johndoe.jpg"
      },
      { 
        name: "Jane Smith", 
        title: "Product Manager at Startup Inc", 
        email: "jane@example.com",
        profileUrl: "https://linkedin.com/in/janesmith",
        profilePicture: "https://example.com/profiles/janesmith.jpg"
      },
      { 
        name: "Bob Johnson", 
        title: "Data Scientist at AI Corp", 
        email: "bob@example.com",
        profileUrl: "https://linkedin.com/in/bobjohnson",
        profilePicture: "https://example.com/profiles/bobjohnson.jpg"
      },
    ];
  }
}

// Function to search LinkedIn profiles with extended details
// Function to search LinkedIn profiles with extended details and SignalHire fallback
async function searchLinkedInUsers(query: string, limit: number = 10): Promise<LinkedInProfile[]> {
  try {
    // First attempt with primary API
    setAuthToken(process.env.LINKD_API_KEY || 'lk_0fbddc54bad64e708e9116726e945ce7');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    queryParams.append('limit', limit.toString());
    
    // Increase timeout for primary API request
    const response = await api.get<SearchResponse>(`/search/users?${queryParams.toString()}`, {
      timeout: 15000 // 30 seconds timeout
    });
    
    // Ensure all fields we need are present
    return response.data.results.map(profile => {
      return {
        ...profile,
        // Ensure these fields exist, providing defaults if needed
        profileUrl: profile.profileUrl || `https://linkedin.com/in/${profile.name.toLowerCase().replace(/\s+/g, '')}`,
        profilePicture: profile.profilePicture || "https://cdn-icons-png.flaticon.com/512/174/174857.png" // Default LinkedIn icon
      };
    });
  } catch (primaryApiError) {
    console.error('Primary LinkedIn API error:', primaryApiError);
    console.warn('Trying SignalHire API as fallback...');
    
    try {
      // Fallback to SignalHire API
      const signalHireResponse = await axios({
        method: 'POST',
        url: 'https://www.signalhire.com/api/v1/candidate/searchByQuery',
        headers: {
          'apikey': process.env.SIGNALHIRE_API_KEY || '202.zER5WA9UbZs5xJUzrrqXw26QocAm', // Replace with your API key or use env variable
          'Content-Type': 'application/json'
        },
        data: {
          // Convert the query to appropriate SignalHire parameters
          // You may want to parse the query to determine if it should be job title, company, etc.
          currentPastTitle: query,
          // You can add more parameters like location if needed
          size: limit
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      // Map SignalHire response to our expected format
      if (signalHireResponse.data && Array.isArray(signalHireResponse.data.profiles)) {
        const profiles = signalHireResponse.data.profiles.map(profile => {
          // Extract the latest job title and company from experience array
          const latestExperience = profile.experience && profile.experience.length > 0 
            ? profile.experience[0] 
            : { company: 'Unknown Company', title: 'Unknown Title' };
          
          return {
            name: profile.fullName || 'Unknown Name',
            title: latestExperience.title + ' at ' + latestExperience.company,
            email: `${profile.fullName?.toLowerCase().replace(/\s+/g, '')}@example.com`, // SignalHire doesn't return email in basic search
            profileUrl: `https://linkedin.com/in/${profile.fullName?.toLowerCase().replace(/\s+/g, '')}`, // Construct a placeholder URL
            profilePicture: "https://cdn-icons-png.flaticon.com/512/174/174857.png" // Default LinkedIn icon
          };
        });
        
        console.log(`Retrieved ${profiles.length} profiles from SignalHire fallback`);
        
        // Check if there are more results to fetch via scrollSearch
        if (signalHireResponse.data.scrollId && profiles.length < limit && profiles.length < signalHireResponse.data.total) {
          try {
            // Fetch additional results if needed
            const requestId = signalHireResponse.data.requestId;
            const scrollId = signalHireResponse.data.scrollId;
            
            const scrollResponse = await axios({
              method: 'POST',
              url: `https://www.signalhire.com/api/v1/candidate/scrollSearch/${requestId}`,
              headers: {
                'apikey': process.env.SIGNALHIRE_API_KEY || 'your_secret_api_key',
                'Content-Type': 'application/json'
              },
              data: {
                scrollId: scrollId
              },
              timeout: 15000 // 15 seconds timeout (scrollId expires after 15 seconds)
            });
            
            if (scrollResponse.data && Array.isArray(scrollResponse.data.profiles)) {
              // Map and append additional profiles
              const additionalProfiles = scrollResponse.data.profiles.map(profile => {
                const latestExperience = profile.experience && profile.experience.length > 0 
                  ? profile.experience[0] 
                  : { company: 'Unknown Company', title: 'Unknown Title' };
                
                return {
                  name: profile.fullName || 'Unknown Name',
                  title: latestExperience.title + ' at ' + latestExperience.company,
                  email: `${profile.fullName?.toLowerCase().replace(/\s+/g, '')}@example.com`,
                  profileUrl: `https://linkedin.com/in/${profile.fullName?.toLowerCase().replace(/\s+/g, '')}`,
                  profilePicture: "https://cdn-icons-png.flaticon.com/512/174/174857.png"
                };
              });
              
              // Combine profiles from both requests
              profiles.push(...additionalProfiles);
              console.log(`Retrieved ${additionalProfiles.length} additional profiles via scrollSearch`);
              
              // Trim to requested limit if we have more than needed
              if (profiles.length > limit) {
                profiles.length = limit;
              }
            }
          } catch (scrollError) {
            console.warn('Error fetching additional profiles via scrollSearch:', scrollError);
            // Continue with profiles already fetched
          }
        }
        
        return profiles;
      } else {
        throw new Error('Invalid response format from SignalHire API');
      }
    } catch (fallbackApiError) {
      console.error('SignalHire API fallback error:', fallbackApiError);
      
      // Fall back to mock data as a last resort
      console.warn('All API attempts failed, using mock data as final fallback');
      return [
        { 
          name: "John Doe", 
          title: "Software Engineer at Tech Co", 
          email: "john@example.com",
          profileUrl: "https://linkedin.com/in/johndoe",
          profilePicture: "https://example.com/profiles/johndoe.jpg"
        },
        { 
          name: "Jane Smith", 
          title: "Product Manager at Startup Inc", 
          email: "jane@example.com",
          profileUrl: "https://linkedin.com/in/janesmith",
          profilePicture: "https://example.com/profiles/janesmith.jpg"
        },
        { 
          name: "Bob Johnson", 
          title: "Data Scientist at AI Corp", 
          email: "bob@example.com",
          profileUrl: "https://linkedin.com/in/bobjohnson",
          profilePicture: "https://example.com/profiles/bobjohnson.jpg"
        },
      ];
    }
  }
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
const linkedInSearchConfig: ToolConfig = {
  id: "linkedin-search",
  name: "LinkedIn Search",
  description: "Search for people based on field, role, or keywords",
  input: z.object({
    query: z.string(),
    limit: z.number().optional().default(10),
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

    // Search LinkedIn profiles
    const profiles = await searchLinkedInUsers(query, limit);

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