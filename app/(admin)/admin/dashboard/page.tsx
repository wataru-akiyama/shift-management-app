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
    <div style={{ backgroundColor: 'red', minHeight: '100vh', padding: '50px' }}>
      <h1 style={{ color: 'white', fontSize: '50px' }}>テストページ - このテキストが見えますか？</h1>
      <p style={{ color: 'white', fontSize: '30px' }}>見えていれば、ファイルは正しく読み込まれています</p>
    </div>
  );
}
