import axios from 'axios';
import { LinkedInProfile } from './linkedin-service';

/**
 * Detailed profile information interface
 */
export interface DetailedProfileInfo {
  industry: string;
  company: string;
  location: string;
  skills: string[];
  interests: string[];
  education: string[];
  languages: string[];
  certifications: string[];
  recommendations: number;
  connectionDegree: number;
  sharedConnections: number;
  mutualConnections: string[];
  articles: number;
  posts: number;
  profileSummary: string;
  recentActivity: string[];
  commonGroups: string[];
}

// Interface for SignalHire API response
interface SignalHireResponse {
  requestId: number;
}

interface SignalHireCallback {
  item: string;
  status: 'success' | 'failed' | 'credits_are_over' | 'timeout_exceeded' | 'duplicate_query';
  candidate?: {
    uid: string;
    fullName: string;
    gender: string | null;
    headLine: string;
    summary: string;
    skills: string[];
    experience: Array<{
      position: string;
      company: string;
      companyUrl: string;
      started: string;
      ended: string | null;
      current: boolean;
      industry: string;
    }>;
    education: Array<{
      university: string;
      faculty: string;
      degree: string[];
    }>;
    locations: Array<{
      name: string;
    }>;
    contacts: Array<{
      type: string;
      value: string;
      subType: string;
    }>;
    social: Array<{
      type: string;
      link: string;
    }>;
    language?: Array<{
      name: string;
      proficiency: string;
    }>;
    certification?: Array<{
      name: string;
      authority: string;
    }>;
  };
}

// Cache to store profile information to avoid duplicate requests
const profileCache: Record<string, DetailedProfileInfo> = {};

// Configuration for SignalHire API
const SIGNALHIRE_API_URL = 'https://www.signalhire.com/api/v1/candidate/search';
const CALLBACK_URL = process.env.SIGNALHIRE_CALLBACK_URL || 'https://your-domain.com/signalhire/callback';

// Initialize axios instance for SignalHire API
const signalHireApi = axios.create({
  baseURL: 'https://www.signalhire.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
});

/**
 * Set the API key for SignalHire
 */
const setSignalHireApiKey = (apiKey: string) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Invalid API key: Token cannot be empty');
  }
  
  signalHireApi.defaults.headers.common['apikey'] = apiKey;
};

/**
 * Process SignalHire API response to extract detailed profile information
 */
function processSignalHireResponse(response: SignalHireCallback): DetailedProfileInfo | null {
  if (response.status !== 'success' || !response.candidate) {
    console.error(`[SIGNALHIRE API] Failed to get profile data: ${response.status}`);
    return null;
  }
  
  const candidate = response.candidate;
  
  // Extract industry from current experience if available
  let industry = '';
  if (candidate.experience && candidate.experience.length > 0) {
    industry = candidate.experience[0].industry || '';
  }
  
  // Extract company from current experience
  let company = '';
  if (candidate.experience && candidate.experience.length > 0) {
    company = candidate.experience[0].company || '';
  }
  
  // Extract location from locations array
  let location = '';
  if (candidate.locations && candidate.locations.length > 0) {
    location = candidate.locations[0].name || '';
  }
  
  // Extract skills
  const skills = candidate.skills || [];
  
  // Extract interests (SignalHire doesn't provide interests directly, using empty array)
  const interests: string[] = [];
  
  // Extract education
  const education = candidate.education 
    ? candidate.education.map(edu => edu.university) 
    : [];
  
  // Extract languages
  const languages = candidate.language 
    ? candidate.language.map(lang => lang.name)
    : [];
  
  // Extract certifications
  const certifications = candidate.certification
    ? candidate.certification.map(cert => cert.name)
    : [];
  
  // Create the detailed profile info
  return {
    industry,
    company,
    location,
    skills,
    interests,
    education,
    languages,
    certifications,
    recommendations: 0, // Not provided by SignalHire
    connectionDegree: 0, // Not provided by SignalHire
    sharedConnections: 0, // Not provided by SignalHire
    mutualConnections: [], // Not provided by SignalHire
    articles: 0, // Not provided by SignalHire
    posts: 0, // Not provided by SignalHire
    profileSummary: candidate.summary || '',
    recentActivity: [], // Not provided by SignalHire
    commonGroups: [] // Not provided by SignalHire
  };
}

/**
 * Simulates a callback from SignalHire API for testing purposes
 * In a real implementation, you would set up a webhook endpoint to receive SignalHire callbacks
 */
async function simulateSignalHireCallback(linkedInUrl: string): Promise<SignalHireCallback> {
  // In a real implementation, you would create a webhook endpoint to receive SignalHire callbacks
  // This is just a placeholder that returns mock data for testing
  console.log(`[SIGNALHIRE API] Simulating callback for: ${linkedInUrl}`);
  
  // Mock successful response
  return {
    item: linkedInUrl,
    status: 'success',
    candidate: {
      uid: 'mock-uid',
      fullName: 'John Doe',
      gender: null,
      headLine: 'Software Engineer at Tech Company',
      summary: 'Experienced software engineer with expertise in TypeScript and Node.js',
      skills: ['TypeScript', 'Node.js', 'React', 'API Design'],
      experience: [
        {
          position: 'Senior Software Engineer',
          company: 'Tech Company',
          companyUrl: 'https://www.linkedin.com/company/tech-company',
          started: '2020-01-01T00:00:00+00:00',
          ended: null,
          current: true,
          industry: 'Software Development'
        }
      ],
      education: [
        {
          university: 'University of Technology',
          faculty: 'Computer Science',
          degree: ['Bachelor of Science']
        }
      ],
      locations: [
        {
          name: 'San Francisco, California, United States'
        }
      ],
      contacts: [
        {
          type: 'email',
          value: 'john.doe@example.com',
          subType: 'work'
        }
      ],
      social: [
        {
          type: 'li',
          link: linkedInUrl
        }
      ],
      language: [
        {
          name: 'English',
          proficiency: 'Native or bilingual'
        }
      ],
      certification: [
        {
          name: 'AWS Certified Developer',
          authority: 'Amazon Web Services'
        }
      ]
    }
  };
}

