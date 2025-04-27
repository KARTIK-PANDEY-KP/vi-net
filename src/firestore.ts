import { Firestore, Timestamp, Query, CollectionReference } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as path from 'path';

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

export interface UserData {
  name: string;
  age: number;
  resumeUrl: string;
  goals: string;
  onboarded: boolean;
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