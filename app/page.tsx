'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AuthError } from '@/components';

export default function Home() {
  const router = useRouter();
  const { user, firebaseUser, loading, error, errorDetails } = useAuth();

  useEffect(() => {
    if (!loading && !error) {
      if (user) {
        // ログイン済みの場合、役割に応じてリダイレクト
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/tester/dashboard');
        }
      } else if (!firebaseUser) {
        // 完全に未ログインの場合のみ、ログイン画面へ
        router.push('/login');
      }
      // firebaseUserはいるけどuserがnullの場合は、エラー画面を表示（下記）
    }
  }, [user, firebaseUser, loading, error]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラーがある場合、エラー画面を表示
  if (error) {
    return (
      <AuthError
        error={error}
        errorDetails={errorDetails}
        uid={firebaseUser?.uid}
      />
    );
  }

  // それ以外の場合は読み込み中（リダイレクト待ち）
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  );
}
