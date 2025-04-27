import axios from 'axios';

// LinkedIn API Types
interface SearchParams {
  query: string;
  limit?: number;
  school?: string[];
}

interface SearchResponse {
  results: LinkedInProfile[];
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
export async function searchLinkedInUsers(query: string, limit: number = 10): Promise<LinkedInProfile[]> {
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
export async function fetchLinkedInProfiles(preferredChatPartner: string): Promise<LinkedInProfile[]> {
  // Just use the searchLinkedInUsers function with a limit of 3
  return searchLinkedInUsers(preferredChatPartner, 3);
}

// Simulated function to send emails via Gmail
export async function sendGmailInvitations(meetLink: string, resumeUrl: string, recipients: any[]): Promise<void> {
  // In a real scenario, this would use the Gmail API to send emails
  console.log(`Sending invitations to ${recipients.length} recipients`);
  console.log(`Meet Link: ${meetLink}`);
  console.log(`Resume URL: ${resumeUrl}`);
} 