'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { Card, Button } from '@/components';

export default function TesterDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'tester') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

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

  if (!user || user.role !== 'tester') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">シフト管理アプリ</h1>
              <p className="text-sm text-primary-100">テスターダッシュボード</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{user.name}さん</span>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ようこそ、{user.name}さん
          </h2>
          <p className="text-gray-600">
            テスターダッシュボードへようこそ。シフト希望の提出、確定シフトの確認、出退勤記録、給与確認などができます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 今日のシフト */}
          <Card title="今日のシフト">
            <p className="text-gray-600 text-sm mb-4">本日の勤務予定</p>
            <p className="text-lg text-gray-700 mb-2">予定なし</p>
            <p className="text-sm text-gray-500">実装予定</p>
          </Card>

          {/* 今週のシフト */}
          <Card title="今週のシフト">
            <p className="text-gray-600 text-sm mb-4">今週の勤務予定</p>
            <p className="text-3xl font-bold text-primary-600 mb-2">0日</p>
            <p className="text-sm text-gray-500">実装予定</p>
          </Card>
        </div>

        {/* クイックアクセス */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">メニュー</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">📅 シフト希望提出</h4>
              <p className="text-sm text-gray-600">シフト希望を提出・編集</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">📆 シフト確認</h4>
              <p className="text-sm text-gray-600">確定したシフトを確認</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">📱 QRコード</h4>
              <p className="text-sm text-gray-600">出退勤用QRコードを表示</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">⏰ 出退勤履歴</h4>
              <p className="text-sm text-gray-600">打刻履歴を確認</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">💰 給与確認</h4>
              <p className="text-sm text-gray-600">給与明細を確認</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
