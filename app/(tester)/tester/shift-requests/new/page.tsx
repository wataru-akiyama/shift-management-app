'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createShiftRequest } from '@/lib/firebase/shiftRequests';

export default function NewShiftRequestPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user?.role !== 'tester') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!date || !startTime || !endTime) {
      alert('すべての項目を入力してください');
      return;
    }

    // 時刻の検証
    if (startTime >= endTime) {
      alert('終了時刻は開始時刻より後にしてください');
      return;
    }

    try {
      setSubmitting(true);

      await createShiftRequest({
        testerId: user.id,
        date: new Date(date),
        startTime,
        endTime,
      });

      alert('シフト申請を送信しました');
      router.push('/tester/shift-requests');
    } catch (err) {
      console.error('シフト申請作成エラー:', err);
      alert('シフト申請の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">シフト申請</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              日付 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              開始時刻 <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              終了時刻 <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>注意事項：</strong>
              <br />
              • 管理者が承認後、案件と時給が設定されます
              <br />
              • 承認されるまでシフトには反映されません
              <br />
              • 申請後の変更はできませんので、間違いがないか確認してください
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? '送信中...' : '申請する'}
            </button>
            <Link
              href="/tester/shift-requests"
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-6">
        <Link
          href="/tester/shift-requests"
          className="text-blue-600 hover:text-blue-800"
        >
          ← 申請一覧に戻る
        </Link>
      </div>
    </div>
  );
}
