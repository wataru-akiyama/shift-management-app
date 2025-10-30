'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getTester, updateTester } from '@/lib/firebase/testers';
import { User } from '@/types';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function EditTesterPage() {
  const router = useRouter();
  const params = useParams();
  const testerId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [tester, setTester] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 管理者チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    // テスター情報を取得
    if (user && user.role === 'admin') {
      fetchTester();
    }
  }, [user, authLoading, router, testerId]);

  const fetchTester = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTester(testerId);

      if (data) {
        setTester(data);
        setName(data.name);
        setEmail(data.email);
        setPhone(data.phone);
        setStatus(data.status);
      } else {
        setError('テスターが見つかりませんでした');
      }
    } catch (err) {
      console.error('テスター取得エラー:', err);
      setError('テスター情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('すべての項目を入力してください');
      return;
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    // 電話番号の簡易バリデーション（数字とハイフンのみ）
    const phoneRegex = /^[0-9-]+$/;
    if (!phoneRegex.test(phone)) {
      setError('電話番号は数字とハイフンのみで入力してください');
      return;
    }

    try {
      setSubmitting(true);
      await updateTester(testerId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status,
      });

      alert('テスター情報を更新しました');
      router.push('/admin/testers');
    } catch (err) {
      console.error('テスター更新エラー:', err);
      setError('テスター情報の更新に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
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

  if (!tester) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-primary-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <Link href="/admin/testers" className="text-sm text-primary-100 hover:text-white mb-1 block">
              ← テスター一覧に戻る
            </Link>
            <h1 className="text-2xl font-bold">テスター編集</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error || 'テスターが見つかりませんでした'}
            </div>
            <div className="mt-4">
              <Link href="/admin/testers">
                <Button variant="secondary">テスター一覧に戻る</Button>
              </Link>
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
          <Link href="/admin/testers" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← テスター一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">テスター編集</h1>
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
                名前 <span className="text-red-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="山田 太郎"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="example@example.com"
                disabled={submitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                このメールアドレスでログインできます
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                電話番号 <span className="text-red-600">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="090-1234-5678"
                disabled={submitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                ハイフン付きで入力してください
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス <span className="text-red-600">*</span>
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="active">アクティブ</option>
                <option value="inactive">休止</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                休止中のテスターはシフトに入れません
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">登録情報</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>登録日: {tester.createdAt?.toLocaleDateString('ja-JP')}</li>
                <li>最終更新日: {tester.updatedAt?.toLocaleDateString('ja-JP')}</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? '更新中...' : '更新する'}
              </Button>
              <Link href="/admin/testers" className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
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
