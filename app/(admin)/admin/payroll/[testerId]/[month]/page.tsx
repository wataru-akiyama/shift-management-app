'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAttendancesByTester } from '@/lib/firebase/attendance';
import { getShifts } from '@/lib/firebase/shifts';
import { getProjects } from '@/lib/firebase/projects';
import { getTester } from '@/lib/firebase/testers';
import { WageCalculation } from '@/types';
import { calculateMonthlyWage, getMonthDisplayName } from '@/lib/utils/payroll';
import { Card } from '@/components';
import Link from 'next/link';

export default function PayrollDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testerId = params.testerId as string;
  const month = params.month as string;
  const { user, loading: authLoading } = useAuth();
  const [wageCalculation, setWageCalculation] = useState<WageCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchPayrollDetail();
    }
  }, [user, authLoading, router, testerId, month]);

  const fetchPayrollDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // 並列でデータを取得
      const [tester, attendances, shifts, projects] = await Promise.all([
        getTester(testerId),
        getAttendancesByTester(testerId),
        getShifts(),
        getProjects(),
      ]);

      if (!tester) {
        setError('テスターが見つかりませんでした');
        return;
      }

      // 給与計算
      const calculation = calculateMonthlyWage(attendances, shifts, projects, month);
      calculation.testerId = testerId;
      calculation.testerName = tester.name;

      setWageCalculation(calculation);
    } catch (err) {
      console.error('給与明細取得エラー:', err);
      setError('給与明細の取得に失敗しました');
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

  if (error || !wageCalculation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/admin/payroll" className="text-sm text-primary-100 hover:text-white mb-1 block">
              ← 給与一覧に戻る
            </Link>
            <h1 className="text-2xl font-bold">給与明細</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || 'データが見つかりませんでした'}
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
          <Link href="/admin/payroll" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← 給与一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">給与明細</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 基本情報 */}
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getMonthDisplayName(month)} 給与明細
              </h2>
              <p className="text-lg text-gray-700">{wageCalculation.testerName} 様</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-sm text-blue-700 mb-1">出勤日数</div>
                <div className="text-3xl font-bold text-blue-900">{wageCalculation.totalWorkDays}日</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-sm text-purple-700 mb-1">実働時間</div>
                <div className="text-3xl font-bold text-purple-900">
                  {wageCalculation.totalWorkHours.toFixed(1)}h
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-sm text-green-700 mb-1">支給額</div>
                <div className="text-3xl font-bold text-green-900">
                  ¥{wageCalculation.totalWage.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          {/* 案件別集計 */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">案件別集計</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      案件名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      出勤日数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      実働時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      金額
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wageCalculation.projectBreakdown.map((project) => (
                    <tr key={project.projectId}>
                      <td className="px-4 py-3 text-sm text-gray-900">{project.projectName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{project.workDays}日</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {project.workHours.toFixed(1)}時間
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ¥{project.wage.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 日別明細 */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">日別明細</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      日付
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      案件名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      時給
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      実働時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      金額
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wageCalculation.dailyBreakdown.map((daily, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {daily.date.toLocaleDateString('ja-JP', {
                          month: '2-digit',
                          day: '2-digit',
                          weekday: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{daily.projectName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ¥{daily.hourlyWage.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {daily.workHours.toFixed(1)}時間
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ¥{daily.wage.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900" colSpan={3}>
                      合計
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {wageCalculation.totalWorkHours.toFixed(1)}時間
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ¥{wageCalculation.totalWage.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
