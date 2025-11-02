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
import { ShiftRequest, ShiftRequestStatus } from '@/types';
import { createShift } from './shifts';

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
 * 全シフト申請を取得
 */
export async function getShiftRequests(): Promise<ShiftRequest[]> {
  try {
    const shiftRequestsRef = collection(db, 'shiftRequests');
    const q = query(shiftRequestsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const shiftRequests: ShiftRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shiftRequests.push({
        id: doc.id,
        testerId: data.testerId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return shiftRequests;
  } catch (error) {
    console.error('シフト申請取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のテスターのシフト申請を取得
 */
export async function getShiftRequestsByTester(testerId: string): Promise<ShiftRequest[]> {
  try {
    const shiftRequestsRef = collection(db, 'shiftRequests');
    const q = query(
      shiftRequestsRef,
      where('testerId', '==', testerId)
      // TODO: インデックス構築完了後に有効化
      // orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const shiftRequests: ShiftRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shiftRequests.push({
        id: doc.id,
        testerId: data.testerId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    // クライアント側でソート（降順）
    shiftRequests.sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });

    return shiftRequests;
  } catch (error) {
    console.error('テスター別シフト申請取得エラー:', error);
    throw error;
  }
}

/**
 * ステータス別にシフト申請を取得
 */
export async function getShiftRequestsByStatus(status: ShiftRequestStatus): Promise<ShiftRequest[]> {
  try {
    const shiftRequestsRef = collection(db, 'shiftRequests');
    const q = query(
      shiftRequestsRef,
      where('status', '==', status)
      // TODO: インデックス構築完了後に有効化
      // orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const shiftRequests: ShiftRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      shiftRequests.push({
        id: doc.id,
        testerId: data.testerId,
        date: convertTimestampToDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    // クライアント側でソート（降順）
    shiftRequests.sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });

    return shiftRequests;
  } catch (error) {
    console.error('ステータス別シフト申請取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のシフト申請を取得
 */
export async function getShiftRequest(requestId: string): Promise<ShiftRequest | null> {
  try {
    const requestDoc = await getDoc(doc(db, 'shiftRequests', requestId));

    if (!requestDoc.exists()) {
      return null;
    }

    const data = requestDoc.data();
    return {
      id: requestDoc.id,
      testerId: data.testerId,
      date: convertTimestampToDate(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.error('シフト申請取得エラー:', error);
    throw error;
  }
}

/**
 * シフト申請を作成
 */
export async function createShiftRequest(shiftRequestData: {
  testerId: string;
  date: Date;
  startTime: string;
  endTime: string;
}): Promise<string> {
  try {
    const shiftRequestsRef = collection(db, 'shiftRequests');

    const docRef = await addDoc(shiftRequestsRef, {
      testerId: shiftRequestData.testerId,
      date: Timestamp.fromDate(shiftRequestData.date),
      startTime: shiftRequestData.startTime,
      endTime: shiftRequestData.endTime,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ シフト申請を作成しました - ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('シフト申請作成エラー:', error);
    throw error;
  }
}

/**
 * シフト申請を承認してシフトに変換
 */
export async function approveShiftRequest(
  requestId: string,
  shiftData: {
    projectId: string;
    hourlyWage: number;
    expectedWorkHours: number;
  }
): Promise<string> {
  try {
    // シフト申請を取得
    const request = await getShiftRequest(requestId);
    if (!request) {
      throw new Error('シフト申請が見つかりません');
    }

    // シフトを作成
    const shiftId = await createShift({
      testerId: request.testerId,
      projectId: shiftData.projectId,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      hourlyWage: shiftData.hourlyWage,
      expectedWorkHours: shiftData.expectedWorkHours,
    });

    // シフト申請のステータスを更新
    const requestRef = doc(db, 'shiftRequests', requestId);
    await updateDoc(requestRef, {
      status: 'approved',
      updatedAt: Timestamp.now(),
    });

    console.log('✅ シフト申請を承認しました - 申請ID:', requestId, 'シフトID:', shiftId);
    return shiftId;
  } catch (error) {
    console.error('シフト申請承認エラー:', error);
    throw error;
  }
}

/**
 * シフト申請を却下
 */
export async function rejectShiftRequest(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db, 'shiftRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      updatedAt: Timestamp.now(),
    });

    console.log('✅ シフト申請を却下しました - ID:', requestId);
  } catch (error) {
    console.error('シフト申請却下エラー:', error);
    throw error;
  }
}

/**
 * シフト申請を削除（テスター自身による取消）
 */
export async function deleteShiftRequest(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db, 'shiftRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected', // 実際には削除ではなくステータス変更
      updatedAt: Timestamp.now(),
    });

    console.log('✅ シフト申請を取り消しました - ID:', requestId);
  } catch (error) {
    console.error('シフト申請取消エラー:', error);
    throw error;
  }
}
