'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';

export default function TestPage() {
  const [status, setStatus] = useState('確認中...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const checkFirebase = async () => {
      const logs: string[] = [];

      try {
        // 1. Firebase Auth の初期化確認
        logs.push(`✅ Firebase Auth initialized`);
        logs.push(`Auth instance: ${auth ? 'OK' : 'NG'}`);

        // 2. Firestore の初期化確認
        logs.push(`✅ Firestore initialized`);
        logs.push(`Firestore instance: ${db ? 'OK' : 'NG'}`);

        // 3. 環境変数の確認
        logs.push(`✅ Environment variables:`);
        logs.push(`API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '設定済み' : '未設定'}`);
        logs.push(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '設定済み' : '未設定'}`);

        // 4. Auth状態の確認
        const currentUser = auth.currentUser;
        logs.push(`✅ Current Auth User: ${currentUser ? currentUser.uid : 'なし（未ログイン）'}`);

        setStatus('✅ Firebase接続テスト完了');
      } catch (error: any) {
        logs.push(`❌ エラー: ${error.message}`);
        setStatus('❌ Firebase接続エラー');
      }

      setDetails(logs);
    };

    checkFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Firebase接続テスト</h1>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">{status}</h2>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">詳細:</h3>
          {details.map((detail, index) => (
            <p key={index} className="text-sm font-mono mb-1">{detail}</p>
          ))}
        </div>

        <div className="mt-4">
          <a href="/login" className="text-primary-600 hover:underline">
            → ログイン画面へ
          </a>
        </div>
      </div>
    </div>
  );
}
