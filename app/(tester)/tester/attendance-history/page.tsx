'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAttendancesByTester } from '@/lib/firebase/attendance';
import { getShiftsByTester } from '@/lib/firebase/shifts';
import { getProjects } from '@/lib/firebase/projects';
import { Attendance, Shift, Project } from '@/types';

type ViewMode = 'calendar' | 'list';

export default function TesterAttendanceHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user?.role !== 'tester') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setDataLoading(true);
      const [attendancesData, shiftsData, projectsData] = await Promise.all([
        getAttendancesByTester(user.id),
        getShiftsByTester(user.id),
        getProjects(),
      ]);
      setAttendances(attendancesData);
      setShifts(shiftsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      alert('データの取得に失敗しました');
    } finally {
      setDataLoading(false);
    }
  };

  const getProjectName = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return '不明';
    const project = projects.find((p) => p.id === shift.projectId);
    return project?.name || '不明';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { year, month, daysInMonth, startDayOfWeek };
  };

  const getAttendanceForDate = (date: Date) => {
    return attendances.find((a) => {
      const aDate = new Date(a.date);
      return (
        aDate.getFullYear() === date.getFullYear() &&
        aDate.getMonth() === date.getMonth() &&
        aDate.getDate() === date.getDate()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const { year, month, daysInMonth, startDayOfWeek } = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  // 前月の空白
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  // 当月の日付
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // リスト表示用のデータ（最新順）
  const sortedAttendances = [...attendances].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (loading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">出退勤履歴</h1>
      </div>

      {/* 表示切替とナビゲーション */}
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
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded ${
              viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            📅 カレンダー表示
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${
              viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            📋 リスト表示
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* カレンダー表示 */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={day}
                className={`p-2 text-center font-semibold ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="border border-gray-200 p-2 bg-gray-50 min-h-32"></div>;
              }

              const date = new Date(year, month, day);
              const attendance = getAttendanceForDate(date);
              const isToday =
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();
              const dayOfWeek = date.getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <div
                  key={day}
                  className={`border border-gray-200 p-2 min-h-32 ${
                    isToday ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      isSunday ? 'text-red-600' : isSaturday ? 'text-blue-600' : 'text-gray-700'
                    } ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}
                  >
                    {day}
                  </div>
                  {attendance && (
                    <div className="text-xs">
                      {attendance.recordedClockInTime && attendance.recordedClockOutTime ? (
                        <>
                          <div className="font-semibold text-gray-800 mb-1">
                            {getProjectName(attendance.shiftId)}
                          </div>
                          <div className="text-green-700">
                            出勤: {formatTime(attendance.recordedClockInTime)}
                          </div>
                          <div className="text-blue-700">
                            退勤: {formatTime(attendance.recordedClockOutTime)}
                          </div>
                          <div className="text-gray-700 font-semibold mt-1">
                            {attendance.actualWorkHours ? `${attendance.actualWorkHours}時間` : '-'}
                          </div>
                        </>
                      ) : attendance.recordedClockInTime ? (
                        <>
                          <div className="font-semibold text-gray-800 mb-1">
                            {getProjectName(attendance.shiftId)}
                          </div>
                          <div className="text-green-700">
                            出勤: {formatTime(attendance.recordedClockInTime)}
                          </div>
                          <div className="text-orange-600 mt-1">
                            退勤待ち
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* リスト表示 */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sortedAttendances.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              出退勤記録がありません
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    案件
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出勤時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    退勤時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    休憩
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    稼働時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAttendances.map((attendance) => (
                  <tr key={attendance.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(attendance.date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        weekday: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getProjectName(attendance.shiftId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatTime(attendance.recordedClockInTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatTime(attendance.recordedClockOutTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.breakHours ? `${attendance.breakHours}時間` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {attendance.actualWorkHours ? `${attendance.actualWorkHours}時間` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.recordedClockInTime && attendance.recordedClockOutTime ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          確定
                        </span>
                      ) : attendance.recordedClockInTime ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          退勤待ち
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          未確定
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/tester/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
