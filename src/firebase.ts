import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  storageBucket: (firebaseConfigData as any).storageBucket,
  messagingSenderId: (firebaseConfigData as any).messagingSenderId,
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
  console.error('Firebase configuration is missing. Please set your environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.) on Vercel.');
}

if (isConfigValid && !firebaseConfig.authDomain) {
  console.warn('Firebase authDomain is missing. Google Sign-In may fail. Please set VITE_FIREBASE_AUTH_DOMAIN on Vercel.');
}

const app = isConfigValid ? initializeApp(firebaseConfig) : null;
const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
console.log('Using Firestore Database ID:', databaseId);
export const db = app ? getFirestore(app, databaseId) : (null as any);
export const auth = app ? getAuth(app) : (null as any);
export const googleProvider = new GoogleAuthProvider();

// Test connection to Firestore
import { getDocFromServer, doc } from 'firebase/firestore';

async function testConnection() {
  if (!db) return;
  try {
    // Attempt to fetch a non-existent document from a test collection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("CRITICAL: Firestore connection failed. The client is offline. This usually indicates an incorrect Firebase configuration or network issue.");
      console.error("Check your firebase-applet-config.json and ensure the projectId and apiKey are correct.");
    }
    // Other errors (like permission denied) are expected since we're fetching a random path
  }
}

if (app) {
  testConnection();
}
