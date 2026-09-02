import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyATACvzm3f0QI6nDfQM7IuujiwmtXrxvEU',
  authDomain:        'room-expendature.firebaseapp.com',
  projectId:         'room-expendature',
  storageBucket:     'room-expendature.firebasestorage.app',
  messagingSenderId: '1070191040983',
  appId:             '1:1070191040983:web:53abf6e4a9f54b7a251392',
  measurementId:     'G-4N1CM456VB',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db   = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<{ email: string; name: string; photoURL: string | null }> {
  const result = await signInWithPopup(auth, googleProvider);
  return {
    email:    result.user.email    || '',
    name:     result.user.displayName || result.user.email?.split('@')[0] || 'User',
    photoURL: result.user.photoURL,
  };
}

/**
 * Ensure there is an active Firebase Auth session so Firestore writes work.
 * Tries email/password first, falls back to anonymous auth.
 */
export async function ensureFirebaseAuthUser(email: string): Promise<void> {
  // If already signed in, skip
  if (auth.currentUser) return;

  const password = `EH_${btoa(email).slice(0, 16)}_2024`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return;
  } catch {}

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    return;
  } catch {}

  // Last resort — anonymous sign in just to get a token
  try {
    await signInAnonymously(auth);
  } catch (err) {
    console.warn('Firebase auth failed:', err);
  }
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export default app;
