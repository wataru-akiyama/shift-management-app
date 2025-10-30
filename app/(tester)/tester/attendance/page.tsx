'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { clockIn, clockOut, getAttendanceByShift } from '@/lib/firebase/attendance';
import { getShift } from '@/lib/firebase/shifts';
import { Button, Card } from '@/components';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';

export default function TesterAttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // テスターチェック
  useEffect(() => {
    setIsMounted(true);

    if (!authLoading && (!user || user.role !== 'tester')) {
      router.push('/login');
      return;
    }

    return () => {
      // クリーンアップ
      if (scannerRef.current && scanning) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log('QRコードスキャナーを停止しました');
          })
          .catch((err) => {
            console.error('スキャナー停止エラー:', err);
          });
      }
    };
  }, [user, authLoading, router, scanning]);

  const startScanning = async () => {
    if (!isMounted) return;

    try {
      setScanning(true);
      setMessage(null);

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error('スキャナー起動エラー:', err);
      setMessage({
        type: 'error',
        text: 'カメラの起動に失敗しました。カメラのアクセス許可を確認してください。',
      });
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('スキャナー停止エラー:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processing) return;

    console.log('QRコード読み取り:', decodedText);

    // スキャンを一時停止
    await stopScanning();
    setProcessing(true);

    try {
      // QRコードからシフトIDを取得
      const shiftId = decodedText.trim();

      // シフト情報を取得
      const shift = await getShift(shiftId);
      if (!shift) {
        setMessage({
          type: 'error',
          text: 'シフトが見つかりませんでした。QRコードが正しいか確認してください。',
        });
        return;
      }

      // 自分のシフトか確認
      if (shift.testerId !== user?.id) {
        setMessage({
          type: 'error',
          text: 'このシフトはあなたのものではありません。',
        });
        return;
      }

      // 既存の出退勤記録を確認
      const existingAttendance = await getAttendanceByShift(shiftId);

      if (!existingAttendance) {
        // 出勤打刻
        await clockIn(user!.id, shiftId);
        setMessage({
          type: 'success',
          text: `出勤しました！\nシフト時間: ${shift.startTime} 〜 ${shift.endTime}`,
        });
      } else if (!existingAttendance.clockOutTime) {
        // 退勤打刻
        await clockOut(existingAttendance.id);
        setMessage({
          type: 'success',
          text: 'お疲れ様でした！退勤しました。',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'すでに退勤済みです。',
        });
      }
    } catch (err) {
      console.error('打刻エラー:', err);
      setMessage({
        type: 'error',
        text: '打刻に失敗しました。もう一度お試しください。',
      });
    } finally {
      setProcessing(false);
    }
  };

  const onScanFailure = (error: string) => {
    // スキャン失敗は頻繁に起こるので、ログを出さない
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

  if (!user || user.role !== 'tester') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/tester/dashboard" className="text-sm text-primary-100 hover:text-white mb-1 block">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-2xl font-bold">出退勤打刻</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">QRコードをスキャン</h2>
            <p className="text-sm text-gray-600">
              管理者が提示するQRコードをカメラで読み取ってください
            </p>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <p className="whitespace-pre-line">{message.text}</p>
            </div>
          )}

          {/* QRコードリーダー */}
          {!processing && (
            <>
              {!scanning ? (
                <div className="text-center">
                  <Button variant="primary" size="lg" onClick={startScanning} className="w-full mb-4">
                    カメラを起動してスキャン開始
                  </Button>
                </div>
              ) : (
                <>
                  <div id="qr-reader" className="mb-4 rounded-lg overflow-hidden"></div>
                  <Button variant="secondary" size="lg" onClick={stopScanning} className="w-full">
                    スキャン停止
                  </Button>
                </>
              )}
            </>
          )}

          {/* 処理中 */}
          {processing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">処理中...</p>
            </div>
          )}

          {/* 使い方 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">使い方</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>「カメラを起動してスキャン開始」ボタンをタップ</li>
              <li>カメラのアクセス許可を求められたら「許可」を選択</li>
              <li>管理者が提示するQRコードをカメラで読み取る</li>
              <li>出勤時の場合は「出勤しました」と表示されます</li>
              <li>退勤時の場合は「退勤しました」と表示されます</li>
            </ol>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">注意事項</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>同じQRコードで出勤と退勤を行います</li>
              <li>出勤済みの場合は退勤になります</li>
              <li>QRコードは管理者から受け取ってください</li>
            </ul>
          </div>
        </Card>
      </main>
    </div>
  );
}
