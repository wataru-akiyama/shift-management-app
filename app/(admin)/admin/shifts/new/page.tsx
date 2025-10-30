'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createShift, calculateWorkHours } from '@/lib/firebase/shifts';
import { getActiveProjects } from '@/lib/firebase/projects';
import { getActiveTesters } from '@/lib/firebase/testers';
import { Project, User } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function NewShiftPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [testers, setTesters] = useState<User[]>([]);
  const [testerId, setTesterId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [projectsData, testersData] = await Promise.all([
        getActiveProjects(),
        getActiveTesters(),
      ]);
      setProjects(projectsData);
      setTesters(testersData);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setDataLoading(false);
    }
  };

  // 案件選択時に時給を自動設定
  const handleProjectChange = (selectedProjectId: string) => {
    setProjectId(selectedProjectId);
    const project = projects.find((p) => p.id === selectedProjectId);
    if (project) {
      setHourlyWage(project.baseHourlyWage.toString());
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
      setLoading(true);
      await createShift({
        testerId,
        projectId,
        date: new Date(date),
        startTime,
        endTime,
        hourlyWage: wage,
        expectedWorkHours,
      });

      alert('シフトを作成しました');
      router.push('/admin/shifts');
    } catch (err) {
      console.error('シフト作成エラー:', err);
      setError('シフトの作成に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
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
          <h1 className="text-2xl font-bold">シフト新規作成</h1>
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

            {projects.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                進行中の案件がありません。先に案件を登録してください。
              </div>
            )}

            {testers.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                アクティブなテスターがいません。先にテスターを登録してください。
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
                disabled={loading || testers.length === 0}
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
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading || projects.length === 0}
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
                disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                案件の基本時給が自動設定されます。必要に応じて変更してください。
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">シフト作成後の流れ</h3>
              <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                <li>テスターは出退勤管理画面で打刻できるようになります</li>
                <li>打刻データは給与計算に使用されます</li>
                <li>シフトは後から編集・削除可能です</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={loading || projects.length === 0 || testers.length === 0}
              >
                {loading ? '作成中...' : '作成する'}
              </Button>
              <Link href="/admin/shifts" className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
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
