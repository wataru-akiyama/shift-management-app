'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getShifts, deleteShift } from '@/lib/firebase/shifts';
import { getProjects } from '@/lib/firebase/projects';
import { getTesters } from '@/lib/firebase/testers';
import { Shift, Project, User } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

interface ShiftWithDetails extends Shift {
  testerName: string;
  projectName: string;
}

export default function ShiftsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState('');

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchShifts();
    }
  }, [user, authLoading, router]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 並列で取得
      const [shiftsData, projectsData, testersData] = await Promise.all([
        getShifts(),
        getProjects(),
        getTesters(),
      ]);

      // プロジェクトとテスターのマップを作成
      const projectMap = new Map(projectsData.map((p) => [p.id, p]));
      const testerMap = new Map(testersData.map((t) => [t.id, t]));

      // シフトに詳細情報を追加
      const shiftsWithDetails: ShiftWithDetails[] = shiftsData.map((shift) => ({
        ...shift,
        testerName: testerMap.get(shift.testerId)?.name || '不明',
        projectName: projectMap.get(shift.projectId)?.name || '不明',
      }));

      setShifts(shiftsWithDetails);
    } catch (err) {
      console.error('シフト取得エラー:', err);
      setError('シフトの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shiftId: string) => {
    if (!confirm('このシフトを削除してもよろしいですか？')) {
      return;
    }

    try {
      await deleteShift(shiftId);
      await fetchShifts();
      alert('シフトを削除しました');
    } catch (err) {
      console.error('シフト削除エラー:', err);
      alert('シフトの削除に失敗しました');
    }
  };

  // フィルタリング
  const filteredShifts = filterDate
    ? shifts.filter((shift) => {
        const shiftDate = shift.date.toISOString().split('T')[0];
        return shiftDate === filterDate;
      })
    : shifts;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin/dashboard" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← ダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">シフト管理</h1>
              <p className="text-sm text-primary-100">シフトの確認・編集・削除</p>
            </div>
            <Link href="/admin/shifts/new">
              <Button variant="secondary" size="lg">
                + 新規作成
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="text-sm text-gray-600 mb-1">総シフト数</div>
            <div className="text-3xl font-bold text-gray-900">{shifts.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">今日のシフト</div>
            <div className="text-3xl font-bold text-green-600">
              {
                shifts.filter(
                  (s) =>
                    s.date.toDateString() === new Date().toDateString()
                ).length
              }
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">今月のシフト</div>
            <div className="text-3xl font-bold text-blue-600">
              {
                shifts.filter((s) => {
                  const now = new Date();
                  return (
                    s.date.getMonth() === now.getMonth() &&
                    s.date.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
          </Card>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* フィルター */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="filterDate" className="text-sm font-medium text-gray-700">
              日付で絞り込み:
            </label>
            <input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {filterDate && (
              <Button variant="secondary" onClick={() => setFilterDate('')}>
                クリア
              </Button>
            )}
          </div>
        </Card>

        {/* シフト一覧 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">シフト一覧</h2>

          {filteredShifts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">
                {filterDate
                  ? '指定された日付のシフトがありません'
                  : 'シフトが登録されていません'}
              </p>
              <Link href="/admin/shifts/new">
                <Button variant="primary">最初のシフトを作成する</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
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
                      時給
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予定時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {shift.date.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            weekday: 'short',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shift.testerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shift.projectName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {shift.startTime} 〜 {shift.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ¥{shift.hourlyWage.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {shift.expectedWorkHours}時間
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/shifts/${shift.id}/qr`}
                          className="text-green-600 hover:text-green-900"
                        >
                          QR
                        </Link>
                        <Link
                          href={`/admin/shifts/${shift.id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(shift.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
