import { Firestore, Timestamp, Query, CollectionReference } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { callGemini } from './gemini';

// Types
export interface FirestoreConfig {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface QueryOptions {
  where?: {
    field: string;
    operator: '<' | '<=' | '==' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any';
    value: any;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export interface ContactAdditionalData {
  [key: string]: any; // Flexible JSON structure for additional data
}

export interface ContactInteraction {
  timestamp: Timestamp;
  notes: string;
}

export interface Contact {
  contactId: string;
  name: string;
  email?: string;
  responseScore: number;
  similarityScore: number;
  lastContact: Timestamp;
  additionalData: ContactAdditionalData;
  contactHistory: ContactInteraction[];
}

export interface UserData {
  name: string;
  age: number;
  resumeUrl: string;
  goals: string;
  onboarded: boolean;
  contacts: Contact[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Initialize Firestore
export function initializeFirestore(): Firestore {
  const serviceAccountPath = path.join(process.cwd(), 'firestore-creds.json');
  
  try {
    const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountFile) as FirestoreConfig;
    
    // Initialize Firestore
    const firestore = new Firestore({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n')
      }
    });
    
    console.log('[FIRESTORE] Successfully initialized Firestore');
    return firestore;
  } catch (error) {
    console.error('[FIRESTORE] Error initializing Firestore:', error);
    throw new Error('Failed to initialize Firestore. Please ensure firestore-creds.json exists and is valid.');
  }
}

// Get Firestore instance
export const db = initializeFirestore();

// Collection names
export const COLLECTIONS = {
  OAUTH_TOKENS: 'oauth_tokens',
  USERS: 'users',
  SESSIONS: 'sessions'
} as const;

// Helper functions for Firestore operations
export const firestoreHelpers = {
  // Get document reference
  getDocRef: (collection: string, docId: string) => {
    return db.collection(collection).doc(docId);
  },
  
  // Get document data
  getDocData: async (collection: string, docId: string) => {
    const doc = await db.collection(collection).doc(docId).get();
    return doc.exists ? doc.data() : null;
  },
  
  // Set document data
  setDocData: async (collection: string, docId: string, data: any) => {
    await db.collection(collection).doc(docId).set({
      ...data,
      updatedAt: Timestamp.now()
    });
  },
  
  // Update document data
  updateDocData: async (collection: string, docId: string, data: any) => {
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: Timestamp.now()
    });
  },
  
  // Delete document
  deleteDoc: async (collection: string, docId: string) => {
    await db.collection(collection).doc(docId).delete();
  },
  
