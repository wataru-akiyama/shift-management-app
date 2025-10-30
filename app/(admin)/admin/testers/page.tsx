'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getTesters, updateTesterStatus } from '@/lib/firebase/testers';
import { User } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function TestersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [testers, setTesters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 管理者チェック
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    // テスター一覧を取得
    if (user && user.role === 'admin') {
      fetchTesters();
    }
  }, [user, authLoading, router]);

  const fetchTesters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTesters();
      setTesters(data);
    } catch (err) {
      console.error('テスター一覧取得エラー:', err);
      setError('テスター一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (testerId: string, currentStatus: string) => {
    if (!confirm(`ステータスを${currentStatus === 'active' ? '休止' : 'アクティブ'}に変更しますか？`)) {
      return;
    }

    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateTesterStatus(testerId, newStatus);

      // 一覧を再取得
      await fetchTesters();

      alert('ステータスを変更しました');
    } catch (err) {
      console.error('ステータス変更エラー:', err);
      alert('ステータスの変更に失敗しました');
    }
  };

  if (authLoading || (loading && testers.length === 0)) {
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
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/dashboard" className="text-sm text-primary-100 hover:text-white mb-1 block">
                ← ダッシュボードに戻る
              </Link>
              <h1 className="text-2xl font-bold">テスター管理</h1>
            </div>
            <Link href="/admin/testers/new">
              <Button variant="secondary" size="md">
                + 新規登録
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Card>
          {testers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">登録されているテスターはいません</p>
              <Link href="/admin/testers/new">
                <Button variant="primary">最初のテスターを登録</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      電話番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testers.map((tester) => (
                    <tr key={tester.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tester.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{tester.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{tester.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tester.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tester.status === 'active' ? 'アクティブ' : '休止'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tester.createdAt?.toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/testers/${tester.id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleStatusToggle(tester.id, tester.status)}
                          className={`${
                            tester.status === 'active'
                              ? 'text-gray-600 hover:text-gray-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {tester.status === 'active' ? '休止にする' : 'アクティブにする'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="mt-4 text-sm text-gray-600">
          <p>登録テスター数: {testers.length}名</p>
          <p>
            アクティブ: {testers.filter((t) => t.status === 'active').length}名 / 休止:{' '}
            {testers.filter((t) => t.status === 'inactive').length}名
          </p>
        </div>
      </main>
    </div>
  );
}
