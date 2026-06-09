/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
export function kstToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

/** KST 기준 어제 날짜 (YYYY-MM-DD) */
export function kstYesterday(): string {
  return new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

/** KST 기준 이번 달 (YYYY-MM) */
export function kstTodayMonth(): string {
  return kstToday().slice(0, 7)
}

/** KST 기준 n일 전 날짜 (YYYY-MM-DD) */
export function kstDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}
