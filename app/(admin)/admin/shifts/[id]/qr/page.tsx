'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getShift } from '@/lib/firebase/shifts';
import { getTester } from '@/lib/firebase/testers';
import { getProject } from '@/lib/firebase/projects';
import { Shift } from '@/types';
import { Card } from '@/components';
import Link from 'next/link';
import QRCode from 'qrcode.react';

export default function ShiftQRCodePage() {
  const router = useRouter();
  const params = useParams();
  const shiftId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [testerName, setTesterName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const shiftData = await getShift(shiftId);

      if (!shiftData) {
        setError('シフトが見つかりませんでした');
        return;
      }

      setShift(shiftData);

      // テスター情報と案件情報を取得
      const [tester, project] = await Promise.all([
        getTester(shiftData.testerId),
        getProject(shiftData.projectId),
      ]);

      if (tester) {
        setTesterName(tester.name);
      }
      if (project) {
        setProjectName(project.name);
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
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

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/admin/shifts" className="text-sm text-primary-100 hover:text-white mb-1 block">
              ← シフト一覧に戻る
            </Link>
            <h1 className="text-2xl font-bold">出退勤用QRコード</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || 'シフトが見つかりませんでした'}
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
          <h1 className="text-2xl font-bold">出退勤用QRコード</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">シフト情報</h2>

            {/* シフト情報 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-left space-y-2">
                <p className="text-sm text-blue-700">
                  <strong>テスター:</strong> {testerName}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>案件:</strong> {projectName}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>日付:</strong>{' '}
                  {shift.date.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    weekday: 'short',
                  })}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>時間:</strong> {shift.startTime} 〜 {shift.endTime}
                </p>
              </div>
            </div>

            {/* QRコード */}
            <div className="bg-white p-8 rounded-lg border-2 border-gray-200 inline-block">
              <QRCode value={shiftId} size={256} level="H" />
            </div>

            <p className="mt-6 text-sm text-gray-600">
              テスターにこのQRコードをスキャンしてもらってください
            </p>

            {/* 使い方 */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h3 className="text-sm font-semibold text-green-800 mb-2">使い方</h3>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>テスターに出退勤打刻画面を開いてもらう</li>
                <li>「カメラを起動してスキャン開始」をタップしてもらう</li>
                <li>このQRコードをカメラで読み取ってもらう</li>
                <li>出勤時は「出勤しました」、退勤時は「退勤しました」と表示されます</li>
              </ol>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>このQRコードは出勤と退勤の両方で使用します</li>
                <li>1回目のスキャンで出勤、2回目のスキャンで退勤になります</li>
                <li>QRコードは印刷して使用することもできます</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
