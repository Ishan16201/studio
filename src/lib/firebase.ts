
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

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

if (!apiKey || !authDomain || !projectId) {
  firebaseInitError =
    "CRITICAL: Missing essential Firebase configuration values (e.g., NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID). " +
    "Please check your environment variables (e.g., .env.local), ensure they are prefixed with NEXT_PUBLIC_, and restart your development server.";
  // console.error(firebaseInitError); // Removed this line to prevent Next.js from reporting it as a console error
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
      db = getFirestore(app);
      firebaseInitialized = true;
      console.log("Firebase initialized successfully.");

      if (typeof window !== 'undefined' && db) {
        enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
          .then(() => {
            console.log("Firestore offline persistence enabled successfully.");
          })
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn("Firestore offline persistence failed (failed-precondition). It might be enabled in another tab or was already enabled.");
            } else if (err.code === 'unimplemented') {
              console.warn("Firestore offline persistence is not supported in this browser. The app will use in-memory cache.");
            } else {
              console.error("Error enabling Firestore offline persistence:", err);
            }
          });
      }
    } catch (e: any) {
      firebaseInitError = `CRITICAL: Firebase initialization failed: ${e.message}`;
      console.error(firebaseInitError, e); // Keep this console.error for actual initialization failures
      app = null;
      db = null;
      firebaseInitialized = false;
    }
  } else {
    app = getApps()[0];
    if (app) { // Ensure app is not null before calling getFirestore
        try {
            db = getFirestore(app);
            firebaseInitialized = true;
            console.log("Firebase already initialized, re-using existing instance.");
        } catch (e: any) {
            firebaseInitError = `CRITICAL: Firebase getFirestore failed for existing app: ${e.message}`;
            console.error(firebaseInitError, e);
            db = null;
            firebaseInitialized = false;
        }
    } else {
        firebaseInitError = "CRITICAL: Firebase getApps() returned an empty array, but an app instance was expected.";
        console.error(firebaseInitError);
        firebaseInitialized = false;
    }
  }
}

export { app, db, firebaseInitialized, firebaseInitError };

// Placeholder User ID for simplicity without full auth implementation
export const USER_ID = "defaultUser";
