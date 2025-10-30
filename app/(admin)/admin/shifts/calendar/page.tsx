'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getShifts } from '@/lib/firebase/shifts';
import { getTesters } from '@/lib/firebase/testers';
import { getProjects } from '@/lib/firebase/projects';
import { Shift, User, Project } from '@/types';

type ViewMode = 'month' | 'week' | 'day';

export default function AdminShiftsCalendarPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user?.role !== 'admin') {
      router.push('/tester/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [shiftsData, testersData, projectsData] = await Promise.all([
        getShifts(),
        getTesters(),
        getProjects(),
      ]);
      setShifts(shiftsData);
      setUsers(testersData);
      setProjects(projectsData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      alert('データの取得に失敗しました');
    } finally {
      setDataLoading(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '不明';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return { year, month, days };
  };

  const getShiftsForTesterAndDate = (testerId: string, date: Date) => {
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shift.testerId === testerId &&
        shiftDate.getFullYear() === date.getFullYear() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getDate() === date.getDate()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { year, month, days } = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 案件別集計
  const projectSummary = projects.map((project) => {
    const projectShifts = shifts.filter((s) => s.projectId === project.id);
    const totalHours = projectShifts.reduce((sum, s) => sum + s.expectedWorkHours, 0);
    const remainingHours = project.requiredHours - totalHours;

    return {
      projectId: project.id,
      projectName: project.name,
      requiredHours: project.requiredHours,
      confirmedHours: totalHours,
      remainingHours,
    };
  });

  if (loading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">シフトカレンダー（管理者）</h1>
        <Link
          href="/admin/shifts"
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          一覧表示に戻る
        </Link>
      </div>

      {/* 月選択とビュー切替 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={previousMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            ← 前月
          </button>
          <h2 className="text-2xl font-bold">
            {year}年 {month + 1}月
          </h2>
          <button
            onClick={nextMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            次月 →
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded ${
              viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            月表示
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded ${
              viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            disabled
          >
            週表示（未実装）
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded ${
              viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            disabled
          >
            日表示（未実装）
          </button>
        </div>
      </div>

      {/* 案件別集計 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">案件別集計</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  案件名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  必要時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  確定済み
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  残り
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  進捗
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectSummary.map((summary) => {
                const progress = summary.requiredHours > 0
                  ? (summary.confirmedHours / summary.requiredHours) * 100
                  : 0;

                return (
                  <tr key={summary.projectId}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {summary.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {summary.requiredHours}時間
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {summary.confirmedHours}時間
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {summary.remainingHours}時間
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* シフトカレンダー（テスター×日付グリッド） */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-r sticky left-0 bg-gray-100 z-10 min-w-32">
                テスター
              </th>
              {days.map((date) => {
                const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                return (
                  <th
                    key={date.toISOString()}
                    className={`px-2 py-2 text-center font-semibold border-r min-w-24 ${
                      isToday ? 'bg-blue-100' : ''
                    } ${isSunday ? 'text-red-600' : isSaturday ? 'text-blue-600' : 'text-gray-700'}`}
                  >
                    <div>{date.getDate()}</div>
                    <div className="text-xs font-normal">
                      {['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {users.map((tester) => (
              <tr key={tester.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900 border-r sticky left-0 bg-white z-10">
                  {tester.name}
                </td>
                {days.map((date) => {
                  const dayShifts = getShiftsForTesterAndDate(tester.id, date);
                  const isToday =
                    date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

                  return (
                    <td
                      key={date.toISOString()}
                      className={`px-1 py-1 text-xs border-r ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="bg-green-100 border border-green-300 rounded p-1 mb-1"
                        >
                          <div className="font-semibold text-green-800 truncate text-xs">
                            {getProjectName(shift.projectId)}
                          </div>
                          <div className="text-green-700 text-xs">
                            {shift.startTime.substring(0, 5)}-{shift.endTime.substring(0, 5)}
                          </div>
                          <div className="text-green-600 text-xs">
                            {shift.expectedWorkHours}h
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
