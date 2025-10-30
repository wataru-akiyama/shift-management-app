import { Attendance, Shift, Project, WageCalculation, DailyWageBreakdown, ProjectWageBreakdown } from '@/types';

/**
 * 月次給与計算
 */
export function calculateMonthlyWage(
  attendances: Attendance[],
  shifts: Shift[],
  projects: Project[],
  month: string // YYYY-MM 形式
): WageCalculation {
  // シフトと案件のマップを作成
  const shiftMap = new Map(shifts.map((s) => [s.id, s]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // 指定月の出退勤記録のみをフィルター
  const [year, monthNum] = month.split('-').map(Number);
  const monthlyAttendances = attendances.filter((a) => {
    return a.date.getFullYear() === year && a.date.getMonth() + 1 === monthNum;
  });

  // 確定済み（実働時間が計算されている）記録のみを対象
  const confirmedAttendances = monthlyAttendances.filter(
    (a) => a.recordedClockInTime && a.recordedClockOutTime && a.actualWorkHours !== undefined
  );

  // 日別明細を作成
  const dailyBreakdown: DailyWageBreakdown[] = [];

  confirmedAttendances.forEach((attendance) => {
    // 複数案件の時間配分がある場合
    if (attendance.projectAllocations && attendance.projectAllocations.length > 0) {
      attendance.projectAllocations.forEach((allocation) => {
        const project = projectMap.get(allocation.projectId);

        dailyBreakdown.push({
          date: attendance.date,
          projectId: allocation.projectId,
          projectName: allocation.projectName || project?.name || '不明',
          hourlyWage: allocation.hourlyWage,
          workHours: allocation.hours,
          wage: allocation.hourlyWage * allocation.hours,
        });
      });
    } else {
      // 単一案件の場合（既存の処理）
      const shift = shiftMap.get(attendance.shiftId);
      const project = shift ? projectMap.get(shift.projectId) : null;

      dailyBreakdown.push({
        date: attendance.date,
        projectId: shift?.projectId || '',
        projectName: project?.name || '不明',
        hourlyWage: shift?.hourlyWage || 0,
        workHours: attendance.actualWorkHours || 0,
        wage: (shift?.hourlyWage || 0) * (attendance.actualWorkHours || 0),
      });
    }
  });

  // 案件別集計
  const projectWageMap = new Map<string, ProjectWageBreakdown & { dates: Set<string> }>();

  dailyBreakdown.forEach((daily) => {
    const dateKey = daily.date.toDateString();
    const existing = projectWageMap.get(daily.projectId);

    if (existing) {
      existing.dates.add(dateKey);
      existing.workDays = existing.dates.size;
      existing.workHours += daily.workHours;
      existing.wage += daily.wage;
    } else {
      const dates = new Set<string>();
      dates.add(dateKey);
      projectWageMap.set(daily.projectId, {
        projectId: daily.projectId,
        projectName: daily.projectName,
        workDays: 1,
        workHours: daily.workHours,
        wage: daily.wage,
        dates,
      });
    }
  });

  const projectBreakdown = Array.from(projectWageMap.values()).map(({ dates, ...rest }) => rest);

  // 合計計算
  const totalWorkDays = confirmedAttendances.length;
  const totalWorkHours = dailyBreakdown.reduce((sum, d) => sum + d.workHours, 0);
  const totalWage = dailyBreakdown.reduce((sum, d) => sum + d.wage, 0);

  return {
    testerId: confirmedAttendances[0]?.testerId || '',
    testerName: '', // 呼び出し側で設定
    month,
    totalWorkDays,
    totalWorkHours: Math.round(totalWorkHours * 100) / 100,
    totalWage: Math.round(totalWage),
    projectBreakdown,
    dailyBreakdown,
  };
}

/**
 * 複数のテスターの月次給与をまとめて計算
 */
export function calculateAllTesterWages(
  testerIds: string[],
  testerNames: Map<string, string>,
  attendances: Attendance[],
  shifts: Shift[],
  projects: Project[],
  month: string
): WageCalculation[] {
  return testerIds.map((testerId) => {
    const testerAttendances = attendances.filter((a) => a.testerId === testerId);
    const calculation = calculateMonthlyWage(testerAttendances, shifts, projects, month);
    calculation.testerId = testerId;
    calculation.testerName = testerNames.get(testerId) || '不明';
    return calculation;
  });
}

/**
 * 月の文字列を取得（YYYY-MM形式）
 */
export function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 当月の文字列を取得
 */
export function getCurrentMonthString(): string {
  return getMonthString(new Date());
}

/**
 * 前月の文字列を取得
 */
export function getPreviousMonthString(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return getMonthString(date);
}

/**
 * 月の表示名を取得（例：2024年1月）
 */
export function getMonthDisplayName(monthString: string): string {
  const [year, month] = monthString.split('-');
  return `${year}年${parseInt(month)}月`;
}

/**
 * 月の範囲を取得
 */
export function getMonthRange(monthString: string): { start: Date; end: Date } {
  const [year, month] = monthString.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * 案件別給与計算結果
 */
export interface ProjectWageCalculation {
  projectId: string;
  projectName: string;
  totalWage: number;
  testerBreakdown: Array<{
    testerId: string;
    testerName: string;
    workDays: number;
    workHours: number;
    hourlyWage: number;
    wage: number;
  }>;
}

/**
 * 案件別の給与を計算
 */
export function calculateProjectWage(
  projectId: string,
  projectName: string,
  attendances: Attendance[],
  shifts: Shift[],
  testerNames: Map<string, string>
): ProjectWageCalculation {
  const shiftMap = new Map(shifts.map((s) => [s.id, s]));

  // この案件に関連する確定済み出退勤記録を取得
  const confirmedAttendances = attendances.filter(
    (a) => a.recordedClockInTime && a.recordedClockOutTime && a.actualWorkHours !== undefined
  );

  // テスター別の集計用マップ
  const testerWageMap = new Map<string, {
    testerId: string;
    testerName: string;
    workDays: Set<string>;
    workHours: number;
    hourlyWages: number[]; // 複数の時給がある場合があるので配列で保持
    wage: number;
  }>();

  confirmedAttendances.forEach((attendance) => {
    const dateKey = attendance.date.toDateString();
    let projectData: Array<{ hours: number; hourlyWage: number }> = [];

    // 複数案件の時間配分がある場合
    if (attendance.projectAllocations && attendance.projectAllocations.length > 0) {
      const allocations = attendance.projectAllocations.filter((a) => a.projectId === projectId);
      projectData = allocations.map((a) => ({ hours: a.hours, hourlyWage: a.hourlyWage }));
    } else {
      // 単一案件の場合
      const shift = shiftMap.get(attendance.shiftId);
      if (shift && shift.projectId === projectId) {
        projectData = [{
          hours: attendance.actualWorkHours || 0,
          hourlyWage: shift.hourlyWage,
        }];
      }
    }

    // この案件のデータがある場合のみ集計
    projectData.forEach(({ hours, hourlyWage }) => {
      const existing = testerWageMap.get(attendance.testerId);

      if (existing) {
        existing.workDays.add(dateKey);
        existing.workHours += hours;
        existing.hourlyWages.push(hourlyWage);
        existing.wage += hours * hourlyWage;
      } else {
        const workDays = new Set<string>();
        workDays.add(dateKey);
        testerWageMap.set(attendance.testerId, {
          testerId: attendance.testerId,
          testerName: testerNames.get(attendance.testerId) || '不明',
          workDays,
          workHours: hours,
          hourlyWages: [hourlyWage],
          wage: hours * hourlyWage,
        });
      }
    });
  });

  // 結果を整形
  const testerBreakdown = Array.from(testerWageMap.values()).map((data) => ({
    testerId: data.testerId,
    testerName: data.testerName,
    workDays: data.workDays.size,
    workHours: Math.round(data.workHours * 100) / 100,
    hourlyWage: data.hourlyWages.length > 0
      ? Math.round(data.hourlyWages.reduce((sum, w) => sum + w, 0) / data.hourlyWages.length)
      : 0, // 平均時給
    wage: Math.round(data.wage),
  }));

  const totalWage = testerBreakdown.reduce((sum, t) => sum + t.wage, 0);

  return {
    projectId,
    projectName,
    totalWage,
    testerBreakdown,
  };
}
