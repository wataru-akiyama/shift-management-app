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

    const docRef = await addDoc(attendancesRef, {
      testerId,
      shiftId,
      date: Timestamp.fromDate(now),
      clockInTime: Timestamp.fromDate(now),
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

    await updateDoc(attendanceRef, {
      clockOutTime: Timestamp.fromDate(now),
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
    if (attendanceData.breakHours !== undefined) {
      updateData.breakHours = attendanceData.breakHours;
    }

    // 勤務時間を計算
    if (attendanceData.recordedClockInTime && attendanceData.recordedClockOutTime) {
      const workHours = calculateWorkHours(
        attendanceData.recordedClockInTime,
        attendanceData.recordedClockOutTime
      );
      updateData.workHours = workHours;

      // 実働時間を計算
      const breakHours = attendanceData.breakHours || 0;
      updateData.actualWorkHours = workHours - breakHours;
    }

    await updateDoc(attendanceRef, updateData);
    console.log('✅ 出退勤記録を更新しました - ID:', attendanceId);
  } catch (error) {
    console.error('出退勤記録更新エラー:', error);
    throw error;
  }
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
