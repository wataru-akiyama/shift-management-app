'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAttendance, updateAttendance, formatTime, calculateWorkHours } from '@/lib/firebase/attendance';
import { getTester } from '@/lib/firebase/testers';
import { getShift } from '@/lib/firebase/shifts';
import { getProject } from '@/lib/firebase/projects';
import { Attendance } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function EditAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const attendanceId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [testerName, setTesterName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [recordedClockInTime, setRecordedClockInTime] = useState('');
  const [recordedClockOutTime, setRecordedClockOutTime] = useState('');
  const [breakHours, setBreakHours] = useState('');
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
  }, [user, authLoading, router, attendanceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const attendanceData = await getAttendance(attendanceId);

      if (!attendanceData) {
        setError('出退勤記録が見つかりませんでした');
        return;
      }

      setAttendance(attendanceData);

      // テスター情報と案件情報を取得
      const [tester, shift] = await Promise.all([
        getTester(attendanceData.testerId),
        getShift(attendanceData.shiftId),
      ]);

      if (tester) {
        setTesterName(tester.name);
      }

      if (shift) {
        const project = await getProject(shift.projectId);
        if (project) {
          setProjectName(project.name);
        }
      }

      // 確定時刻を設定（または打刻時刻をデフォルトとして使用）
      if (attendanceData.recordedClockInTime) {
        setRecordedClockInTime(toDatetimeLocal(attendanceData.recordedClockInTime));
      } else if (attendanceData.clockInTime) {
        setRecordedClockInTime(toDatetimeLocal(attendanceData.clockInTime));
      }

      if (attendanceData.recordedClockOutTime) {
        setRecordedClockOutTime(toDatetimeLocal(attendanceData.recordedClockOutTime));
      } else if (attendanceData.clockOutTime) {
        setRecordedClockOutTime(toDatetimeLocal(attendanceData.clockOutTime));
      }

      if (attendanceData.breakHours !== undefined) {
        setBreakHours(attendanceData.breakHours.toString());
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Date を datetime-local の形式に変換
  const toDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!recordedClockInTime || !recordedClockOutTime) {
      setError('出勤時刻と退勤時刻を入力してください');
      return;
    }

    const clockIn = new Date(recordedClockInTime);
    const clockOut = new Date(recordedClockOutTime);

    if (clockIn >= clockOut) {
      setError('退勤時刻は出勤時刻より後にしてください');
      return;
    }

    const breakHrs = parseFloat(breakHours || '0');
    if (isNaN(breakHrs) || breakHrs < 0) {
      setError('休憩時間は0以上の数値で入力してください');
      return;
    }

    try {
      setSubmitting(true);
      await updateAttendance(attendanceId, {
        recordedClockInTime: clockIn,
        recordedClockOutTime: clockOut,
        breakHours: breakHrs,
      });

      alert('出退勤記録を更新しました');
      router.push('/admin/attendance');
    } catch (err) {
      console.error('出退勤記録更新エラー:', err);
      setError('出退勤記録の更新に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  // 実働時間を計算して表示
  const calculateActualWorkHours = () => {
    if (!recordedClockInTime || !recordedClockOutTime) {
      return null;
    }

    const clockIn = new Date(recordedClockInTime);
    const clockOut = new Date(recordedClockOutTime);
    const workHrs = calculateWorkHours(clockIn, clockOut);
    const breakHrs = parseFloat(breakHours || '0');
    const actualHrs = workHrs - breakHrs;

    return {
      workHours: workHrs,
      actualWorkHours: actualHrs,
    };
  };

  const calculatedHours = calculateActualWorkHours();

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

  if (!attendance) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/admin/attendance" className="text-sm text-primary-100 hover:text-white mb-1 block">
              ← 出退勤記録一覧に戻る
            </Link>
            <h1 className="text-2xl font-bold">出退勤記録編集</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || '出退勤記録が見つかりませんでした'}
            </div>
            <div className="mt-4">
              <Link href="/admin/attendance">
                <Button variant="secondary">出退勤記録一覧に戻る</Button>
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
          <Link href="/admin/attendance" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← 出退勤記録一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">出退勤記録編集</h1>
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

            {/* 基本情報 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">基本情報</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>テスター: {testerName}</li>
                <li>案件: {projectName}</li>
                <li>日付: {attendance.date.toLocaleDateString('ja-JP')}</li>
              </ul>
            </div>

            {/* 打刻時刻（参考） */}
            {(attendance.clockInTime || attendance.clockOutTime) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">打刻時刻（参考）</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {attendance.clockInTime && (
                    <li>出勤打刻: {formatTime(attendance.clockInTime)}</li>
                  )}
                  {attendance.clockOutTime && (
                    <li>退勤打刻: {formatTime(attendance.clockOutTime)}</li>
                  )}
                </ul>
              </div>
            )}

            {/* 確定時刻 */}
            <div>
              <label htmlFor="recordedClockInTime" className="block text-sm font-medium text-gray-700 mb-2">
                出勤時刻（確定） <span className="text-red-600">*</span>
              </label>
              <input
                id="recordedClockInTime"
                type="datetime-local"
                required
                value={recordedClockInTime}
                onChange={(e) => setRecordedClockInTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={submitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                給与計算に使用される正式な出勤時刻
              </p>
            </div>

            <div>
              <label htmlFor="recordedClockOutTime" className="block text-sm font-medium text-gray-700 mb-2">
                退勤時刻（確定） <span className="text-red-600">*</span>
              </label>
              <input
                id="recordedClockOutTime"
                type="datetime-local"
                required
                value={recordedClockOutTime}
                onChange={(e) => setRecordedClockOutTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={submitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                給与計算に使用される正式な退勤時刻
              </p>
            </div>

            <div>
              <label htmlFor="breakHours" className="block text-sm font-medium text-gray-700 mb-2">
                休憩時間（時間）
              </label>
              <input
                id="breakHours"
                type="number"
                min="0"
                step="0.5"
                value={breakHours}
                onChange={(e) => setBreakHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="1"
                disabled={submitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                デフォルトは0時間です
              </p>
            </div>

            {/* 計算結果 */}
            {calculatedHours && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2">計算結果</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>総勤務時間: {calculatedHours.workHours}時間</li>
                  <li>休憩時間: {parseFloat(breakHours || '0')}時間</li>
                  <li>
                    <strong>実働時間: {calculatedHours.actualWorkHours}時間</strong>
                  </li>
                </ul>
              </div>
            )}

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
              <Link href="/admin/attendance" className="flex-1">
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
