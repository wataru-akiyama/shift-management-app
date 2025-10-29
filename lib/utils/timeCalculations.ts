/**
 * 時間文字列をDateオブジェクトに変換
 * @param timeStr - "HH:MM" 形式の時間文字列
 * @param baseDate - 基準日（デフォルトは今日）
 */
export function parseTime(timeStr: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * 稼働予定時間を計算
 * @param startTime - 開始時刻 "HH:MM"
 * @param endTime - 終了時刻 "HH:MM"
 * @param breakStart - 休憩開始時刻 "HH:MM"
 * @param breakEnd - 休憩終了時刻 "HH:MM"
 */
export function calculateExpectedWorkHours(
  startTime: string,
  endTime: string,
  breakStart: string = '12:00',
  breakEnd: string = '13:00'
): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const breakStartTime = parseTime(breakStart);
  const breakEndTime = parseTime(breakEnd);

  // 総時間を計算（ミリ秒 → 時間）
  let totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  // 12:00-13:00を跨ぐ場合は1時間引く
  if (start < breakEndTime && end > breakStartTime) {
    totalHours -= 1;
  }

  return totalHours;
}

/**
 * 出勤時刻を15分単位で切り捨て
 * @param time - 打刻時刻
 */
export function roundClockInTime(time: Date): Date {
  const rounded = new Date(time);
  const minutes = rounded.getMinutes();
  const roundedMinutes = Math.floor(minutes / 15) * 15;
  rounded.setMinutes(roundedMinutes, 0, 0);
  return rounded;
}

/**
 * 退勤時刻を15分単位で切り上げ
 * @param time - 打刻時刻
 */
export function roundClockOutTime(time: Date): Date {
  const rounded = new Date(time);
  const minutes = rounded.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  rounded.setMinutes(roundedMinutes, 0, 0);
  return rounded;
}

/**
 * 実稼働時間を計算
 * @param clockIn - 出勤時刻
 * @param clockOut - 退勤時刻
 * @param breakStart - 休憩開始時刻 "HH:MM"
 * @param breakEnd - 休憩終了時刻 "HH:MM"
 */
export function calculateActualWorkHours(
  clockIn: Date,
  clockOut: Date,
  breakStart: string = '12:00',
  breakEnd: string = '13:00'
): number {
  const breakStartTime = parseTime(breakStart, clockIn);
  const breakEndTime = parseTime(breakEnd, clockIn);

  // 総時間を計算（ミリ秒 → 時間）
  const workMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
  let workHours = workMinutes / 60;

  // 12:00-13:00を跨ぐ場合は1時間引く
  if (clockIn < breakEndTime && clockOut > breakStartTime) {
    workHours -= 1;
  }

  return workHours;
}

/**
 * 給与を計算
 * @param workHours - 稼働時間
 * @param hourlyWage - 時給
 */
export function calculateWage(workHours: number, hourlyWage: number): number {
  return Math.round(workHours * hourlyWage);
}

/**
 * 時刻をHH:MM形式の文字列に変換
 * @param date - 日時
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 * @param date - 日時
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 月をYYYY-MM形式の文字列に変換
 * @param date - 日時
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}
