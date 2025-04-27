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
export async function updateOrCreateContact(userId: string, contactData: { name: string; email: string | null; additionalData: any }, interact: boolean = false): Promise<void> {
  console.log('[FIRESTORE] Starting updateOrCreateContact with:', JSON.stringify({
    userId,
    contactName: contactData.name,
    hasEmail: !!contactData.email,
    additionalDataKeys: Object.keys(contactData.additionalData),
    interact
  }));

  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    console.log('[FIRESTORE] Retrieved user document:', userDoc.exists);

    if (!userDoc.exists) {
      console.error('[FIRESTORE] User document does not exist');
      throw new Error('User not found');
    }

    // Get contacts array
    const userData = userDoc.data() as UserData;
    console.log('[FIRESTORE] User data retrieved:', JSON.stringify({
      hasContacts: !!userData.contacts,
      contactsCount: userData.contacts?.length || 0
    }));

    // Initialize contacts array if it doesn't exist
    if (!userData.contacts) {
      console.log('[FIRESTORE] Initializing contacts array');
      userData.contacts = [];
    }

    // Find existing contact by email or name
    let existingContactIndex = -1;
    if (contactData.email) {
      existingContactIndex = userData.contacts.findIndex(c => c.email === contactData.email);
      console.log('[FIRESTORE] Search by email result:', existingContactIndex);
    }
    
    if (existingContactIndex === -1) {
      existingContactIndex = userData.contacts.findIndex(c => c.name === contactData.name);
      console.log('[FIRESTORE] Search by name result:', existingContactIndex);
    }

    // Create or update contact
    const now = Timestamp.now();
    const contact: Contact = {
      contactId: contactData.name.toLowerCase().replace(/\s+/g, '-'),
      name: contactData.name,
      email: contactData.email,
      responseScore: 0,
      similarityScore: 0,
      lastContact: interact ? now : null,
      contactHistory: interact ? [{
        timestamp: now,
        notes: 'Initial contact'
      }] : [],
      additionalData: contactData.additionalData
    };

    console.log('[FIRESTORE] Prepared contact object:', JSON.stringify({
      name: contact.name,
      hasEmail: !!contact.email,
      hasLastContact: !!contact.lastContact,
      historyLength: contact.contactHistory.length,
      additionalDataKeys: Object.keys(contact.additionalData)
    }));

    if (existingContactIndex === -1) {
      console.log('[FIRESTORE] Creating new contact');
      userData.contacts.push(contact);
    } else {
      console.log('[FIRESTORE] Updating existing contact at index:', existingContactIndex);
      const existingContact = userData.contacts[existingContactIndex];
      
      // Update fields
      existingContact.name = contact.name;
      existingContact.email = contact.email;
      existingContact.additionalData = {
        ...existingContact.additionalData,
        ...contact.additionalData
      };
      
      if (interact) {
        existingContact.lastContact = now;
        existingContact.contactHistory.push({
          timestamp: now,
          notes: 'Updated contact'
        });
      }
    }

    // Update user document
    console.log('[FIRESTORE] Updating user document with contacts count:', userData.contacts.length);
    await userDoc.ref.update({
      contacts: userData.contacts,
      updatedAt: now
    });
    console.log('[FIRESTORE] Successfully updated user document');

  } catch (error) {
    console.error('[FIRESTORE] Error in updateOrCreateContact:', error.message);
    console.error('[FIRESTORE] Error stack:', error.stack);
    throw error;
  }
}

// Function to get all contacts for visualization
export const getContactsForVisualization = async (userId: string): Promise<{
  contacts: Array<{
    contactId: string;
    name: string;
    email: string | null;
    responseScore: number;
    similarityScore: number;
    additionalData: ContactAdditionalData;
  }>;
}> => {
  const userData = await firestoreHelpers.getUserData(userId);
  if (!userData) {
    throw new Error('User not found');
  }

  return {
    contacts: userData.contacts.map(contact => ({
      contactId: contact.contactId,
      name: contact.name,
      email: contact.email,
      responseScore: contact.responseScore,
      similarityScore: contact.similarityScore,
      additionalData: contact.additionalData
    }))
  };
}; 
