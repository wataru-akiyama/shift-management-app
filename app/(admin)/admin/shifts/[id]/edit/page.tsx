'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getShift, updateShift, calculateWorkHours } from '@/lib/firebase/shifts';
import { getActiveProjects } from '@/lib/firebase/projects';
import { getActiveTesters } from '@/lib/firebase/testers';
import { Shift, Project, User } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function EditShiftPage() {
  const router = useRouter();
  const params = useParams();
  const shiftId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testers, setTesters] = useState<User[]>([]);
  const [testerId, setTesterId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, router, shiftId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [shiftData, projectsData, testersData] = await Promise.all([
        getShift(shiftId),
        getActiveProjects(),
        getActiveTesters(),
      ]);

      if (shiftData) {
        setShift(shiftData);
        setTesterId(shiftData.testerId);
        setProjectId(shiftData.projectId);
        setDate(shiftData.date.toISOString().split('T')[0]);
        setStartTime(shiftData.startTime);
        setEndTime(shiftData.endTime);
        setHourlyWage(shiftData.hourlyWage.toString());
      } else {
        setError('シフトが見つかりませんでした');
      }

      setProjects(projectsData);
      setTesters(testersData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!testerId || !projectId || !date || !startTime || !endTime || !hourlyWage) {
      setError('すべての項目を入力してください');
      return;
    }

    const wage = parseFloat(hourlyWage);
    if (isNaN(wage) || wage <= 0) {
      setError('時給は正の数値で入力してください');
      return;
    }

    if (startTime >= endTime) {
      setError('終了時刻は開始時刻より後にしてください');
      return;
    }

    const expectedWorkHours = calculateWorkHours(startTime, endTime);
    if (expectedWorkHours <= 0) {
      setError('勤務時間が正しくありません');
      return;
    }

    try {
      setSubmitting(true);
      await updateShift(shiftId, {
        testerId,
        projectId,
        date: new Date(date),
        startTime,
        endTime,
        hourlyWage: wage,
        expectedWorkHours,
      });

      alert('シフトを更新しました');
      router.push('/admin/shifts');
    } catch (err) {
      console.error('シフト更新エラー:', err);
      setError('シフトの更新に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
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

  if (!shift) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/admin/shifts" className="text-sm text-primary-100 hover:text-white mb-1 block">
              ← シフト一覧に戻る
            </Link>
            <h1 className="text-2xl font-bold">シフト編集</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || 'シフトが見つかりませんでした'}
            </div>
            <div className="mt-4">
              <Link href="/admin/shifts">
                <Button variant="secondary">シフト一覧に戻る</Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin/shifts" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← シフト一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">シフト編集</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="testerId" className="block text-sm font-medium text-gray-700 mb-2">
                テスター <span className="text-red-600">*</span>
              </label>
              <select
                id="testerId"
                required
                value={testerId}
                onChange={(e) => setTesterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="">テスターを選択</option>
                {testers.map((tester) => (
                  <option key={tester.id} value={tester.id}>
                    {tester.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                案件 <span className="text-red-600">*</span>
              </label>
              <select
                id="projectId"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="">案件を選択</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}（基本時給: ¥{project.baseHourlyWage.toLocaleString()}）
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                日付 <span className="text-red-600">*</span>
              </label>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  開始時刻 <span className="text-red-600">*</span>
                </label>
                <input
                  id="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  終了時刻 <span className="text-red-600">*</span>
                </label>
                <input
                  id="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            </div>

            {startTime && endTime && startTime < endTime && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  予定勤務時間: <strong>{calculateWorkHours(startTime, endTime)}時間</strong>
                </p>
              </div>
            )}

            <div>
              <label htmlFor="hourlyWage" className="block text-sm font-medium text-gray-700 mb-2">
                時給（円） <span className="text-red-600">*</span>
              </label>
              <input
                id="hourlyWage"
                type="number"
                required
                min="0"
                step="1"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="1000"
                disabled={submitting}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">登録情報</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>登録日: {shift.createdAt?.toLocaleDateString('ja-JP')}</li>
                <li>最終更新日: {shift.updatedAt?.toLocaleDateString('ja-JP')}</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? '更新中...' : '更新する'}
              </Button>
              <Link href="/admin/shifts" className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  キャンセル
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
