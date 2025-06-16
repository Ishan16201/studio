import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { enableIndexedDbPersistence } from 'firebase/firestore';

interface FirebaseState {
  app: FirebaseApp | null;
  db: Firestore | null;
  error: string | null;
}

const CACHE_SIZE_UNLIMITED = 40 * 1024 * 1024; // 40MB
const USER_ID = "defaultUser";

// Firebase state
const firebaseState: FirebaseState = {
  app: null,
  db: null,
  error: null,
};

// Validate required environment variables
const validateConfig = () => {
  const requiredVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      'Please check your .env.local file and restart your development server.'
    );
  }

  return {
    ...requiredVars,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
};

let initializationPromise: Promise<void> | null = null;

// Function to initialize Firebase and return a Promise that resolves when ready
const initializeFirebase = async (): Promise<void> => {
  try {
    console.log('[Firebase] Starting initialization...');

    
    // Use existing app if available
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('[Firebase] Using existing app instance');
      firebaseState.app = existingApps[0];
    } else {
      console.log('[Firebase] Creating new app instance');
      const config = validateConfig();
      firebaseState.app = initializeApp(config);
    }

    // Initialize Firestore
    const firestoreInstance = getFirestore(firebaseState.app);
    
    // Enable persistence
    try {
      await enableIndexedDbPersistence(firestoreInstance);
      console.log('[Firebase] Persistence enabled successfully');
    } catch (persistenceError: any) {
      // Persistence failure is non-critical
      console.warn('[Firebase] Persistence setup failed:', persistenceError.message);
      console.warn('[Firebase] Continuing without offline persistence');
    }

    firebaseState.error = null;

    console.log('[Firebase] Initialization completed successfully');
    
  } catch (error: any) {
    firebaseState.error = error.message;
    firebaseState.initialized = false;
    firebaseState.app = null;
    firebaseState.db = null;
    
    console.error('[Firebase] Initialization failed:', error.message);
    throw error;
  }
};

export const getFirebaseApp = (): FirebaseApp | null => firebaseState.app
export const getFirebaseDb = (): Firestore | null => firebaseState.db
export const getFirebaseError = (): string | null => firebaseState.error

/**
 * Returns a Promise that resolves when Firebase initialization is complete.
 * Use this in components or hooks that depend on Firebase being ready.
 */
export const whenFirebaseInitialized = (): Promise<void> => {
  if (!initializationPromise) {
    // If initialization hasn't started, start it and store the promise
    initializationPromise = initializeFirebase().catch((error) => {
      // Catch and log the error so the original promise still rejects
      console.error('[Firebase] Failed to initialize:', error.message);
      // Re-throw or handle as needed, depending on how you want
      // errors to propagate to consumers of this promise.
      throw error;
    });
  }
  return initializationPromise;
};

// Export the user ID constant
export { USER_ID }