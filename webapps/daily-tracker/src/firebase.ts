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

// Default Firebase Client Configuration (Can be customized via env vars or config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoApiKeyForDailyTrackerApp1234",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-tracker-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-tracker-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-tracker-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo1234567890"
};

// Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

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

// Save User Tracker Data to Firestore
export async function saveUserDataToCloud(userId: string, data: Partial<UserCloudData>): Promise<void> {
  if (!userId) return;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: Date.now()
    }, { merge: true });
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