/**
 * Make a request to SignalHire API to get detailed profile information
 * In a production environment, you would need to set up a webhook to receive the callback
 */
async function requestProfileInfoFromSignalHire(profileUrl: string): Promise<SignalHireResponse | null> {
  try {
    console.log(`[SIGNALHIRE API] Requesting profile info for: ${profileUrl}`);
    
    // Set API token from environment
    const apiKey = process.env.SIGNALHIRE_API_KEY || '';
    setSignalHireApiKey(apiKey);
    
    // Make API request
    const response = await signalHireApi.post('/candidate/search', {
      items: [profileUrl],
      callbackUrl: CALLBACK_URL
    });
    
    if (response.status !== 201 || !response.data) {
      console.error(`[SIGNALHIRE API] Failed to request profile data: ${response.status}`);
      return null;
    }
    
    return response.data as SignalHireResponse;
  } catch (error) {
    console.error('[SIGNALHIRE API] Error requesting profile info:', error);
    return null;
  }
}

/**
 * Get detailed information for a LinkedIn profile
 * Note: In a production environment, you would need to implement a webhook endpoint
 * to receive callbacks from SignalHire. This implementation simulates the callback
 * for testing purposes.
 */
export async function getDetailedProfileInfo(profileUrl: string): Promise<DetailedProfileInfo | null> {
  try {
    console.log(`[PROFILE SERVICE] Getting detailed info for profile: ${profileUrl}`);
    
    // Check cache first
    if (profileCache[profileUrl]) {
      console.log(`[PROFILE SERVICE] Using cached profile data for: ${profileUrl}`);
      return profileCache[profileUrl];
    }
    
    // In a production environment, you would:
    // 1. Make a request to SignalHire API
    // 2. Store the requestId
    // 3. Wait for the callback to your webhook endpoint
    // 4. Process the callback data
    
    // For this implementation, we'll simulate the process:
    
    // 1. Make request to SignalHire API (this would trigger a callback in production)
    const requestResult = await requestProfileInfoFromSignalHire(profileUrl);
    
    if (!requestResult) {
      console.error(`[PROFILE SERVICE] Failed to request profile data from SignalHire`);
      return null;
    }
    
    console.log(`[PROFILE SERVICE] Successfully requested profile data. Request ID: ${requestResult.requestId}`);
    
    // 2. In a real implementation, you would wait for the callback
    // For this demo, we'll simulate the callback response
    const callbackData = await simulateSignalHireCallback(profileUrl);
    
    // 3. Process the callback data
    const profileInfo = processSignalHireResponse(callbackData);
    
    if (profileInfo) {
      // Save to cache
      profileCache[profileUrl] = profileInfo;
      return profileInfo;
    }
    
    return null;
  } catch (error) {
    console.error('[PROFILE SERVICE] Error fetching profile details:', error);
    return null;
  }
}

/**
 * Get detailed information for multiple LinkedIn profiles
 */
export async function getDetailedProfilesInfo(
  profiles: LinkedInProfile[]
): Promise<Record<string, DetailedProfileInfo>> {
  console.log(`[PROFILE SERVICE] Fetching detailed info for ${profiles.length} profiles`);
  
  const results: Record<string, DetailedProfileInfo> = {};
  
  for (const profile of profiles) {
    if (!profile.profileUrl) {
      continue;
    }
    
    try {
      const details = await getDetailedProfileInfo(profile.profileUrl);
      if (details) {
        results[profile.email] = details;
      }
    } catch (error) {
      console.error(`[PROFILE SERVICE] Error fetching details for ${profile.name}:`, error);
    }
  }
  
  console.log(`[PROFILE SERVICE] Successfully fetched details for ${Object.keys(results).length} profiles`);
  return results;
}

/**
 * Extract key talking points from a profile
 */
export function extractTalkingPoints(profile: DetailedProfileInfo): string[] {
  const talkingPoints: string[] = [];
  
  // Extract industry expertise
  if (profile.industry) {
    talkingPoints.push(`Experience in the ${profile.industry} industry`);
  }
  
  // Extract company background
  if (profile.company) {
    talkingPoints.push(`Works at ${profile.company}`);
  }
  
  // Extract skills expertise
  if (profile.skills.length > 0) {
    const topSkills = profile.skills.slice(0, 3);
    talkingPoints.push(`Expertise in ${topSkills.join(', ')}`);
  }
  
  // Extract education background
  if (profile.education.length > 0) {
    talkingPoints.push(`Educational background at ${profile.education[0]}`);
  }
  
  // Extract location information
  if (profile.location) {
    talkingPoints.push(`Based in ${profile.location}`);
  }
  
  // Extract certifications
  if (profile.certifications.length > 0) {
    talkingPoints.push(`Certified in ${profile.certifications[0]}`);
  }
  
  // Add summary if available
  if (profile.profileSummary) {
    const summary = profile.profileSummary.substring(0, 100);
    talkingPoints.push(`Profile summary: "${summary}${summary.length >= 100 ? '...' : ''}"`);
  }
  
  return talkingPoints;
}