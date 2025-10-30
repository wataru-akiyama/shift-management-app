'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAttendances, formatTime } from '@/lib/firebase/attendance';
import { getTesters } from '@/lib/firebase/testers';
import { getShifts } from '@/lib/firebase/shifts';
import { getProjects } from '@/lib/firebase/projects';
import { Attendance, User, Shift, Project } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

interface AttendanceWithDetails extends Attendance {
  testerName: string;
  projectName: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [attendances, setAttendances] = useState<AttendanceWithDetails[]>([]);
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
      fetchAttendances();
    }
  }, [user, authLoading, router]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      setError(null);

      // 並列で取得
      const [attendancesData, testersData, shiftsData, projectsData] = await Promise.all([
        getAttendances(),
        getTesters(),
        getShifts(),
        getProjects(),
      ]);

      // マップを作成
      const testerMap = new Map(testersData.map((t) => [t.id, t]));
      const shiftMap = new Map(shiftsData.map((s) => [s.id, s]));
      const projectMap = new Map(projectsData.map((p) => [p.id, p]));

      // 詳細情報を追加
      const attendancesWithDetails: AttendanceWithDetails[] = attendancesData.map((attendance) => {
        const shift = shiftMap.get(attendance.shiftId);
        const projectId = shift?.projectId;
        return {
          ...attendance,
          testerName: testerMap.get(attendance.testerId)?.name || '不明',
          projectName: projectId ? (projectMap.get(projectId)?.name || '不明') : '不明',
        };
      });

      setAttendances(attendancesWithDetails);
    } catch (err) {
      console.error('出退勤記録取得エラー:', err);
      setError('出退勤記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング
  const filteredAttendances = filterDate
    ? attendances.filter((attendance) => {
        const attendanceDate = attendance.date.toISOString().split('T')[0];
        return attendanceDate === filterDate;
      })
    : attendances;

  // 統計情報
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayAttendances = attendances.filter(
    (a) => a.date.toISOString().split('T')[0] === todayStr
  );
  const unconfirmedCount = attendances.filter(
    (a) => !a.recordedClockInTime || !a.recordedClockOutTime
  ).length;

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
          <div>
            <h1 className="text-2xl font-bold">出退勤管理</h1>
            <p className="text-sm text-primary-100">打刻記録の確認・修正</p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="text-sm text-gray-600 mb-1">総記録数</div>
            <div className="text-3xl font-bold text-gray-900">{attendances.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">今日の出勤</div>
            <div className="text-3xl font-bold text-green-600">{todayAttendances.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">未確定記録</div>
            <div className="text-3xl font-bold text-orange-600">{unconfirmedCount}</div>
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

        {/* 出退勤記録一覧 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">出退勤記録一覧</h2>

          {filteredAttendances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">
                {filterDate
                  ? '指定された日付の出退勤記録がありません'
                  : '出退勤記録がありません'}
              </p>
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
                      打刻時刻
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      確定時刻
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      実働時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendances.map((attendance) => {
                    const isConfirmed = attendance.recordedClockInTime && attendance.recordedClockOutTime;
                    return (
                      <tr key={attendance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.date.toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              weekday: 'short',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{attendance.testerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{attendance.projectName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {attendance.clockInTime && formatTime(attendance.clockInTime)}
                            {' 〜 '}
                            {attendance.clockOutTime ? formatTime(attendance.clockOutTime) : '未退勤'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {attendance.recordedClockInTime && formatTime(attendance.recordedClockInTime)}
                            {attendance.recordedClockInTime && ' 〜 '}
                            {attendance.recordedClockOutTime && formatTime(attendance.recordedClockOutTime)}
                            {!attendance.recordedClockInTime && !attendance.recordedClockOutTime && '未確定'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {attendance.actualWorkHours !== undefined
                              ? `${attendance.actualWorkHours}時間`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isConfirmed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {isConfirmed ? '確定済み' : '未確定'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/attendance/${attendance.id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            編集
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
