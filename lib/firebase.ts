import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwrVpys6cxJHMuc67ovAba5FlsoxfpXUs",
  authDomain: "rice-padbuddy.firebaseapp.com",
  databaseURL: "https://rice-padbuddy-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rice-padbuddy",
  storageBucket: "rice-padbuddy.firebasestorage.app",
  messagingSenderId: "158398031046",
  appId: "1:158398031046:web:b666a7b3a3b72eb2c263c7",
  measurementId: "G-ZN52QCW2YR"
};

// Initialize Firebase (avoid duplicate initialization)
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const functions = getFunctions(app);

// Set auth persistence to LOCAL for PWA support
// This ensures auth state persists even when app is closed
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Auth persistence error:", error);
  });
}

// Analytics is only available in the browser
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Messaging (FCM) is only available in the browser
let messaging: Messaging | null = null;
if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error);
  }
}

export { app, auth, db, database, functions, analytics, messaging };
// Alias for compatibility with code expecting 'firestore' export
export const firestore = db;
