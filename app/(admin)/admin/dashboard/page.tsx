'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { getShifts } from '@/lib/firebase/shifts';
import { getAttendances } from '@/lib/firebase/attendance';
import { getShiftRequestsByStatus } from '@/lib/firebase/shiftRequests';
import { getTesters } from '@/lib/firebase/testers';
import { getProjects } from '@/lib/firebase/projects';
import { Shift, Attendance, User, Project } from '@/types';
import { Card, Button } from '@/components';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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

    // 管理者以外はテスターダッシュボードへ
    if (!loading && user && user.role !== 'admin') {
      router.push('/tester/dashboard');
    }

    // データを取得
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, loading, error]);

  const fetchData = async () => {
    try {
      setDataLoading(true);

      const [shiftsData, attendancesData, pendingRequests, testersData, projectsData] = await Promise.all([
        getShifts(),
        getAttendances(),
        getShiftRequestsByStatus('pending'),
        getTesters(),
        getProjects(),
      ]);

      setShifts(shiftsData);
      setAttendances(attendancesData);
      setPendingRequestsCount(pendingRequests.length);
      setUsers(testersData);
      setProjects(projectsData);
    } catch (err) {
      console.error('データ取得エラー:', err);
    } finally {
      setDataLoading(false);
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

  // 統計情報を計算
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();

  // 今日のシフト
  const todayShifts = shifts.filter((s) => s.date.toDateString() === todayStr);

  // 今日の出勤状況
  const todayAttendances = attendances.filter((a) => a.date.toDateString() === todayStr);
  const clockedInCount = todayAttendances.filter((a) => a.clockInTime).length;

  // 今週のシフト
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekShifts = shifts.filter((s) => {
    const shiftDate = new Date(s.date);
    return shiftDate >= startOfWeek && shiftDate <= endOfWeek;
  });

  // 今月のシフト
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthShifts = shifts.filter((s) => {
    const shiftDate = new Date(s.date);
    return shiftDate >= startOfMonth && shiftDate <= endOfMonth;
  });

  // ユーザー名とプロジェクト名のマップ
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  if (loading || dataLoading) {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 今日のシフト */}
          <Card title="今日のシフト">
            <p className="text-gray-600 text-sm mb-4">本日の予定されているシフト</p>
            <p className="text-3xl font-bold text-primary-600 mb-2">{todayShifts.length}件</p>
            <Link href="/admin/shifts" className="text-sm text-blue-600 hover:text-blue-800">
              詳細を見る →
            </Link>
          </Card>

          {/* 今日の出勤状況 */}
          <Card title="今日の出勤状況">
            <p className="text-gray-600 text-sm mb-4">本日の打刻済み人数</p>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {clockedInCount} / {todayShifts.length}名
            </p>
            <Link href="/admin/attendance" className="text-sm text-blue-600 hover:text-blue-800">
              詳細を見る →
            </Link>
          </Card>

          {/* 未承認のシフト希望 */}
          <Card title="未承認のシフト申請">
            <p className="text-gray-600 text-sm mb-4">承認待ちの申請件数</p>
            <p className="text-3xl font-bold text-orange-600 mb-2">{pendingRequestsCount}件</p>
            <Link href="/admin/shift-requests" className="text-sm text-blue-600 hover:text-blue-800">
              詳細を見る →
            </Link>
          </Card>

          {/* 今週のシフト */}
          <Card title="今週のシフト">
            <p className="text-gray-600 text-sm mb-4">今週のシフト総数</p>
            <p className="text-3xl font-bold text-purple-600 mb-2">{weekShifts.length}件</p>
            <Link href="/admin/shifts/calendar" className="text-sm text-blue-600 hover:text-blue-800">
              カレンダーを見る →
            </Link>
          </Card>
        </div>

        {/* 今日のシフト詳細 */}
        {todayShifts.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">今日のシフト詳細</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      テスター
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      案件
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      出勤状況
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todayShifts.map((shift) => {
                    const attendance = todayAttendances.find((a) => a.shiftId === shift.id);
                    return (
                      <tr key={shift.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {userMap.get(shift.testerId) || '不明'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {projectMap.get(shift.projectId) || '不明'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {shift.startTime} 〜 {shift.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendance?.clockInTime && attendance?.clockOutTime ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              退勤済み
                            </span>
                          ) : attendance?.clockInTime ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              出勤中
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              未出勤
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* クイックアクセス */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">クイックアクセス</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/projects">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">📋 案件管理</h4>
                <p className="text-sm text-gray-600">案件の登録・編集・削除</p>
              </Card>
            </Link>

            <Link href="/admin/shift-requests">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">📝 シフト申請管理</h4>
                <p className="text-sm text-gray-600">シフト申請の承認・却下</p>
              </Card>
            </Link>

            <Link href="/admin/shifts">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">📅 シフト管理</h4>
                <p className="text-sm text-gray-600">シフトの確認・承認・編集</p>
              </Card>
            </Link>

            <Link href="/admin/attendance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">⏰ 出退勤管理</h4>
                <p className="text-sm text-gray-600">打刻記録の確認・修正</p>
              </Card>
            </Link>

            <Link href="/admin/payroll">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">💰 給与管理</h4>
                <p className="text-sm text-gray-600">給与計算・レポート</p>
              </Card>
            </Link>

            <Link href="/admin/testers">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <h4 className="font-bold text-gray-900 mb-2">👥 テスター管理</h4>
                <p className="text-sm text-gray-600">テスターの登録・編集</p>
              </Card>
            </Link>

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
