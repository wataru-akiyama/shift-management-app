// ユーザー役割
export type UserRole = 'admin' | 'tester';

// ユーザーステータス
export type UserStatus = 'active' | 'inactive';

// シフト希望ステータス
export type ShiftRequestStatus = 'pending' | 'approved' | 'rejected';

// ユーザー
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 案件ステータス
export type ProjectStatus = 'active' | 'completed' | 'cancelled';

// 案件
export interface Project {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  baseHourlyWage: number;
  requiredHours: number;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

// シフト希望
export interface ShiftRequest {
  id: string;
  testerId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: ShiftRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

// 確定シフト
export interface Shift {
  id: string;
  testerId: string;
  projectId: string;
  date: Date;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  expectedWorkHours: number;
  createdAt: Date;
  updatedAt: Date;
}

// 出退勤記録
export interface Attendance {
  id: string;
  testerId: string;
  shiftId: string;
  date: Date;

  // 打刻時刻（参考データ）
  clockInTime?: Date;
  clockOutTime?: Date;

  // 正式記録時刻（給与計算用）
  recordedClockInTime?: Date;
  recordedClockOutTime?: Date;

  // 勤務時間
  workHours?: number;
  breakHours?: number;
  actualWorkHours?: number;

  createdAt: Date;
  updatedAt: Date;
}

// システム設定
export interface Settings {
  id: string;
  breakStartTime: string;  // 例: "12:00"
  breakEndTime: string;    // 例: "13:00"
  updatedAt: Date;
}

// 給与計算結果
export interface WageCalculation {
  testerId: string;
  testerName: string;
  month: string; // YYYY-MM
  totalWorkDays: number;
  totalWorkHours: number;
  totalWage: number;
  projectBreakdown: ProjectWageBreakdown[];
  dailyBreakdown: DailyWageBreakdown[];
}

// 案件別給与内訳
export interface ProjectWageBreakdown {
  projectId: string;
  projectName: string;
  workDays: number;
  workHours: number;
  wage: number;
}

// 日別給与内訳
export interface DailyWageBreakdown {
  date: Date;
  projectId: string;
  projectName: string;
  hourlyWage: number;
  workHours: number;
  wage: number;
}
