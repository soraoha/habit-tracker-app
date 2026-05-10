import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  getAuth,
} from 'firebase/auth';
import { app } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    // ログイン後のリダイレクト結果を処理する
    getRedirectResult(auth).catch(() => {
      // リダイレクト結果がない場合は無視
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const auth = getAuth(app);
    // ポップアップではなくリダイレクト方式を使用（GitHub Pages との相性が良い）
    await signInWithRedirect(auth, googleProvider);
  };

  const logOut = async () => {
    const auth = getAuth(app);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
