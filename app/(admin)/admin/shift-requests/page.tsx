'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getShiftRequests, approveShiftRequest, rejectShiftRequest } from '@/lib/firebase/shiftRequests';
import { getTesters } from '@/lib/firebase/testers';
import { getProjects } from '@/lib/firebase/projects';
import { ShiftRequest, User, Project } from '@/types';

export default function AdminShiftRequestsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 承認ダイアログの状態
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [expectedWorkHours, setExpectedWorkHours] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user?.role !== 'admin') {
      router.push('/tester/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setRequestsLoading(true);
      const [requestsData, testersData, projectsData] = await Promise.all([
        getShiftRequests(),
        getTesters(),
        getProjects(),
      ]);
      setShiftRequests(requestsData);
      setUsers(testersData);
      setProjects(projectsData.filter((p) => p.status === 'active'));
    } catch (err) {
      console.error('データ取得エラー:', err);
      alert('データの取得に失敗しました');
    } finally {
      setRequestsLoading(false);
    }
  };

  const getTesterName = (testerId: string) => {
    const tester = users.find((u) => u.id === testerId);
    return tester?.name || '不明';
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

  const handleApproveClick = (request: ShiftRequest) => {
    setSelectedRequest(request);
    setSelectedProjectId('');
    setHourlyWage('');
    setExpectedWorkHours('');
    setApprovalDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    if (!selectedProjectId || !hourlyWage || !expectedWorkHours) {
      alert('すべての項目を入力してください');
      return;
    }

    try {
      setProcessing(true);
      await approveShiftRequest(selectedRequest.id, {
        projectId: selectedProjectId,
        hourlyWage: parseFloat(hourlyWage),
        expectedWorkHours: parseFloat(expectedWorkHours),
      });
      alert('シフト申請を承認しました');
      setApprovalDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('承認エラー:', err);
      alert('承認に失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('このシフト申請を却下しますか？')) return;

    try {
      await rejectShiftRequest(requestId);
      alert('シフト申請を却下しました');
      fetchData();
    } catch (err) {
      console.error('却下エラー:', err);
      alert('却下に失敗しました');
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setHourlyWage(project.baseHourlyWage.toString());
    }
  };

  const filteredRequests = shiftRequests.filter((request) => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  if (loading || requestsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">シフト申請管理</h1>
      </div>

      {/* ステータスフィルター */}
      <div className="mb-6">
        <label htmlFor="statusFilter" className="mr-2 font-medium">
          ステータス:
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべて</option>
          <option value="pending">承認待ち</option>
          <option value="approved">承認済み</option>
          <option value="rejected">却下</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">シフト申請がありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  テスター
                </th>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTesterName(request.testerId)}
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveClick(request)}
                          className="text-green-600 hover:text-green-900"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          却下
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 承認ダイアログ */}
      {approvalDialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">シフト申請を承認</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                テスター: {getTesterName(selectedRequest.testerId)}
              </p>
              <p className="text-sm text-gray-600">
                日時: {new Date(selectedRequest.date).toLocaleDateString('ja-JP')} {selectedRequest.startTime} 〜 {selectedRequest.endTime}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                案件 <span className="text-red-500">*</span>
              </label>
              <select
                id="projectId"
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="hourlyWage" className="block text-sm font-medium text-gray-700 mb-2">
                時給（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="hourlyWage"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="expectedWorkHours" className="block text-sm font-medium text-gray-700 mb-2">
                予定勤務時間 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="expectedWorkHours"
                value={expectedWorkHours}
                onChange={(e) => setExpectedWorkHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.5"
                min="0"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? '処理中...' : '承認'}
              </button>
              <button
                onClick={() => setApprovalDialogOpen(false)}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
