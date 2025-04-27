import express from 'express';
import bodyParser from 'body-parser';
import { DetailedProfileInfo } from './linkedin-profile-service';

// This file implements a webhook endpoint to receive callbacks from SignalHire API

// In-memory store for callback data
// In a production environment, you would use a persistent database
interface CallbackStore {
  [requestId: string]: {
    data: any;
    received: boolean;
    timestamp: number;
  }
}

const callbackStore: CallbackStore = {};

// Initialize Express router
export function initializeSignalHireWebhook(app: express.Application) {
  // Create a processing queue for handling callbacks
  const callbackQueue: any[] = [];
  let isProcessing = false;

  // Parse JSON bodies
  app.use(bodyParser.json());

  // SignalHire webhook endpoint
  app.post('/signalhire/callback', async (req, res) => {
    try {
      console.log('[SIGNALHIRE WEBHOOK] Received callback:', JSON.stringify(req.headers));
      
      // Get the request ID from headers
      const requestId = req.headers['request-id'] as string;
      
      if (!requestId) {
        console.error('[SIGNALHIRE WEBHOOK] No Request-Id found in headers');
        return res.status(400).json({ error: 'Missing Request-Id header' });
      }
      
      // Store the callback data
      callbackStore[requestId] = {
        data: req.body,
        received: true,
        timestamp: Date.now()
      };
      
      // Add to processing queue
      callbackQueue.push({
        requestId,
        data: req.body
      });
      
      // Start processing if not already in progress
      if (!isProcessing) {
        processCallbackQueue();
      }
      
      // Return success immediately to acknowledge receipt
      return res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('[SIGNALHIRE WEBHOOK] Error processing callback:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Process the callback queue
  async function processCallbackQueue() {
    if (callbackQueue.length === 0) {
      isProcessing = false;
      return;
    }
    
    isProcessing = true;
    const item = callbackQueue.shift();
    
    try {
      await processSignalHireCallback(item.requestId, item.data);
    } catch (error) {
      console.error(`[SIGNALHIRE WEBHOOK] Error processing callback for request ${item.requestId}:`, error);
    }
    
    // Process next item in queue
    processCallbackQueue();
  }

  // Process a single SignalHire callback
  async function processSignalHireCallback(requestId: string, data: any[]) {
    console.log(`[SIGNALHIRE WEBHOOK] Processing callback for request ${requestId}`);
    
    if (!Array.isArray(data)) {
      console.error('[SIGNALHIRE WEBHOOK] Invalid callback data format, expected array');
      return;
    }
    
    // Process each item in the callback data
    for (const item of data) {
      if (item.status !== 'success' || !item.candidate) {
        console.log(`[SIGNALHIRE WEBHOOK] Item ${item.item} status: ${item.status}`);
        continue;
      }
      
      // Process the candidate data
      const candidate = item.candidate;
      console.log(`[SIGNALHIRE WEBHOOK] Processing candidate: ${candidate.fullName}`);
      
      // Extract profile information
      const profileInfo = convertToDetailedProfileInfo(candidate);
      
      // Store this information so it can be retrieved by your application
      // In a real implementation, you would save this to a database
      saveProfileInfo(item.item, profileInfo);
    }
    
    console.log(`[SIGNALHIRE WEBHOOK] Finished processing callback for request ${requestId}`);
  }

  // Convert SignalHire candidate data to DetailedProfileInfo format
  function convertToDetailedProfileInfo(candidate: any): DetailedProfileInfo {
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
    
    // Extract interests (SignalHire doesn't provide interests directly)
    const interests: string[] = [];
    
    // Extract education
    const education = candidate.education 
      ? candidate.education.map((edu: any) => edu.university) 
      : [];
    
    // Extract languages
    const languages = candidate.language 
      ? candidate.language.map((lang: any) => lang.name)
      : [];
    
    // Extract certifications
    const certifications = candidate.certification
      ? candidate.certification.map((cert: any) => cert.name)
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

  // Save profile information for later retrieval
  function saveProfileInfo(linkedInUrl: string, profileInfo: DetailedProfileInfo) {
    // In a real implementation, you would save this to a database
    // For this example, we'll use a global memory cache
    (global as any).profileInfoCache = (global as any).profileInfoCache || {};
    (global as any).profileInfoCache[linkedInUrl] = profileInfo;
    
    console.log(`[SIGNALHIRE WEBHOOK] Saved profile info for: ${linkedInUrl}`);
  }

  // Add a retrieval function that your application can use to get profile info
  app.get('/api/profile-info', (req, res) => {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL parameter' });
    }
    
    const profileCache = (global as any).profileInfoCache || {};
    const profileInfo = profileCache[url];
    
    if (!profileInfo) {
      return res.status(404).json({ error: 'Profile information not found' });
    }
    
    return res.status(200).json(profileInfo);
  });

  // API to check the status of a request
  app.get('/api/callback-status/:requestId', (req, res) => {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId parameter' });
    }
    
    const callback = callbackStore[requestId];
    
    if (!callback) {
      return res.status(404).json({ error: 'Callback not found' });
    }
    
    return res.status(200).json({
      requestId,
      received: callback.received,
      timestamp: callback.timestamp
    });
  });

  console.log('[SIGNALHIRE WEBHOOK] Initialized webhook endpoint at /signalhire/callback');
}

// Function to retrieve profile info (to be called from other services)
export function getStoredProfileInfo(linkedInUrl: string): DetailedProfileInfo | null {
  const profileCache = (global as any).profileInfoCache || {};
  return profileCache[linkedInUrl] || null;
}

// Clean up old callback data periodically (run every hour)
setInterval(() => {
  const now = Date.now();
  const expiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  for (const requestId in callbackStore) {
    const callback = callbackStore[requestId];
    
    if (now - callback.timestamp > expiry) {
      console.log(`[SIGNALHIRE WEBHOOK] Clearing expired callback data for request ${requestId}`);
      delete callbackStore[requestId];
    }
  }
}, 60 * 60 * 1000); // Run every hour