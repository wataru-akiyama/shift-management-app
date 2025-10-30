'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getShiftRequestsByTester } from '@/lib/firebase/shiftRequests';
import { ShiftRequest } from '@/types';

export default function ShiftRequestsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

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
      fetchShiftRequests();
    }
  }, [user]);

  const fetchShiftRequests = async () => {
    if (!user) return;

    try {
      setRequestsLoading(true);
      const data = await getShiftRequestsByTester(user.id);
      setShiftRequests(data);
    } catch (err) {
      console.error('シフト申請取得エラー:', err);
      alert('シフト申請の取得に失敗しました');
    } finally {
      setRequestsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">承認待ち</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">承認済み</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">却下</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading || requestsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">シフト申請一覧</h1>
        <Link
          href="/tester/shift-requests/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          新規申請
        </Link>
      </div>

      {shiftRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">シフト申請がありません</p>
          <Link
            href="/tester/shift-requests/new"
            className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            新規申請を作成
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日付
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申請日時
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shiftRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(request.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      weekday: 'short',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.startTime} 〜 {request.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
