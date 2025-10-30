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
import { Project } from '@/types';

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
 * 全案件を取得
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: convertTimestampToDate(data.startDate),
        endDate: convertTimestampToDate(data.endDate),
        baseHourlyWage: data.baseHourlyWage,
        requiredHours: data.requiredHours,
        status: data.status,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return projects;
  } catch (error) {
    console.error('案件取得エラー:', error);
    throw error;
  }
}

/**
 * アクティブな案件のみを取得
 */
export async function getActiveProjects(): Promise<Project[]> {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef,
      where('status', '==', 'active'),
      orderBy('startDate', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: convertTimestampToDate(data.startDate),
        endDate: convertTimestampToDate(data.endDate),
        baseHourlyWage: data.baseHourlyWage,
        requiredHours: data.requiredHours,
        status: data.status,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      });
    });

    return projects;
  } catch (error) {
    console.error('アクティブ案件取得エラー:', error);
    throw error;
  }
}

/**
 * 特定の案件を取得
 */
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));

    if (!projectDoc.exists()) {
      return null;
    }

    const data = projectDoc.data();
    return {
      id: projectDoc.id,
      name: data.name,
      description: data.description,
      location: data.location,
      startDate: convertTimestampToDate(data.startDate),
      endDate: convertTimestampToDate(data.endDate),
      baseHourlyWage: data.baseHourlyWage,
      requiredHours: data.requiredHours,
      status: data.status,
      createdAt: convertTimestampToDate(data.createdAt),
      updatedAt: convertTimestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.error('案件取得エラー:', error);
    throw error;
  }
}

/**
 * 案件を作成
 */
export async function createProject(projectData: {
  name: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  baseHourlyWage: number;
  requiredHours: number;
}): Promise<string> {
  try {
    const projectsRef = collection(db, 'projects');
    const docRef = await addDoc(projectsRef, {
      name: projectData.name,
      description: projectData.description || '',
      location: projectData.location,
      startDate: Timestamp.fromDate(projectData.startDate),
      endDate: Timestamp.fromDate(projectData.endDate),
      baseHourlyWage: projectData.baseHourlyWage,
      requiredHours: projectData.requiredHours,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ 案件を作成しました - ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('案件作成エラー:', error);
    throw error;
  }
}

/**
 * 案件を更新
 */
export async function updateProject(
  projectId: string,
  projectData: Partial<{
    name: string;
    description: string;
    location: string;
    startDate: Date;
    endDate: Date;
    baseHourlyWage: number;
    requiredHours: number;
    status: 'active' | 'completed' | 'cancelled';
  }>
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const updateData: any = {
      ...projectData,
      updatedAt: Timestamp.now(),
    };

    // 日付フィールドをTimestampに変換
    if (projectData.startDate) {
      updateData.startDate = Timestamp.fromDate(projectData.startDate);
    }
    if (projectData.endDate) {
      updateData.endDate = Timestamp.fromDate(projectData.endDate);
    }

    await updateDoc(projectRef, updateData);
    console.log('✅ 案件を更新しました - ID:', projectId);
  } catch (error) {
    console.error('案件更新エラー:', error);
    throw error;
  }
}

/**
 * 案件のステータスを変更
 */
export async function updateProjectStatus(
  projectId: string,
  status: 'active' | 'completed' | 'cancelled'
): Promise<void> {
  await updateProject(projectId, { status });
}
