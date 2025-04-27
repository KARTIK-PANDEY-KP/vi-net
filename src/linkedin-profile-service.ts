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

/**
 * API client for detailed LinkedIn profile information
 */
const API_BASE_URL = 'https://api.profiledata.io/v1';

// Create axios instance with base configuration
const profileApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
});

/**
 * Set API authentication token
 */
const setProfileApiToken = (token: string) => {
  if (!token || token.trim() === '') {
    throw new Error('Invalid API token: Token cannot be empty');
  }
  
  profileApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Get detailed information for a LinkedIn profile
 */
export async function getDetailedProfileInfo(
  profileUrl: string
): Promise<DetailedProfileInfo | null> {
  try {
    console.log(`[PROFILE API] Fetching detailed info for profile: ${profileUrl}`);
    
    // Set API token from environment
    const apiKey = process.env.PROFILE_API_KEY || '';
    setProfileApiToken(apiKey);
    
    // Make API request
    const response = await profileApi.get(`/profile`, {
      params: { url: profileUrl }
    });
    
    if (!response.data || response.status !== 200) {
      console.error('[PROFILE API] Failed to get profile data:', response.statusText);
      return null;
    }
    
    // Process and format the response
    const data = response.data;
    
    // This is just a boilerplate - in a real implementation you would
    // parse the actual API response according to its structure
    return {
      industry: data.industry || '',
      company: data.currentCompany || '',
      location: data.location || '',
      skills: data.skills || [],
      interests: data.interests || [],
      education: (data.education || []).map((edu: any) => edu.institution),
      languages: data.languages || [],
      certifications: data.certifications || [],
      recommendations: data.recommendationCount || 0,
      connectionDegree: data.connectionDegree || 3,
      sharedConnections: data.sharedConnectionsCount || 0,
      mutualConnections: data.mutualConnections || [],
      articles: data.articleCount || 0,
      posts: data.postCount || 0,
      profileSummary: data.summary || '',
      recentActivity: data.recentActivities || [],
      commonGroups: data.commonGroups || []
    };
  } catch (error) {
    console.error('[PROFILE API] Error fetching profile details:', error);
    return null;
  }
}

/**
 * Get detailed information for multiple LinkedIn profiles
 */
export async function getDetailedProfilesInfo(
  profiles: LinkedInProfile[]
): Promise<Record<string, DetailedProfileInfo>> {
  console.log(`[PROFILE API] Fetching detailed info for ${profiles.length} profiles`);
  
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
      console.error(`[PROFILE API] Error fetching details for ${profile.name}:`, error);
    }
  }
  
  console.log(`[PROFILE API] Successfully fetched details for ${Object.keys(results).length} profiles`);
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
    talkingPoints.push(`Work at ${profile.company}`);
  }
  
  // Extract skills expertise
  if (profile.skills.length > 0) {
    const topSkills = profile.skills.slice(0, 3);
    talkingPoints.push(`Expertise in ${topSkills.join(', ')}`);
  }
  
  // Extract common interests
  if (profile.interests.length > 0) {
    talkingPoints.push(`Shared interests in ${profile.interests.join(', ')}`);
  }
  
  // Extract education
  if (profile.education.length > 0) {
    talkingPoints.push(`Educational background at ${profile.education[0]}`);
  }
  
  // Extract recent activity
  if (profile.recentActivity.length > 0) {
    talkingPoints.push(`Recent participation in ${profile.recentActivity[0]}`);
  }
  
  return talkingPoints;
}