'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/firebase/auth';
import { Button, Card } from '@/components';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
      return;
    }

    // メールアドレスのバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    // 電話番号のバリデーション
    const phoneRegex = /^[0-9-]+$/;
    if (!phoneRegex.test(phone)) {
      setError('電話番号は数字とハイフンのみで入力してください');
      return;
    }

    // パスワードのバリデーション
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    try {
      setLoading(true);

      // ユーザー作成（Firebase Authentication + Firestore）
      await createUser(email, password, {
        name: name.trim(),
        phone: phone.trim(),
        role: 'tester',
        status: 'active',
      });

      alert('登録が完了しました！ログインしています...');

      // 登録成功後、自動的にログインされているのでダッシュボードにリダイレクト
      router.push('/tester/dashboard');
    } catch (err: any) {
      console.error('登録エラー:', err);

      // Firebaseのエラーコードに応じたメッセージ
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に登録されています');
      } else if (err.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます。6文字以上で入力してください');
      } else {
        setError('登録に失敗しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            テスター新規登録
          </h1>
          <p className="text-gray-600">シフト管理アプリへようこそ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              お名前 <span className="text-red-600">*</span>
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
              ログイン時に使用します
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード <span className="text-red-600">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="6文字以上"
              disabled={loading}
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認） <span className="text-red-600">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="もう一度入力してください"
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📝 登録後について</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>登録後、すぐにログインできます</li>
              <li>シフト申請や出退勤記録が可能になります</li>
              <li>管理者からシフトが割り当てられます</li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? '登録中...' : '登録する'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちですか？{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                ログイン
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
