/**
 * JyotishaSutra Admin Dashboard — Firebase Auth Setup.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';

// Firebase Client SDK Configuration matching the main application
const firebaseConfig = {
  apiKey: "AIzaSyBngPVS1uH69_QbIUVZr_Dpu7jNcngUe7U",
  authDomain: "astrosutraai-b524e.firebaseapp.com",
  projectId: "astrosutraai-b524e",
  storageBucket: "astrosutraai-b524e.firebasestorage.app",
  messagingSenderId: "29791277131",
  appId: "1:29791277131:web:641a2e6b6216b959d43dce",
  measurementId: "G-59WZT4JJQY"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider for Google sign-in
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, signInWithEmailAndPassword };
export type { User };
