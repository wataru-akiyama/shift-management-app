'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode.react';

export default function MyQRPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user?.role !== 'tester') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">マイQRコード</h1>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">{user.name}さんのQRコード</h2>
          <p className="text-gray-600 text-sm">
            iPad打刻画面でこのQRコードを読み取ってください
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white border-4 border-gray-200 rounded-lg">
            <QRCode
              value={user.id}
              size={280}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>使い方：</strong>
            <br />
            1. 出退勤時に、このQRコードをiPadのカメラで読み取ってください
            <br />
            2. 画面に表示される「出勤」または「退勤」ボタンを選択してください
            <br />
            3. 打刻完了画面が表示されたら完了です
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            <strong>注意：</strong>
            <br />
            • このQRコードは個人専用です。他の人に見せないでください
            <br />
            • スクリーンショットを撮って保存しておくと便利です
            <br />
            • QRコードが読み取れない場合は管理者に連絡してください
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/tester/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
