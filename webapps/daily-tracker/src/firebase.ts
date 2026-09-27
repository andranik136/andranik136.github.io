/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { Task, DailyNote } from './types';

import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDUFVfKj1Nh7mzfyk1dDIg1VkvKmng8-2U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-tracker-6f396.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-tracker-6f396",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-tracker-6f396.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "750983435029",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:750983435029:web:da532850a11dc85e9b4f1c",
  measurementId: "G-RND51M713B"
};

export const RECAPTCHA_SITE_KEY = "6LeSLdItAAAAAKZyAAKQpdVr22ejDyKKQ7cABnbu";

// Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase App Check with reCAPTCHA Enterprise
if (typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('Firebase App Check initialization warning:', err);
  }
}

// Enable offline persistence for Firestore if supported
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, Firestore persistence enabled in first tab only.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support Firestore offline persistence.');
    }
  });
} catch (e) {
  // Ignore fallback errors
}

// Data Interface for Firestore Document
export interface UserCloudData {
  tasks: Task[];
  notes: Record<string, DailyNote>;
  theme?: 'dark' | 'light';
  updatedAt: number;
}

const MAX_NOTE_LENGTH = 10000;

// Helper function to strip undefined values and enforce max note length to protect Firestore storage
function sanitizeData(data: Partial<UserCloudData>): Partial<UserCloudData> {
  const clean: Partial<UserCloudData> = JSON.parse(JSON.stringify(data));
  if (clean.notes && typeof clean.notes === 'object') {
    for (const key of Object.keys(clean.notes)) {
      if (clean.notes[key]?.content && typeof clean.notes[key].content === 'string') {
        if (clean.notes[key].content.length > MAX_NOTE_LENGTH) {
          clean.notes[key].content = clean.notes[key].content.slice(0, MAX_NOTE_LENGTH);
        }
      }
    }
  }
  return clean;
}

// Save User Tracker Data to Firestore
export async function saveUserDataToCloud(userId: string, data: Partial<UserCloudData>): Promise<void> {
  if (!userId) return;
  try {
    const userDocRef = doc(db, 'users', userId);
    const cleanData = sanitizeData({
      ...data,
      updatedAt: Date.now()
    });
    await setDoc(userDocRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error saving user data to Firestore:', err);
    throw err;
  }
}

// Fetch User Tracker Data from Firestore
export async function fetchUserDataFromCloud(userId: string): Promise<UserCloudData | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserCloudData;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user data from Firestore:', err);
    return null;
  }
}

// Auth Helper Export Wrappers
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
export type { User };
