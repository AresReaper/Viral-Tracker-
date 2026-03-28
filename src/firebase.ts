import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (process.env as any).FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (process.env as any).FIREBASE_AUTH_DOMAIN || (import.meta.env.VITE_FIREBASE_PROJECT_ID ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (process.env as any).FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (process.env as any).FIREBASE_APP_ID,
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
  console.error('Firebase configuration is missing. Please set your environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.) on Vercel.');
}

if (isConfigValid && !firebaseConfig.authDomain) {
  console.warn('Firebase authDomain is missing. Google Sign-In may fail. Please set VITE_FIREBASE_AUTH_DOMAIN on Vercel.');
}

const app = isConfigValid ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || (process.env as any).FIREBASE_DATABASE_ID) : (null as any);
export const auth = app ? getAuth(app) : (null as any);
export const googleProvider = new GoogleAuthProvider();
