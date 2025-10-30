'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAttendances } from '@/lib/firebase/attendance';
import { getShifts } from '@/lib/firebase/shifts';
import { getProjects } from '@/lib/firebase/projects';
import { getTesters } from '@/lib/firebase/testers';
import { WageCalculation } from '@/types';
import {
  calculateAllTesterWages,
  getCurrentMonthString,
  getPreviousMonthString,
  getMonthDisplayName,
} from '@/lib/utils/payroll';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function PayrollPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getPreviousMonthString());
  const [wageCalculations, setWageCalculations] = useState<WageCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchPayroll();
    }
  }, [user, authLoading, router, selectedMonth]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);

      // 並列で全データを取得
      const [attendances, shifts, projects, testers] = await Promise.all([
        getAttendances(),
        getShifts(),
        getProjects(),
        getTesters(),
      ]);

      // テスターIDと名前のマップを作成
      const testerNames = new Map(testers.map((t) => [t.id, t.name]));
      const testerIds = testers.map((t) => t.id);

      // 給与計算
      const calculations = calculateAllTesterWages(
        testerIds,
        testerNames,
        attendances,
        shifts,
        projects,
        selectedMonth
      );

      // 給与の高い順にソート
      calculations.sort((a, b) => b.totalWage - a.totalWage);

      setWageCalculations(calculations);
    } catch (err) {
      console.error('給与計算エラー:', err);
      setError('給与の計算に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 合計計算
  const totalWage = wageCalculations.reduce((sum, calc) => sum + calc.totalWage, 0);
  const totalWorkDays = wageCalculations.reduce((sum, calc) => sum + calc.totalWorkDays, 0);
  const totalWorkHours = wageCalculations.reduce((sum, calc) => sum + calc.totalWorkHours, 0);

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
            <h1 className="text-2xl font-bold">給与管理</h1>
            <p className="text-sm text-primary-100">給与計算・レポート</p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* 月選択 */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="month" className="text-sm font-medium text-gray-700">
              対象月:
            </label>
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button variant="primary" onClick={fetchPayroll}>
              再計算
            </Button>
          </div>
        </Card>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-sm text-gray-600 mb-1">対象月</div>
            <div className="text-2xl font-bold text-gray-900">
              {getMonthDisplayName(selectedMonth)}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">総支払額</div>
            <div className="text-2xl font-bold text-green-600">¥{totalWage.toLocaleString()}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">総出勤日数</div>
            <div className="text-2xl font-bold text-blue-600">{totalWorkDays}日</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">総実働時間</div>
            <div className="text-2xl font-bold text-purple-600">{totalWorkHours.toFixed(1)}時間</div>
          </Card>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 給与一覧 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">テスター別給与一覧</h2>

          {wageCalculations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>該当月の給与データがありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      テスター名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      出勤日数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      実働時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      給与額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wageCalculations.map((calc) => (
                    <tr key={calc.testerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{calc.testerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{calc.totalWorkDays}日</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{calc.totalWorkHours.toFixed(1)}時間</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ¥{calc.totalWage.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/payroll/${calc.testerId}/${selectedMonth}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          詳細
                        </Link>
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
