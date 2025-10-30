import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Shift } from '@/types';

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
 * 全シフトを取得
 */
export async function getShifts(): Promise<Shift[]> {
  try {
    const shiftsRef = collection(db, 'shifts');
    const q = query(shiftsRef, orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    const querySnapshot = await getDocs(q);

    const shifts: Shift[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shifts.push({
        id: doc.id,
        testerId: data.testerId,
        projectId: data.projectId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyWage: data.hourlyWage,
        expectedWorkHours: data.expectedWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return shifts;
  } catch (error) {
    console.error('シフト取得エラー:', error);
    throw error;
  }
}

/**
 * 特定の日付のシフトを取得
 */
export async function getShiftsByDate(date: Date): Promise<Shift[]> {
  try {
    const shiftsRef = collection(db, 'shifts');
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      shiftsRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const shifts: Shift[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shifts.push({
        id: doc.id,
        testerId: data.testerId,
        projectId: data.projectId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyWage: data.hourlyWage,
        expectedWorkHours: data.expectedWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return shifts;
  } catch (error) {
    console.error('日付別シフト取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のテスターのシフトを取得
 */
export async function getShiftsByTester(testerId: string): Promise<Shift[]> {
  try {
    const shiftsRef = collection(db, 'shifts');
    const q = query(
      shiftsRef,
      where('testerId', '==', testerId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const shifts: Shift[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shifts.push({
        id: doc.id,
        testerId: data.testerId,
        projectId: data.projectId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyWage: data.hourlyWage,
        expectedWorkHours: data.expectedWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return shifts;
  } catch (error) {
    console.error('テスター別シフト取得エラー:', error);
    throw error;
  }
}

/**
 * 特定の案件のシフトを取得
 */
export async function getShiftsByProject(projectId: string): Promise<Shift[]> {
  try {
    const shiftsRef = collection(db, 'shifts');
    const q = query(
      shiftsRef,
      where('projectId', '==', projectId),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const shifts: Shift[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shifts.push({
        id: doc.id,
        testerId: data.testerId,
        projectId: data.projectId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyWage: data.hourlyWage,
        expectedWorkHours: data.expectedWorkHours,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return shifts;
  } catch (error) {
    console.error('案件別シフト取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のシフトを取得
 */
export async function getShift(shiftId: string): Promise<Shift | null> {
  try {
    const shiftDoc = await getDoc(doc(db, 'shifts', shiftId));

    if (!shiftDoc.exists()) {
      return null;
    }

    const data = shiftDoc.data();
    return {
      id: shiftDoc.id,
      testerId: data.testerId,
      projectId: data.projectId,
      date: convertTimestampToDate(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      hourlyWage: data.hourlyWage,
      expectedWorkHours: data.expectedWorkHours,
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.error('シフト取得エラー:', error);
    throw error;
  }
}

/**
 * シフトを作成
 */
export async function createShift(shiftData: {
  testerId: string;
  projectId: string;
  date: Date;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  expectedWorkHours: number;
}): Promise<string> {
  try {
    const shiftsRef = collection(db, 'shifts');
    const docRef = await addDoc(shiftsRef, {
      testerId: shiftData.testerId,
      projectId: shiftData.projectId,
      date: Timestamp.fromDate(shiftData.date),
      startTime: shiftData.startTime,
      endTime: shiftData.endTime,
      hourlyWage: shiftData.hourlyWage,
      expectedWorkHours: shiftData.expectedWorkHours,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ シフトを作成しました - ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('シフト作成エラー:', error);
    throw error;
  }
}

/**
 * シフトを更新
 */
export async function updateShift(
  shiftId: string,
  shiftData: Partial<{
    testerId: string;
    projectId: string;
    date: Date;
    startTime: string;
    endTime: string;
    hourlyWage: number;
    expectedWorkHours: number;
  }>
): Promise<void> {
  try {
    const shiftRef = doc(db, 'shifts', shiftId);
    const updateData: any = {
      ...shiftData,
      updatedAt: Timestamp.now(),
    };

    // 日付フィールドをTimestampに変換
    if (shiftData.date) {
      updateData.date = Timestamp.fromDate(shiftData.date);
    }

    await updateDoc(shiftRef, updateData);
    console.log('✅ シフトを更新しました - ID:', shiftId);
  } catch (error) {
    console.error('シフト更新エラー:', error);
    throw error;
  }
}

/**
 * シフトを削除
 */
export async function deleteShift(shiftId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'shifts', shiftId));
    console.log('✅ シフトを削除しました - ID:', shiftId);
  } catch (error) {
    console.error('シフト削除エラー:', error);
    throw error;
  }
}

/**
 * 勤務時間を計算
 */
export function calculateWorkHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  const diffMinutes = endMinutes - startMinutes;
  return diffMinutes / 60;
}
