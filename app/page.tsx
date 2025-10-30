'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // ログイン済みの場合、役割に応じてリダイレクト
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/tester/dashboard');
        }
      } else {
        // 未ログインの場合、ログイン画面へ
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // ローディング中の表示
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}
