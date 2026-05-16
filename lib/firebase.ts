import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 'Auth' এর বদলে 'getAuth' হবে
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Next.js এর জন্য সেফ ইনিশিয়ালাইজেশন
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// সার্ভিসগুলো ইনিশিয়ালাইজ করুন
const db = getFirestore(app);
const auth = getAuth(app); // এখানে auth অবজেক্টটি তৈরি করা হলো

export { db, auth }; // ছোট হাতের 'auth' এক্সপোর্ট করুন