
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  type Firestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';
// import { getAuth, type Auth } from 'firebase/auth'; // If auth is needed later

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

if (!apiKey || !authDomain || !projectId) {
  throw new Error(
    "Missing essential Firebase configuration values (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID). " +
    "Please check your environment variables (e.g., .env.local) and ensure they are prefixed with NEXT_PUBLIC_."
  );
}

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId, 
};

let app: FirebaseApp;
let db: Firestore;
// let auth: Auth; // If auth is needed later

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
// auth = getAuth(app); // If auth is needed later

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    .then(() => {
      console.log("Firestore offline persistence enabled successfully.");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // This can happen if multiple tabs are open, persistence can only be enabled in one.
        // It's also possible it was already enabled.
        console.warn("Firestore offline persistence failed (failed-precondition). It might be enabled in another tab or was already enabled.");
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firestore offline persistence is not supported in this browser. The app will use in-memory cache.");
      } else {
        console.error("Error enabling Firestore offline persistence:", err);
      }
    });
}

export { app, db /*, auth */ };

// Placeholder User ID for simplicity without full auth implementation
export const USER_ID = "defaultUser";
