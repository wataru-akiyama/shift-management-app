import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from '@/types';

/**
 * メールアドレスとパスワードでログイン
 */
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('ログインエラー:', error);
    throw error;
  }
}

/**
 * ログアウト
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('ログアウトエラー:', error);
    throw error;
  }
}

/**
 * 新規ユーザーを作成（招待リンクから）
 */
export async function createUser(email: string, password: string, userData: Partial<User>) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Firestoreにユーザー情報を保存
    const userDoc = {
      id: uid,
      email,
      name: userData.name || '',
      phone: userData.phone || '',
      role: userData.role || 'tester',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', uid), userDoc);
    return userCredential.user;
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    throw error;
  }
}

/**
 * パスワードリセットメールを送信
 */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    throw error;
  }
}

/**
 * 現在のユーザー情報を取得
 */
export async function getCurrentUser(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();

      // デバッグ：生データを確認
      console.log('🔍 Firestoreから取得した生データ:', data);
      console.log('🔍 全フィールド名:', Object.keys(data));
      console.log('🔍 data.role の値:', data.role);
      console.log('🔍 data.role の型:', typeof data.role);

      // 各フィールドを個別に確認
      console.log('🔍 個別フィールド確認:');
      console.log('  - email:', data.email);
      console.log('  - name:', data.name);
      console.log('  - role:', data.role);
      console.log('  - status:', data.status);
      console.log('  - phone:', data.phone);

      const user = {
        id: userDoc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };

      console.log('🔍 返却するユーザーオブジェクト:', user);

      return user;
    }
    return null;
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    throw error;
  }
}

/**
 * ユーザーの役割を確認
 */
export async function checkUserRole(uid: string): Promise<UserRole | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role as UserRole;
    }
    return null;
  } catch (error) {
    console.error('役割確認エラー:', error);
    throw error;
  }
}
