import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: (process.env as any).FIREBASE_API_KEY,
  authDomain: (process.env as any).FIREBASE_AUTH_DOMAIN,
  projectId: (process.env as any).FIREBASE_PROJECT_ID,
  appId: (process.env as any).FIREBASE_APP_ID,
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
  console.error('Firebase configuration is missing. Please set your environment variables on Vercel.');
}

const app = isConfigValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app, (process.env as any).FIREBASE_DATABASE_ID) : (null as any);
export const auth = app ? getAuth(app) : (null as any);
export const googleProvider = new GoogleAuthProvider();
