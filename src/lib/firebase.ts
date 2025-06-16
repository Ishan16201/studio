
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';

// Log environment variables at the very top to see what's loaded
console.log('[FirebaseInit] Attempting to load environment variables:');
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Loaded' : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Loaded' : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? `Loaded (${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID})` : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Loaded' : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Loaded' : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Loaded' : 'MISSING!'}`);


interface FirebaseClientState {
  app: FirebaseApp | null;
  db: Firestore | null;
  error: string | null;
  initialized: boolean;
}

const firebaseClientState: FirebaseClientState = {
  app: null,
  db: null,
  error: null,
  initialized: false,
};

export const USER_ID = "defaultUser"; // Or your actual user management logic

let initializationPromise: Promise<void> | null = null;

const initializeFirebaseClient = async (): Promise<void> => {
  if (firebaseClientState.initialized || initializationPromise) {
    console.log('[FirebaseInit] Already initialized or initialization in progress.');
    return initializationPromise || Promise.resolve();
  }

  console.log('[FirebaseInit] Starting Firebase client initialization...');

  initializationPromise = (async () => {
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const missingConfigKeys = Object.entries(firebaseConfig)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingConfigKeys.length > 0) {
        const errorMsg = `Missing Firebase config keys: ${missingConfigKeys.join(', ')}. Check .env.local and ensure server is restarted.`;
        console.error('[FirebaseInit] FATAL ERROR:', errorMsg);
        firebaseClientState.error = errorMsg;
        firebaseClientState.initialized = false; // Mark as not successfully initialized
        throw new Error(errorMsg);
      }
      
      console.log('[FirebaseInit] Effective Firebase Config Project ID:', firebaseConfig.projectId);

      if (getApps().length === 0) {
        firebaseClientState.app = initializeApp(firebaseConfig);
        console.log('[FirebaseInit] Firebase app initialized successfully.');
      } else {
        firebaseClientState.app = getApps()[0];
        console.log('[FirebaseInit] Using existing Firebase app instance.');
      }

      firebaseClientState.db = getFirestore(firebaseClientState.app);
      console.log('[FirebaseInit] Firestore instance obtained.');

      try {
        await enableIndexedDbPersistence(firebaseClientState.db);
        console.log('[FirebaseInit] Firestore persistence enabled.');
      } catch (persistenceError: any) {
        if (persistenceError.code === 'failed-precondition') {
          console.warn('[FirebaseInit] Firestore persistence failed (multiple tabs open?).');
        } else if (persistenceError.code === 'unimplemented') {
          console.warn('[FirebaseInit] Firestore persistence not available in this browser.');
        } else {
          console.warn('[FirebaseInit] Firestore persistence error:', persistenceError);
        }
      }

      firebaseClientState.error = null;
      firebaseClientState.initialized = true;
      console.log('[FirebaseInit] Firebase client initialization successful.');

    } catch (error: any) {
      console.error('[FirebaseInit] Error during Firebase client initialization:', error.message);
      firebaseClientState.error = error.message;
      firebaseClientState.initialized = false; // Ensure initialized is false on error
      // No need to set app/db to null here, they'd be null if initialization failed before setting them
      throw error; // Re-throw to reject the initializationPromise
    }
  })();
  
  return initializationPromise;
};

export const whenFirebaseInitialized = (): Promise<void> => {
  if (!initializationPromise) {
    return initializeFirebaseClient();
  }
  return initializationPromise;
};

export const getFirebaseApp = (): FirebaseApp | null => firebaseClientState.app;
export const getFirebaseDb = (): Firestore | null => firebaseClientState.db;
export const getFirebaseError = (): string | null => firebaseClientState.error;
export const isFirebaseSuccessfullyInitialized = (): boolean => firebaseClientState.initialized && !firebaseClientState.error;

// Immediately attempt to initialize for early feedback in logs,
// but components should still use whenFirebaseInitialized to await.
if (typeof window !== 'undefined') { // Ensure this only runs client-side
    initializeFirebaseClient().catch(err => {
        // Error is already logged inside initializeFirebaseClient
        // This catch is to prevent unhandled promise rejection if no one awaits it initially
    });
}
