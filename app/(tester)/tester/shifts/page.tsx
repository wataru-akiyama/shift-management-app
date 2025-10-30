'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getShiftsByTester } from '@/lib/firebase/shifts';
import { getProjects } from '@/lib/firebase/projects';
import { Shift, Project } from '@/types';

export default function TesterShiftsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
      setShiftsLoading(true);
      const [shiftsData, projectsData] = await Promise.all([
        getShiftsByTester(user.id),
        getProjects(),
      ]);
      setShifts(shiftsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      alert('データの取得に失敗しました');
    } finally {
      setShiftsLoading(false);
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
    const startDayOfWeek = firstDay.getDay();

    return { year, month, daysInMonth, startDayOfWeek };
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return (
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

  if (loading || shiftsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">シフトカレンダー</h1>
      </div>

      {/* 月選択 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
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
      </div>

      {/* カレンダー */}
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
              return <div key={`empty-${index}`} className="border border-gray-200 p-2 bg-gray-50 min-h-24"></div>;
            }

            const date = new Date(year, month, day);
            const dayShifts = getShiftsForDate(date);
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
                className={`border border-gray-200 p-2 min-h-24 ${
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
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="text-xs bg-green-100 border border-green-300 rounded p-1 mb-1"
                  >
                    <div className="font-semibold text-green-800 truncate">
                      {getProjectName(shift.projectId)}
                    </div>
                    <div className="text-green-700">
                      {shift.startTime} - {shift.endTime}
                    </div>
                    <div className="text-green-600">
                      {shift.expectedWorkHours}時間
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

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
