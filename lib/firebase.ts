import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// initializeApp は apiKey を検証しないため SSR でも安全
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// getFirestore は apiKey を即時検証しないため SSR でも安全
export const db = getFirestore(app);

// getAuth は apiKey を即時検証するため SSR で失敗する。
// 各コンポーネントやフックの内部で呼び出し、モジュールロード時には呼ばない。
