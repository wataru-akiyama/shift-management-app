'use client';

import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components';

interface AuthErrorProps {
  error: string;
  errorDetails?: string | null;
  uid?: string;
}

export default function AuthError({ error, errorDetails, uid }: AuthErrorProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            認証エラー
          </h1>
          <p className="text-gray-700 font-semibold">{error}</p>
        </div>

        {errorDetails && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-bold text-yellow-800 mb-2">詳細情報:</h2>
            <p className="text-sm text-yellow-700 whitespace-pre-wrap">{errorDetails}</p>
          </div>
        )}

        {uid && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
            <h2 className="font-bold text-gray-800 mb-2">Firebase認証UID:</h2>
            <p className="text-sm font-mono text-gray-700 break-all">{uid}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-bold text-blue-800 mb-2">🔧 解決方法:</h2>
          <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
            <li>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                Firebase Console
              </a>
              を開く
            </li>
            <li>プロジェクトを選択</li>
            <li>「Firestore Database」を開く</li>
            <li>「users」コレクションを確認</li>
            <li>上記のUIDと一致するドキュメントが存在するか確認</li>
            <li>
              存在しない場合は、以下のフィールドでドキュメントを作成:
              <ul className="ml-6 mt-2 space-y-1 list-disc">
                <li>ドキュメントID: {uid || '（上記のUID）'}</li>
                <li>id (string): {uid || '（上記のUID）'}</li>
                <li>name (string): 管理者</li>
                <li>email (string): （あなたのメールアドレス）</li>
                <li>phone (string): 090-1234-5678</li>
                <li>role (string): admin</li>
                <li>status (string): active</li>
                <li>createdAt (timestamp): （現在時刻）</li>
                <li>updatedAt (timestamp): （現在時刻）</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleLogout}
            variant="primary"
            className="flex-1"
          >
            ログアウトして再試行
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            className="flex-1"
          >
            再読み込み
          </Button>
        </div>
      </Card>
    </div>
  );
}
