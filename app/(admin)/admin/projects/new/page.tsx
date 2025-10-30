'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createProject } from '@/lib/firebase/projects';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseHourlyWage, setBaseHourlyWage] = useState('');
  const [requiredHours, setRequiredHours] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 管理者チェック
  if (!authLoading && (!user || user.role !== 'admin')) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!name.trim() || !location.trim() || !startDate || !endDate || !baseHourlyWage || !requiredHours) {
      setError('必須項目をすべて入力してください');
      return;
    }

    const wage = parseFloat(baseHourlyWage);
    const hours = parseFloat(requiredHours);

    if (isNaN(wage) || wage <= 0) {
      setError('基本時給は正の数値で入力してください');
      return;
    }

    if (isNaN(hours) || hours <= 0) {
      setError('必要時間数は正の数値で入力してください');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError('終了日は開始日より後の日付を指定してください');
      return;
    }

    try {
      setLoading(true);
      await createProject({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        startDate: start,
        endDate: end,
        baseHourlyWage: wage,
        requiredHours: hours,
      });

      alert('案件を登録しました');
      router.push('/admin/projects');
    } catch (err) {
      console.error('案件登録エラー:', err);
      setError('案件の登録に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin/projects" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← 案件一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">案件新規登録</h1>
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

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                案件名 <span className="text-red-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例：〇〇町イベント設営"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                案件説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="案件の詳細や注意事項を入力"
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                場所 <span className="text-red-600">*</span>
              </label>
              <input
                id="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例：〇〇町中央公園"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  開始日 <span className="text-red-600">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  終了日 <span className="text-red-600">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="baseHourlyWage" className="block text-sm font-medium text-gray-700 mb-2">
                  基本時給（円） <span className="text-red-600">*</span>
                </label>
                <input
                  id="baseHourlyWage"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={baseHourlyWage}
                  onChange={(e) => setBaseHourlyWage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1000"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="requiredHours" className="block text-sm font-medium text-gray-700 mb-2">
                  必要時間数 <span className="text-red-600">*</span>
                </label>
                <input
                  id="requiredHours"
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  value={requiredHours}
                  onChange={(e) => setRequiredHours(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="8"
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  1案件あたりの必要な作業時間
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">案件登録後の流れ</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>シフト管理画面でこの案件のシフトを作成できます</li>
                <li>テスターがシフトに入ると出退勤記録が可能になります</li>
                <li>基本時給は後から変更可能です</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                {loading ? '登録中...' : '登録する'}
              </Button>
              <Link href="/admin/projects" className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
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
