
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  persistentLocalCache,
  // CACHE_SIZE_UNLIMITED should also be imported from here if needed explicitly
  // but it's often a constant like -1 or a specific large number
} from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;

const CACHE_SIZE_UNLIMITED = 40 * 1024 * 1024; // Approx 40MB, as previously defined.

console.log('[FirebaseInit] Starting Firebase initialization...');

// Ensure these are read correctly from process.env
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_API_KEY: ${apiKey ? 'Present' : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${authDomain ? 'Present' : 'MISSING!'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${projectId ? 'Present' : 'MISSING!'}`);
// Optional ones, log if present or not
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${storageBucket ? 'Present' : 'Not Present (Optional)'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${messagingSenderId ? 'Present' : 'Not Present (Optional)'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_APP_ID: ${appId ? 'Present' : 'Not Present (Optional)'}`);
console.log(`[FirebaseInit] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${measurementId ? 'Present' : 'Not Present (Optional)'}`);


if (!apiKey || !authDomain || !projectId) {
  firebaseInitError =
    "CRITICAL: Missing one or more essential Firebase configuration values (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID). " +
    "Please check your .env.local file, ensure variables are prefixed with NEXT_PUBLIC_, and restart your development server.";
  console.error(`[FirebaseInit] Error: ${firebaseInitError}`);
  // firebaseInitialized remains false, app and db remain null
} else {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: authDomain,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appId,
    measurementId: measurementId,
  };

  console.log('[FirebaseInit] Firebase config object prepared:', firebaseConfig); // Be mindful of logging sensitive keys in shared environments

  if (getApps().length === 0) {
    console.log('[FirebaseInit] No Firebase apps initialized yet. Attempting to initialize...');
    try {
      app = initializeApp(firebaseConfig);
      console.log('[FirebaseInit] initializeApp successful.');
      const firestoreInstance = getFirestore(app, {
        cache: persistentLocalCache({ // Or memoryLocalCache, memoryLruGarbageCollector
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
      });
      if (firestoreInstance) {
        db = firestoreInstance;
        firebaseInitialized = true;
        firebaseInitError = null; // Clear any previous potential error if initialization succeeds
        console.log('[FirebaseInit] Firestore instance obtained successfully. Firebase fully initialized.');
      } else {
        // This case is highly unlikely with standard SDK behavior if initializeApp succeeded.
        firebaseInitError = "CRITICAL: Firestore instance could not be obtained after app initialization without an explicit error. Ensure Firestore is enabled in your Firebase project and check its configuration.";
        console.error(`[FirebaseInit] Error: ${firebaseInitError}`);
        db = null;
        firebaseInitialized = false;
      }
    } catch (e: any) {
      firebaseInitError = `CRITICAL: Firebase initializeApp or getFirestore failed: ${e.message}. Check your Firebase config, ensure Firestore is enabled in your project, and that the project ID matches.`;
      console.error(`[FirebaseInit] Error during initialization: ${firebaseInitError}`, e);
      app = null;
      db = null;
      firebaseInitialized = false;
    }
  } else {
    console.log('[FirebaseInit] Firebase app already exists. Re-using existing instance.');
    app = getApps()[0];
    if (app) {
        try {
            const firestoreInstance = getFirestore(app, {
               cache: persistentLocalCache({
                 cacheSizeBytes: CACHE_SIZE_UNLIMITED,
               }),
            });
            if (firestoreInstance) {
              db = firestoreInstance;
              firebaseInitialized = true;
              firebaseInitError = null; // Clear any previous potential error
              console.log('[FirebaseInit] Firestore instance obtained for existing app. Firebase fully initialized.');
            } else {
              // This case is highly unlikely.
              firebaseInitError = "CRITICAL: Firestore instance could not be obtained for existing app without an explicit error. Ensure Firestore is enabled.";
              console.error(`[FirebaseInit] Error: ${firebaseInitError}`);
              db = null;
              firebaseInitialized = false;
            }
        } catch (e: any) {
            firebaseInitError = `CRITICAL: Firebase getFirestore failed for existing app: ${e.message}. Ensure Firestore is enabled.`;
            console.error(`[FirebaseInit] Error: ${firebaseInitError}`, e);
            db = null;
            firebaseInitialized = false;
        }
    } else {
        // This state should ideally not be reached if getApps().length > 0
        firebaseInitError = "CRITICAL: Firebase getApps() reported existing apps, but could not retrieve an instance. This is an unexpected SDK state.";
        console.error(`[FirebaseInit] Error: ${firebaseInitError}`);
        firebaseInitialized = false;
    }
  }

  // Fallback error if initialization was attempted (keys were present) but failed, and no specific error was caught
  if (apiKey && authDomain && projectId && !firebaseInitialized && !firebaseInitError) {
    firebaseInitError = "CRITICAL: Firebase configuration variables seem present, but initialization failed for an unknown reason. Check browser console for more details, Firebase project status (especially Firestore), and restart the dev server.";
    console.error(`[FirebaseInit] Error: ${firebaseInitError}`);
  }
}

if (firebaseInitialized) {
  console.log(`[FirebaseInit] Final Status: SUCCESS. Project ID: ${projectId}`);
} else {
  console.error(`[FirebaseInit] Final Status: FAILED. Error: ${firebaseInitError}`);
}


export { app, db, firebaseInitialized, firebaseInitError };

// Placeholder User ID for simplicity without full auth implementation
export const USER_ID = "defaultUser";
