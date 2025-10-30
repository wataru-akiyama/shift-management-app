import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Attendance } from '@/types';

/**
 * Firestoreのタイムスタンプを日付に変換
 */
function convertTimestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

/**
 * 全出退勤記録を取得
 */
export async function getAttendances(): Promise<Attendance[]> {
  try {
    const attendancesRef = collection(db, 'attendances');
    const q = query(attendancesRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const attendances: Attendance[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attendances.push({
        id: doc.id,
        testerId: data.testerId,
        shiftId: data.shiftId,
        date: convertTimestampToDate(data.date),
        clockInTime: data.clockInTime ? convertTimestampToDate(data.clockInTime) : undefined,
        clockOutTime: data.clockOutTime ? convertTimestampToDate(data.clockOutTime) : undefined,
        recordedClockInTime: data.recordedClockInTime ? convertTimestampToDate(data.recordedClockInTime) : undefined,
        recordedClockOutTime: data.recordedClockOutTime ? convertTimestampToDate(data.recordedClockOutTime) : undefined,
        workHours: data.workHours,
        breakHours: data.breakHours,
        actualWorkHours: data.actualWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return attendances;
  } catch (error) {
    console.error('出退勤記録取得エラー:', error);
    throw error;
  }
}

/**
 * 特定の日付の出退勤記録を取得
 */
export async function getAttendancesByDate(date: Date): Promise<Attendance[]> {
  try {
    const attendancesRef = collection(db, 'attendances');
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      attendancesRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const attendances: Attendance[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attendances.push({
        id: doc.id,
        testerId: data.testerId,
        shiftId: data.shiftId,
        date: convertTimestampToDate(data.date),
        clockInTime: data.clockInTime ? convertTimestampToDate(data.clockInTime) : undefined,
        clockOutTime: data.clockOutTime ? convertTimestampToDate(data.clockOutTime) : undefined,
        recordedClockInTime: data.recordedClockInTime ? convertTimestampToDate(data.recordedClockInTime) : undefined,
        recordedClockOutTime: data.recordedClockOutTime ? convertTimestampToDate(data.recordedClockOutTime) : undefined,
        workHours: data.workHours,
        breakHours: data.breakHours,
        actualWorkHours: data.actualWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return attendances;
  } catch (error) {
    console.error('日付別出退勤記録取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のテスターの出退勤記録を取得
 */
export async function getAttendancesByTester(testerId: string): Promise<Attendance[]> {
  try {
    const attendancesRef = collection(db, 'attendances');
    const q = query(
      attendancesRef,
      where('testerId', '==', testerId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const attendances: Attendance[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attendances.push({
        id: doc.id,
        testerId: data.testerId,
        shiftId: data.shiftId,
        date: convertTimestampToDate(data.date),
        clockInTime: data.clockInTime ? convertTimestampToDate(data.clockInTime) : undefined,
        clockOutTime: data.clockOutTime ? convertTimestampToDate(data.clockOutTime) : undefined,
        recordedClockInTime: data.recordedClockInTime ? convertTimestampToDate(data.recordedClockInTime) : undefined,
        recordedClockOutTime: data.recordedClockOutTime ? convertTimestampToDate(data.recordedClockOutTime) : undefined,
        workHours: data.workHours,
        breakHours: data.breakHours,
        actualWorkHours: data.actualWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return attendances;
  } catch (error) {
    console.error('テスター別出退勤記録取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のシフトの出退勤記録を取得
 */
export async function getAttendanceByShift(shiftId: string): Promise<Attendance | null> {
  try {
    const attendancesRef = collection(db, 'attendances');
    const q = query(attendancesRef, where('shiftId', '==', shiftId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      testerId: data.testerId,
      shiftId: data.shiftId,
      date: convertTimestampToDate(data.date),
      clockInTime: data.clockInTime ? convertTimestampToDate(data.clockInTime) : undefined,
      clockOutTime: data.clockOutTime ? convertTimestampToDate(data.clockOutTime) : undefined,
      recordedClockInTime: data.recordedClockInTime ? convertTimestampToDate(data.recordedClockInTime) : undefined,
      recordedClockOutTime: data.recordedClockOutTime ? convertTimestampToDate(data.recordedClockOutTime) : undefined,
      workHours: data.workHours,
      breakHours: data.breakHours,
      actualWorkHours: data.actualWorkHours,
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.error('シフト別出退勤記録取得エラー:', error);
    throw error;
  }
}

/**
 * 特定の出退勤記録を取得
 */
export async function getAttendance(attendanceId: string): Promise<Attendance | null> {
  try {
    const attendanceDoc = await getDoc(doc(db, 'attendances', attendanceId));

    if (!attendanceDoc.exists()) {
      return null;
    }

    const data = attendanceDoc.data();
    return {
      id: attendanceDoc.id,
      testerId: data.testerId,
      shiftId: data.shiftId,
      date: convertTimestampToDate(data.date),
      clockInTime: data.clockInTime ? convertTimestampToDate(data.clockInTime) : undefined,
      clockOutTime: data.clockOutTime ? convertTimestampToDate(data.clockOutTime) : undefined,
      recordedClockInTime: data.recordedClockInTime ? convertTimestampToDate(data.recordedClockInTime) : undefined,
      recordedClockOutTime: data.recordedClockOutTime ? convertTimestampToDate(data.recordedClockOutTime) : undefined,
      workHours: data.workHours,
      breakHours: data.breakHours,
      actualWorkHours: data.actualWorkHours,
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.error('出退勤記録取得エラー:', error);
    throw error;
  }
}

/**
 * 出勤打刻
 */
export async function clockIn(testerId: string, shiftId: string): Promise<string> {
  try {
    const attendancesRef = collection(db, 'attendances');
    const now = new Date();
    const roundedTime = roundClockInTime(now);

    const docRef = await addDoc(attendancesRef, {
      testerId,
      shiftId,
      date: Timestamp.fromDate(now),
      clockInTime: Timestamp.fromDate(now), // 実際の打刻時刻
      recordedClockInTime: Timestamp.fromDate(roundedTime), // 15分単位に丸めた時刻
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ 出勤打刻しました - ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('出勤打刻エラー:', error);
    throw error;
  }
}

/**
 * 退勤打刻
 */
export async function clockOut(attendanceId: string): Promise<void> {
  try {
    const attendanceRef = doc(db, 'attendances', attendanceId);
    const now = new Date();
    const roundedTime = roundClockOutTime(now);

    await updateDoc(attendanceRef, {
      clockOutTime: Timestamp.fromDate(now), // 実際の打刻時刻
      recordedClockOutTime: Timestamp.fromDate(roundedTime), // 15分単位に丸めた時刻
      updatedAt: Timestamp.now(),
    });

    console.log('✅ 退勤打刻しました - ID:', attendanceId);
  } catch (error) {
    console.error('退勤打刻エラー:', error);
    throw error;
  }
}

/**
 * 出退勤記録を更新（管理者による修正）
 */
export async function updateAttendance(
  attendanceId: string,
  attendanceData: {
    recordedClockInTime?: Date;
    recordedClockOutTime?: Date;
    breakHours?: number;
  }
): Promise<void> {
  try {
    const attendanceRef = doc(db, 'attendances', attendanceId);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (attendanceData.recordedClockInTime) {
      updateData.recordedClockInTime = Timestamp.fromDate(attendanceData.recordedClockInTime);
    }
    if (attendanceData.recordedClockOutTime) {
      updateData.recordedClockOutTime = Timestamp.fromDate(attendanceData.recordedClockOutTime);
    }

    // 勤務時間を計算
    if (attendanceData.recordedClockInTime && attendanceData.recordedClockOutTime) {
      const workHours = calculateWorkHours(
        attendanceData.recordedClockInTime,
        attendanceData.recordedClockOutTime
      );
      updateData.workHours = workHours;

      // 休憩時間を設定（未指定の場合は自動検知）
      let breakHours: number;
      if (attendanceData.breakHours !== undefined) {
        breakHours = attendanceData.breakHours;
      } else {
        // 12:00-13:00の休憩時間を自動検知
        breakHours = detectLunchBreak(
          attendanceData.recordedClockInTime,
          attendanceData.recordedClockOutTime
        );
      }
      updateData.breakHours = breakHours;

      // 実働時間を計算
      updateData.actualWorkHours = workHours - breakHours;
    } else if (attendanceData.breakHours !== undefined) {
      updateData.breakHours = attendanceData.breakHours;
    }

    await updateDoc(attendanceRef, updateData);
    console.log('✅ 出退勤記録を更新しました - ID:', attendanceId);
  } catch (error) {
    console.error('出退勤記録更新エラー:', error);
    throw error;
  }
}

/**
 * 出勤時刻を15分単位で切り捨て
 * 例: 9:07 → 9:00, 9:23 → 9:15
 */
export function roundClockInTime(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const roundedMinutes = Math.floor(minutes / 15) * 15;
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
}

/**
 * 退勤時刻を15分単位で切り上げ
 * 例: 18:07 → 18:15, 18:23 → 18:30
 */
export function roundClockOutTime(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
}

/**
 * 12:00-13:00の休憩時間が含まれるかを検出
 * 出勤時刻が12:00より前で、退勤時刻が13:00より後の場合、1時間の休憩を返す
 */
export function detectLunchBreak(startTime: Date, endTime: Date): number {
  const lunchStart = new Date(startTime);
  lunchStart.setHours(12, 0, 0, 0);

  const lunchEnd = new Date(startTime);
  lunchEnd.setHours(13, 0, 0, 0);

  // 出勤時刻が12:00より前で、退勤時刻が13:00より後の場合
  if (startTime < lunchStart && endTime > lunchEnd) {
    return 1; // 1時間の休憩
  }

  return 0; // 休憩なし
}

/**
 * 勤務時間を計算（時間単位）
 */
export function calculateWorkHours(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100; // 小数点第2位まで
}

/**
 * 時刻を HH:MM 形式にフォーマット
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
