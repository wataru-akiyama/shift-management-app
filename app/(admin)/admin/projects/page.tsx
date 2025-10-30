'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getProjects, updateProjectStatus } from '@/lib/firebase/projects';
import { Project } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchProjects();
    }
  }, [user, authLoading, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('案件取得エラー:', err);
      setError('案件の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: 'active' | 'completed' | 'cancelled') => {
    try {
      await updateProjectStatus(projectId, newStatus);
      await fetchProjects();
      alert('ステータスを変更しました');
    } catch (err) {
      console.error('ステータス変更エラー:', err);
      alert('ステータスの変更に失敗しました');
    }
  };

  // 統計情報を計算
  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const cancelledCount = projects.filter(p => p.status === 'cancelled').length;

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
              <h1 className="text-2xl font-bold">案件管理</h1>
              <p className="text-sm text-primary-100">案件の登録・編集・削除</p>
            </div>
            <Link href="/admin/projects/new">
              <Button variant="secondary" size="lg">
                + 新規登録
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-sm text-gray-600 mb-1">総案件数</div>
            <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">進行中</div>
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">完了</div>
            <div className="text-3xl font-bold text-blue-600">{completedCount}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">中止</div>
            <div className="text-3xl font-bold text-red-600">{cancelledCount}</div>
          </Card>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 案件一覧 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">案件一覧</h2>

          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">案件が登録されていません</p>
              <Link href="/admin/projects/new">
                <Button variant="primary">最初の案件を登録する</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      案件名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      場所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      期間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時給
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      必要人数
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
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500">{project.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.startDate.toLocaleDateString('ja-JP')}
                        </div>
                        <div className="text-sm text-gray-500">
                          〜 {project.endDate.toLocaleDateString('ja-JP')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ¥{project.baseHourlyWage.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.requiredHours}時間
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {project.status === 'active'
                            ? '進行中'
                            : project.status === 'completed'
                            ? '完了'
                            : '中止'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          編集
                        </Link>
                        <Link
                          href={`/admin/payroll/project/${project.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          給与
                        </Link>
                        {project.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(project.id, 'completed')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              完了
                            </button>
                            <button
                              onClick={() => handleStatusChange(project.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                            >
                              中止
                            </button>
                          </>
                        )}
                        {project.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(project.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                          >
                            再開
                          </button>
                        )}
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
