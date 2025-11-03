'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getShifts } from '@/lib/firebase/shifts';
import { getAttendances } from '@/lib/firebase/attendance';
import { getShiftRequestsByStatus } from '@/lib/firebase/shiftRequests';
import { getTesters } from '@/lib/firebase/testers';
import { getProjects } from '@/lib/firebase/projects';
import { Shift, Attendance, User, Project } from '@/types';
import { Card, AdminLayout } from '@/components';
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
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div>
          <h1 className="text-3xl font-bold text-red-900">🎉 新しいダッシュボード 🎉</h1>
          <p className="text-gray-600 mt-1">
            ようこそ、{user.name}さん。システム全体の概要を確認できます。
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="p-8">

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 今日のシフト */}
          <Link href="/admin/shifts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">今日のシフト</p>
                  <p className="text-4xl font-bold text-primary-600">{todayShifts.length}</p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
              <p className="text-sm text-gray-500">本日予定されているシフト</p>
            </Card>
          </Link>

          {/* 今日の出勤状況 */}
          <Link href="/admin/attendance">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">出勤状況</p>
                  <p className="text-4xl font-bold text-green-600">
                    {clockedInCount}<span className="text-2xl text-gray-400">/{todayShifts.length}</span>
                  </p>
                </div>
                <div className="text-3xl">⏰</div>
              </div>
              <p className="text-sm text-gray-500">本日の打刻済み人数</p>
            </Card>
          </Link>

          {/* 未承認のシフト申請 */}
          <Link href="/admin/shift-requests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">未承認申請</p>
                  <p className="text-4xl font-bold text-orange-600">{pendingRequestsCount}</p>
                </div>
                <div className="text-3xl">📝</div>
              </div>
              <p className="text-sm text-gray-500">承認待ちの申請件数</p>
            </Card>
          </Link>

          {/* 今週のシフト */}
          <Link href="/admin/shifts/calendar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">今週のシフト</p>
                  <p className="text-4xl font-bold text-purple-600">{weekShifts.length}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
              <p className="text-sm text-gray-500">今週のシフト総数</p>
            </Card>
          </Link>
        </div>

        {/* 今日のシフト詳細 */}
        {todayShifts.length > 0 ? (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">今日のシフト詳細</h3>
              <Link
                href="/admin/shifts"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                すべて見る →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      テスター
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      案件
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出勤状況
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todayShifts.map((shift) => {
                    const attendance = todayAttendances.find((a) => a.shiftId === shift.id);
                    return (
                      <tr key={shift.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {userMap.get(shift.testerId) || '不明'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {projectMap.get(shift.projectId) || '不明'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {shift.startTime} 〜 {shift.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendance?.clockInTime && attendance?.clockOutTime ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              退勤済み
                            </span>
                          ) : attendance?.clockInTime ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              出勤中
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">今日のシフトはありません</p>
              <Link href="/admin/shifts/new">
                <span className="text-sm text-primary-600 hover:text-primary-700">
                  新しいシフトを作成する
                </span>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </AdminLayout>
  );
}
