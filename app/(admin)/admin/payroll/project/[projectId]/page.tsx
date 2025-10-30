'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getProject } from '@/lib/firebase/projects';
import { getAttendances } from '@/lib/firebase/attendance';
import { getShifts } from '@/lib/firebase/shifts';
import { getTesters } from '@/lib/firebase/testers';
import { calculateProjectWage } from '@/lib/utils/payroll';
import { Project } from '@/types';

export default function ProjectPayrollPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const projectId = params.projectId as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user?.role !== 'admin') {
      router.push('/tester/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && projectId) {
      fetchData();
    }
  }, [user, projectId]);

  const fetchData = async () => {
    try {
      setDataLoading(true);

      const [projectData, attendancesData, shiftsData, testersData] = await Promise.all([
        getProject(projectId),
        getAttendances(),
        getShifts(),
        getTesters(),
      ]);

      if (!projectData) {
        alert('案件が見つかりません');
        router.push('/admin/payroll');
        return;
      }

      setProject(projectData);

      const testerNames = new Map(
        testersData.map((u) => [u.id, u.name])
      );

      const calculationResult = calculateProjectWage(
        projectId,
        projectData.name,
        attendancesData,
        shiftsData,
        testerNames
      );

      setCalculation(calculationResult);
    } catch (err) {
      console.error('データ取得エラー:', err);
      alert('データの取得に失敗しました');
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!project || !calculation) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">案件別給与確認</h1>
      </div>

      {/* 案件情報 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">{project.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">期間</p>
            <p className="text-lg font-semibold">
              {new Date(project.startDate).toLocaleDateString('ja-JP')} 〜{' '}
              {new Date(project.endDate).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">基本時給（参考）</p>
            <p className="text-lg font-semibold">¥{project.baseHourlyWage.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">合計人件費</p>
            <p className="text-2xl font-bold text-blue-600">
              ¥{calculation.totalWage.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 参加テスター一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-xl font-bold">参加テスター一覧</h3>
        </div>

        {calculation.testerBreakdown.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            参加テスターがいません
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  テスター名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  勤務日数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  勤務時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均時給
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  給与
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calculation.testerBreakdown.map((tester: any) => (
                <tr key={tester.testerId}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {tester.testerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tester.workDays}日
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tester.workHours}時間
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ¥{tester.hourlyWage.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    ¥{tester.wage.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-6 py-4 whitespace-nowrap">合計</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {calculation.testerBreakdown.reduce((sum: number, t: any) => sum + t.workDays, 0)}日
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {calculation.testerBreakdown.reduce((sum: number, t: any) => sum + t.workHours, 0).toFixed(2)}時間
                </td>
                <td className="px-6 py-4 whitespace-nowrap">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                  ¥{calculation.totalWage.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href="/admin/payroll"
          className="text-blue-600 hover:text-blue-800"
        >
          ← 給与管理に戻る
        </Link>
        <Link
          href="/admin/projects"
          className="text-blue-600 hover:text-blue-800"
        >
          案件一覧に戻る
        </Link>
      </div>
    </div>
  );
}
