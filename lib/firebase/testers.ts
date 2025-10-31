import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { User } from '@/types';

/**
 * 全テスターを取得
 */
export async function getTesters(): Promise<User[]> {
  try {
    const testersRef = collection(db, 'users');
    const q = query(
      testersRef,
      where('role', '==', 'tester'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const testers: User[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      testers.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });

    return testers;
  } catch (error) {
    console.error('テスター一覧取得エラー:', error);
    throw error;
  }
}

/**
 * アクティブなテスターのみ取得
 */
export async function getActiveTesters(): Promise<User[]> {
  try {
    const testersRef = collection(db, 'users');
    const q = query(
      testersRef,
      where('role', '==', 'tester'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const testers: User[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      testers.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });

    return testers;
  } catch (error) {
    console.error('アクティブテスター取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のテスターを取得
 */
export async function getTester(testerId: string): Promise<User | null> {
  try {
    const testerDoc = await getDoc(doc(db, 'users', testerId));

    if (testerDoc.exists()) {
      const data = testerDoc.data();
      return {
        id: testerDoc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }

    return null;
  } catch (error) {
    console.error('テスター取得エラー:', error);
    throw error;
  }
}

/**
 * テスター情報を作成（Firebase AuthenticationのUIDを使用）
 */
export async function createTesterWithUID(
  uid: string,
  testerData: {
    name: string;
    email: string;
    phone: string;
  }
): Promise<string> {
  try {
    const userRef = doc(db, 'users', uid);

    // 指定されたUIDでドキュメントを作成
    await setDoc(userRef, {
      name: testerData.name,
      email: testerData.email,
      phone: testerData.phone,
      role: 'tester',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return uid;
  } catch (error) {
    console.error('テスター作成エラー:', error);
    throw error;
  }
}

/**
 * テスター情報を作成（Firestoreのみ、認証は後で）
 * @deprecated createTesterWithUID を使用してください
 */
export async function createTesterData(testerData: {
  name: string;
  email: string;
  phone: string;
}): Promise<string> {
  try {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      name: testerData.name,
      email: testerData.email,
      phone: testerData.phone,
      role: 'tester',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // ドキュメントIDをidフィールドとしても保存
    await updateDoc(docRef, {
      id: docRef.id,
    });

    return docRef.id;
  } catch (error) {
    console.error('テスター作成エラー:', error);
    throw error;
  }
}

/**
 * テスター情報を更新
 */
export async function updateTester(
  testerId: string,
  testerData: {
    name?: string;
    email?: string;
    phone?: string;
    status?: 'active' | 'inactive';
  }
): Promise<void> {
  try {
    const testerRef = doc(db, 'users', testerId);
    await updateDoc(testerRef, {
      ...testerData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('テスター更新エラー:', error);
    throw error;
  }
}

/**
 * テスターのステータスを変更
 */
export async function updateTesterStatus(
  testerId: string,
  status: 'active' | 'inactive'
): Promise<void> {
  try {
    await updateTester(testerId, { status });
  } catch (error) {
    console.error('テスターステータス更新エラー:', error);
    throw error;
  }
}
