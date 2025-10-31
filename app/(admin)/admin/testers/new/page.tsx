'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createTesterWithUID } from '@/lib/firebase/testers';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function NewTesterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
    if (!uid.trim() || !name.trim() || !email.trim() || !phone.trim()) {
      setError('すべての項目を入力してください');
      return;
    }

    // UIDのバリデーション（28文字の英数字）
    if (uid.trim().length < 20) {
      setError('有効なUID を入力してください（Firebase Authenticationで作成したUID）');
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
      setLoading(true);
      await createTesterWithUID(uid.trim(), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      alert('テスターを登録しました');
      router.push('/admin/testers');
    } catch (err) {
      console.error('テスター登録エラー:', err);
      setError('テスターの登録に失敗しました。UIDが正しいか確認してください。');
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
          <Link href="/admin/testers" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← テスター一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">テスター新規登録</h1>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">📝 登録前の準備</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900"
                  >
                    Firebase Console
                  </a>
                  を開く
                </li>
                <li>Authentication → Users → Add user でユーザーを作成</li>
                <li>作成したユーザーの UID をコピー</li>
                <li>下記のフォームに UID を貼り付けて登録</li>
              </ol>
            </div>

            <div>
              <label htmlFor="uid" className="block text-sm font-medium text-gray-700 mb-2">
                UID (Firebase Authentication) <span className="text-red-600">*</span>
              </label>
              <input
                id="uid"
                type="text"
                required
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="例: abc123def456..."
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Firebase Authenticationで作成したユーザーのUIDを入力してください
              </p>
            </div>

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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                ハイフン付きで入力してください
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>メールアドレスはFirebase Authenticationで登録したものと同じにしてください</li>
                <li>Firebase Authenticationで設定したパスワードでログインできます</li>
                <li>ステータスは「アクティブ」で登録されます</li>
                <li>UIDが正しくないと、ログインできません</li>
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
              <Link href="/admin/testers" className="flex-1">
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
