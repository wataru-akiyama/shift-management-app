'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getCurrentUser } from '@/lib/firebase/auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  errorDetails: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  errorDetails: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setError(null);
        setErrorDetails(null);

        if (firebaseUser) {
          // Firebase認証ユーザーが存在する場合、Firestoreからユーザー情報を取得
          console.log('🔑 Firebase Auth成功 - UID:', firebaseUser.uid);
          console.log('📧 Email:', firebaseUser.email);

          const userData = await getCurrentUser(firebaseUser);

          if (userData) {
            console.log('✅ Firestoreからユーザー情報取得成功:', userData);
            setUser(userData);
            setFirebaseUser(firebaseUser);
          } else {
            // Firestoreにユーザードキュメントが存在しない
            console.error('❌ Firestoreにユーザードキュメントが見つかりません');
            console.error('UID:', firebaseUser.uid);
            setError('ユーザー情報が見つかりません');
            setErrorDetails(`Firestoreの「users」コレクションに、UID「${firebaseUser.uid}」のドキュメントが存在しません。Firebase Consoleで確認してください。`);
            setUser(null);
            setFirebaseUser(firebaseUser); // Firebase認証は成功しているので保持
          }
        } else {
          // ログアウト状態
          console.log('👋 ログアウト状態');
          setUser(null);
          setFirebaseUser(null);
        }
      } catch (err: any) {
        console.error('❌ 認証エラー:', err);
        setError('ユーザー情報の取得に失敗しました');
        setErrorDetails(err.message || 'Unknown error');
        setUser(null);
        setFirebaseUser(null);
      } finally {
        setLoading(false);
      }
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error, errorDetails }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
