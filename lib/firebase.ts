import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 設定値はクライアントに公開される識別子のため直書きで問題なし
// セキュリティは Firestore のセキュリティルールで担保する
const firebaseConfig = {
  apiKey: 'AIzaSyAN-X3oTM_oKOajuw9freAZQRcVbaFSFi8',
  authDomain: 'habit-app-d85e6.firebaseapp.com',
  projectId: 'habit-app-d85e6',
  storageBucket: 'habit-app-d85e6.firebasestorage.app',
  messagingSenderId: '918727217279',
  appId: '1:918727217279:web:a7e0a0fca69effb2582f4a',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// getAuth は apiKey を即時検証するため SSR で失敗する
// 各コンポーネント・フックの useEffect 内または イベントハンドラー内で呼び出す
