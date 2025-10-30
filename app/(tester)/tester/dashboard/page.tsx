'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { getShiftsByTester } from '@/lib/firebase/shifts';
import { Shift } from '@/types';
import { Card, Button } from '@/components';
import Link from 'next/link';

export default function TesterDashboard() {
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);

  useEffect(() => {
    // エラーがある場合、トップページにリダイレクト（エラー画面表示）
    if (!loading && error) {
      router.push('/');
      return;
    }

    // ユーザー情報がない場合、ログイン画面へ
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // テスター以外は管理者ダッシュボードへ
    if (!loading && user && user.role !== 'tester') {
      router.push('/admin/dashboard');
    }

    // シフトを取得
    if (user && user.role === 'tester') {
      fetchShifts();
    }
  }, [user, loading, error]);

  const fetchShifts = async () => {
    if (!user) return;

    try {
      setShiftsLoading(true);
      const data = await getShiftsByTester(user.id);
      setShifts(data);
    } catch (err) {
      console.error('シフト取得エラー:', err);
    } finally {
      setShiftsLoading(false);
    }
  };

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
            {shiftsLoading ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : (
              <>
                {(() => {
                  const today = new Date();
                  const todayStr = today.toDateString();
                  const todayShifts = shifts.filter((s) => s.date.toDateString() === todayStr);

                  if (todayShifts.length === 0) {
                    return <p className="text-lg text-gray-700 mb-2">予定なし</p>;
                  }

                  return todayShifts.map((shift) => (
                    <div key={shift.id} className="mb-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {shift.startTime} 〜 {shift.endTime}
                      </p>
                      <p className="text-sm text-gray-600">予定時間: {shift.expectedWorkHours}時間</p>
                    </div>
                  ));
                })()}
              </>
            )}
          </Card>

          {/* 今週のシフト */}
          <Card title="今週のシフト">
            <p className="text-gray-600 text-sm mb-4">今週の勤務予定</p>
            {shiftsLoading ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : (
              <>
                {(() => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);

                  const weekShifts = shifts.filter((s) => {
                    return s.date >= startOfWeek && s.date <= endOfWeek;
                  });

                  return (
                    <p className="text-3xl font-bold text-primary-600 mb-2">{weekShifts.length}日</p>
                  );
                })()}
              </>
            )}
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

            <Link href="/tester/attendance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">📱 出退勤打刻</h4>
                <p className="text-sm text-gray-600">QRコードで出退勤を打刻</p>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="font-bold text-gray-900 mb-2">⏰ 出退勤履歴</h4>
              <p className="text-sm text-gray-600">打刻履歴を確認</p>
            </Card>

            <Link href="/tester/payroll">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">💰 給与確認</h4>
                <p className="text-sm text-gray-600">給与明細を確認</p>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
