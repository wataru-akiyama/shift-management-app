'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getUser } from '@/lib/firebase/users';
import { getShiftsByTester } from '@/lib/firebase/shifts';
import { clockIn, clockOut, getAttendanceByShift } from '@/lib/firebase/attendance';
import { User, Shift } from '@/types';

type Screen = 'scanning' | 'selection' | 'completed';
type AttendanceType = 'clockIn' | 'clockOut';

export default function IpadAttendancePage() {
  const [screen, setScreen] = useState<Screen>('scanning');
  const [tester, setTester] = useState<User | null>(null);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [attendanceType, setAttendanceType] = useState<AttendanceType | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (screen === 'scanning' && !isScanning) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [screen]);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error('QRコードスキャン開始エラー:', err);
      setMessage({ type: 'error', text: 'カメラの起動に失敗しました' });
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('QRコードスキャン停止エラー:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    console.log('QRコード読み取り成功:', decodedText);

    // スキャンを一時停止
    await stopScanning();

    try {
      // テスターIDを取得
      const testerId = decodedText.trim();

      // テスター情報を取得
      const testerData = await getUser(testerId);
      if (!testerData) {
        setMessage({ type: 'error', text: 'テスター情報が見つかりません' });
        setTimeout(() => {
          setMessage(null);
          setScreen('scanning');
        }, 3000);
        return;
      }

      // 今日のシフトを取得
      const shifts = await getShiftsByTester(testerId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayShiftsData = shifts.filter((shift) => {
        const shiftDate = new Date(shift.date);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() === today.getTime();
      });

      if (todayShiftsData.length === 0) {
        setMessage({ type: 'error', text: '今日のシフトがありません' });
        setTimeout(() => {
          setMessage(null);
          setScreen('scanning');
        }, 3000);
        return;
      }

      setTester(testerData);
      setTodayShifts(todayShiftsData);
      setScreen('selection');
    } catch (err) {
      console.error('エラー:', err);
      setMessage({ type: 'error', text: 'エラーが発生しました' });
      setTimeout(() => {
        setMessage(null);
        setScreen('scanning');
      }, 3000);
    }
  };

  const onScanFailure = (error: any) => {
    // QRコードが読み取れない時のエラーは無視（連続的に発生するため）
  };

  const handleClockIn = async () => {
    if (!tester || todayShifts.length === 0) return;

    try {
      // 最初のシフトを使用（同日に複数シフトがある場合も、出退勤は1日1回のみ）
      const shift = todayShifts[0];

      // 既に出勤済みかチェック
      const existingAttendance = await getAttendanceByShift(shift.id);
      if (existingAttendance) {
        setMessage({ type: 'error', text: '既に出勤打刻済みです' });
        setTimeout(() => {
          setMessage(null);
          setTester(null);
          setTodayShifts([]);
          setScreen('scanning');
        }, 3000);
        return;
      }

      await clockIn(tester.id, shift.id);
      setAttendanceType('clockIn');
      setScreen('completed');

      // 3秒後にスキャン画面に戻る
      setTimeout(() => {
        setTester(null);
        setTodayShifts([]);
        setAttendanceType(null);
        setMessage(null);
        setScreen('scanning');
      }, 3000);
    } catch (err) {
      console.error('出勤打刻エラー:', err);
      setMessage({ type: 'error', text: '出勤打刻に失敗しました' });
      setTimeout(() => {
        setMessage(null);
        setTester(null);
        setTodayShifts([]);
        setScreen('scanning');
      }, 3000);
    }
  };

  const handleClockOut = async () => {
    if (!tester || todayShifts.length === 0) return;

    try {
      // 最初のシフトを使用
      const shift = todayShifts[0];

      // 出勤記録を取得
      const existingAttendance = await getAttendanceByShift(shift.id);
      if (!existingAttendance) {
        setMessage({ type: 'error', text: '出勤記録がありません' });
        setTimeout(() => {
          setMessage(null);
          setTester(null);
          setTodayShifts([]);
          setScreen('scanning');
        }, 3000);
        return;
      }

      if (existingAttendance.clockOutTime) {
        setMessage({ type: 'error', text: '既に退勤打刻済みです' });
        setTimeout(() => {
          setMessage(null);
          setTester(null);
          setTodayShifts([]);
          setScreen('scanning');
        }, 3000);
        return;
      }

      await clockOut(existingAttendance.id);
      setAttendanceType('clockOut');
      setScreen('completed');

      // 3秒後にスキャン画面に戻る
      setTimeout(() => {
        setTester(null);
        setTodayShifts([]);
        setAttendanceType(null);
        setMessage(null);
        setScreen('scanning');
      }, 3000);
    } catch (err) {
      console.error('退勤打刻エラー:', err);
      setMessage({ type: 'error', text: '退勤打刻に失敗しました' });
      setTimeout(() => {
        setMessage(null);
        setTester(null);
        setTodayShifts([]);
        setScreen('scanning');
      }, 3000);
    }
  };

  const handleCancel = () => {
    setTester(null);
    setTodayShifts([]);
    setMessage(null);
    setScreen('scanning');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full">
        {screen === 'scanning' && (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">出退勤打刻</h1>
            <p className="text-xl text-gray-600 mb-8">
              QRコードをカメラにかざしてください
            </p>
            <div className="flex justify-center mb-8">
              <div
                id="qr-reader"
                className="w-full max-w-md border-4 border-blue-500 rounded-lg overflow-hidden"
              ></div>
            </div>
            {message && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        )}

        {screen === 'selection' && tester && (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">打刻選択</h1>
            <div className="mb-8">
              <p className="text-2xl font-semibold text-gray-800 mb-2">{tester.name}さん</p>
              <p className="text-lg text-gray-600">今日のシフト: {todayShifts.length}件</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <button
                onClick={handleClockIn}
                className="bg-green-500 text-white text-2xl font-bold py-12 px-8 rounded-xl hover:bg-green-600 transition-colors shadow-lg"
              >
                出勤
              </button>
              <button
                onClick={handleClockOut}
                className="bg-blue-500 text-white text-2xl font-bold py-12 px-8 rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
              >
                退勤
              </button>
            </div>

            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 text-lg underline"
            >
              キャンセル
            </button>

            {message && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        )}

        {screen === 'completed' && tester && attendanceType && (
          <div className="text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">
                {attendanceType === 'clockIn' ? '✅' : '👋'}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                打刻完了しました
              </h1>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 mb-8">
              <p className="text-2xl font-semibold text-gray-800 mb-4">{tester.name}さん</p>
              <p className="text-xl text-gray-600 mb-2">
                {attendanceType === 'clockIn' ? '出勤' : '退勤'}
              </p>
              <p className="text-lg text-gray-500">
                {new Date().toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <p className="text-gray-500">
              {attendanceType === 'clockIn' ? 'お疲れ様です！' : 'お疲れ様でした！'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
