
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  persistentLocalCache,
} from 'firebase/firestore'; // CACHE_SIZE_UNLIMITED should also be imported from here

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let firebaseInitialized = false;
let firebaseInitError: string | null = null;

// Ensure these are read correctly from process.env
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional
const CACHE_SIZE_UNLIMITED = 40 * 1024 * 1024; // Default cache size, approximately 40MB.

if (!apiKey || !authDomain || !projectId) {
  firebaseInitError =
    "CRITICAL: Missing essential Firebase configuration values (e.g., NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID). " +
    "Please check your environment variables (e.g., .env.local), ensure they are prefixed with NEXT_PUBLIC_, and restart your development server.";
  // console.error(firebaseInitError); 
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

  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      const firestoreInstance = getFirestore(app, {
        cache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
      });
      if (firestoreInstance) {
        db = firestoreInstance;
        firebaseInitialized = true;
        console.log('Firebase initialized successfully.');
      } else {
        // This case is highly unlikely with standard SDK behavior.
        firebaseInitError = "CRITICAL: Firestore instance could not be obtained after app initialization without an explicit error. Ensure Firestore is enabled in your Firebase project.";
        db = null;
        firebaseInitialized = false;
      }
    } catch (e: any) {
      firebaseInitError = `CRITICAL: Firebase initialization failed: ${e.message}. Check your Firebase config and ensure Firestore is enabled.`;
      console.error(firebaseInitError, e);
      app = null;
      db = null;
      firebaseInitialized = false;
    }
  } else {
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
              console.log('Firebase already initialized, re-using existing instance.');
            } else {
              // This case is highly unlikely.
              firebaseInitError = "CRITICAL: Firestore instance could not be obtained for existing app without an explicit error. Ensure Firestore is enabled.";
              db = null;
              firebaseInitialized = false;
            }
        } catch (e: any) {
            firebaseInitError = `CRITICAL: Firebase getFirestore failed for existing app: ${e.message}. Ensure Firestore is enabled.`;
            console.error(firebaseInitError, e);
            db = null;
            firebaseInitialized = false;
        }
    } else {
        firebaseInitError = "CRITICAL: Firebase getApps() returned an empty array, but an app instance was expected. This is an unexpected SDK state.";
        // console.error(firebaseInitError); // Already implicitly handled by firebaseInitialized remaining false
        firebaseInitialized = false;
    }
  }

  // Fallback error if initialization was attempted but failed, and no specific error was caught
  if (!firebaseInitialized && !firebaseInitError) {
    firebaseInitError = "CRITICAL: Firebase configuration variables seem present, but initialization failed for an unknown reason. Check browser console, Firebase project status (especially Firestore), and restart the dev server.";
  }
}

export { app, db, firebaseInitialized, firebaseInitError };

// Placeholder User ID for simplicity without full auth implementation
export const USER_ID = "defaultUser";