  // Query documents
  queryDocs: async (collection: string, options: QueryOptions) => {
    let query: Query = db.collection(collection);
    
    // Apply filters
    if (options.where) {
      query = query.where(options.where.field, options.where.operator, options.where.value);
    }
    
    // Apply ordering
    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get user data
  getUserData: async (userId: string): Promise<UserData | null> => {
    const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    return doc.exists ? doc.data() as UserData : null;
  },
  
  // Create or update user data
  setUserData: async (userId: string, data: Partial<UserData>) => {
    const now = Timestamp.now();
    await db.collection(COLLECTIONS.USERS).doc(userId).set({
      ...data,
      contacts: data.onboarded ? [] : data.contacts,
      updatedAt: now,
      createdAt: data.createdAt || now
    }, { merge: true });
  },
  
  // Check if user is onboarded
  isUserOnboarded: async (userId: string): Promise<boolean> => {
    const userData = await firestoreHelpers.getUserData(userId);
    return userData?.onboarded || false;
  }
};

// Helper function to calculate response score
const calculateResponseScore = (contact: Contact): number => {
  const interactions = contact.contactHistory;
  if (interactions.length === 0) return 0;

  const now = Timestamp.now();
  const recentInteractions = interactions.filter(i => 
    now.toDate().getTime() - i.timestamp.toDate().getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
  );

  // Calculate base score from recent interactions
  const baseScore = (recentInteractions.length / 30) * 50; // Up to 50 points for frequency

  // Calculate time decay factor
  const timeDecay = Math.exp(-0.1 * (now.toDate().getTime() - contact.lastContact.toDate().getTime()) / (24 * 60 * 60 * 1000));
  
  // Calculate interaction quality score (based on notes length as a proxy for interaction quality)
  const qualityScore = interactions.reduce((sum, i) => sum + Math.min(i.notes.length / 100, 1), 0) * 20;

  return Math.min(baseScore * timeDecay + qualityScore, 100);
};

// Helper function to calculate similarity score using Gemini
const calculateSimilarityScore = async (contact: Contact, userId: string): Promise<number> => {
  // Get user data
  const userData = await firestoreHelpers.getUserData(userId);
  if (!userData) {
    throw new Error('User not found');
  }

  // Create prompt for Gemini
  const prompt = `Given the following information, calculate a similarity score between 0 and 100:
  
  User's Information:
  - Resume: ${userData.resumeUrl}
  - Career Goals: ${userData.goals}
  
  Contact's Information:
  ${JSON.stringify(contact.additionalData)}
  
  Please analyze how well this contact could help the user achieve their career goals based on:
  1. Professional alignment (skills, industry, experience)
  2. Network potential (connections, influence)
  3. Knowledge sharing potential
  4. Mentorship potential
  
  Return only a number between 0 and 100 representing the overall similarity and potential value score.`;

  try {
    const response = await callGemini(prompt);
    const score = parseFloat(response);
    return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 100);
  } catch (error) {
    console.error('Error calculating similarity score:', error);
    return 0;
  }
};

// Function to update contact scores
const updateContactScores = async (userId: string, contact: Contact): Promise<Contact> => {
  const userData = await firestoreHelpers.getUserData(userId);
  if (!userData) {
    throw new Error('User not found');
  }

  // Calculate new scores
  const responseScore = calculateResponseScore(contact);
  const similarityScore = await calculateSimilarityScore(contact, userId);

  // Update contact with new scores
  const updatedContact = {
    ...contact,
    responseScore,
    similarityScore
  };

  // Update contacts array
  const updatedContacts = userData.contacts.map(c => 
    c.contactId === contact.contactId ? updatedContact : c
  );

  // Update user document
  await firestoreHelpers.setUserData(userId, { contacts: updatedContacts });
  return updatedContact;
};

// Function to update or create contact
export const updateOrCreateContact = async (userId: string, contactData: any, interact: boolean = false): Promise<Contact> => {
  const now = Timestamp.now();
  
  // Get user data
  const userData = await firestoreHelpers.getUserData(userId);
  if (!userData) {
    throw new Error('User not found');
  }

  // Create prompt for Gemini
  const prompt = `Given the following contact data, parse it into a structured format that matches our database schema. 
  If any information is missing or unclear, set that field to null. 
  The schema should include: name, email, additionalData (as a JSON object containing any additional information about the contact like their preferences, work details, personality traits, etc.), and if interact is true, also include notes.
  Here's the contact data: ${JSON.stringify(contactData)}
  Please return only a JSON object with the following structure:
  {
    "name": string | null,
    "email": string | null,
    "additionalData": object | null,
    "notes": string | null
  }`;

  // Call Gemini to parse the data
  const geminiResponse = await callGemini(prompt);
  let parsedData;
  try {
    parsedData = JSON.parse(geminiResponse);
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    throw new Error('Failed to parse contact data');
  }

  // Generate contactId from name
  const contactId = parsedData.name ? parsedData.name.replace(/\s+/g, '').toLowerCase() : '';
  
  // Find existing contact
  let existingContact = userData.contacts.find(c => 
    c.email === parsedData.email || c.contactId === contactId
  );

  // Create new interaction only if interact is true
  const newInteraction: ContactInteraction | null = interact ? {
    timestamp: now,
    notes: parsedData.notes || 'Contact updated'
  } : null;

  let updatedContact: Contact;

  if (existingContact) {
    // Update existing contact
    updatedContact = {
      ...existingContact,
      name: parsedData.name || existingContact.name,
      email: parsedData.email || existingContact.email,
      lastContact: interact ? now : existingContact.lastContact,
      contactHistory: interact 
        ? [...existingContact.contactHistory, newInteraction!] 
        : existingContact.contactHistory,
      additionalData: parsedData.additionalData || existingContact.additionalData
    };

    // Update contacts array
    const updatedContacts = userData.contacts.map(c => 
      c.contactId === existingContact.contactId ? updatedContact : c
    );

    // Update user document
    await firestoreHelpers.setUserData(userId, { contacts: updatedContacts });
  } else {
    // Create new contact
    updatedContact = {
      contactId,
      name: parsedData.name || '',
      email: parsedData.email || null,
      responseScore: 0,
      similarityScore: 0,
      lastContact: interact ? now : null,
      additionalData: parsedData.additionalData || {},
      contactHistory: interact ? [newInteraction!] : []
    };

    // Add to contacts array
    const updatedContacts = [...userData.contacts, updatedContact];

    // Update user document
    await firestoreHelpers.setUserData(userId, { contacts: updatedContacts });
  }

  // Update scores after the contact has been created/updated
  return await updateContactScores(userId, updatedContact);
}; 
