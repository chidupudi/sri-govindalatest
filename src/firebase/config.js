// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0zh3LEf2l_LlphWPvDgQssRcQiqaBvBY",
  authDomain: "sri-govinda-62058.firebaseapp.com",
  projectId: "sri-govinda-62058",
  storageBucket: "sri-govinda-62058.firebasestorage.app",
  messagingSenderId: "410911922071",
  appId: "1:410911922071:web:794cb7f5474ef4930a16d2",
  measurementId: "G-B6D880X09H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;