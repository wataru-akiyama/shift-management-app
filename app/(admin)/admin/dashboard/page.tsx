'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { Card, Button } from '@/components';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/tester/dashboard');
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

  if (!user || user.role !== 'admin') {
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
              <p className="text-sm text-primary-100">管理者ダッシュボード</p>
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
            管理者ダッシュボードへようこそ。ここからシフト管理、出退勤管理、給与計算などの各機能にアクセスできます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 今日のシフト */}
          <Card title="今日のシフト">
            <p className="text-gray-600 text-sm mb-4">本日の予定されているシフト</p>
            <p className="text-3xl font-bold text-primary-600 mb-2">0件</p>
            <p className="text-sm text-gray-500">実装予定</p>
          </Card>

          {/* 今日の出勤状況 */}
          <Card title="今日の出勤状況">
            <p className="text-gray-600 text-sm mb-4">本日の打刻状況</p>
            <p className="text-3xl font-bold text-green-600 mb-2">0名</p>
            <p className="text-sm text-gray-500">実装予定</p>
          </Card>

          {/* 未承認のシフト希望 */}
          <Card title="未承認のシフト希望">
            <p className="text-gray-600 text-sm mb-4">承認待ちの希望件数</p>
            <p className="text-3xl font-bold text-orange-600 mb-2">0件</p>
            <p className="text-sm text-gray-500">実装予定</p>
          </Card>
        </div>

        {/* クイックアクセス */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">クイックアクセス</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">📋 案件管理</h4>
              <p className="text-sm text-gray-600">案件の登録・編集・削除</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">📅 シフト管理</h4>
              <p className="text-sm text-gray-600">シフトの確認・承認・編集</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">⏰ 出退勤管理</h4>
              <p className="text-sm text-gray-600">打刻記録の確認・修正</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">💰 給与管理</h4>
              <p className="text-sm text-gray-600">給与計算・レポート</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">👥 テスター管理</h4>
              <p className="text-sm text-gray-600">テスターの登録・編集</p>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">⚙️ システム設定</h4>
              <p className="text-sm text-gray-600">休憩時間などの設定</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
