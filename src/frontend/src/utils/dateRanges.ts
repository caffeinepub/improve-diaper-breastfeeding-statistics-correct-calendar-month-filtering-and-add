// Date range utilities for calendar-based filtering

/**
 * Get the start of the current calendar month (day 1, 00:00:00)
 * Returns timestamp in nanoseconds for backend compatibility
 */
export function getCurrentMonthStart(): bigint {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return BigInt(start.getTime()) * BigInt(1_000_000);
}

/**
 * Get the end of the current calendar month (last day, 23:59:59.999)
 * Returns timestamp in nanoseconds for backend compatibility
 */
export function getCurrentMonthEnd(): bigint {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return BigInt(end.getTime()) * BigInt(1_000_000);
}

/**
 * Get the start of today (00:00:00)
 * Returns timestamp in nanoseconds for backend compatibility
 */
export function getTodayStart(): bigint {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return BigInt(today.getTime()) * BigInt(1_000_000);
}

/**
 * Get the start of 7 days ago (00:00:00)
 * Returns timestamp in nanoseconds for backend compatibility
 */
export function getWeekAgoStart(): bigint {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return BigInt(weekAgo.getTime()) * BigInt(1_000_000);
}

/**
 * Get the start of a specific calendar month
 */
export function getMonthStart(year: number, month: number): bigint {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  return BigInt(start.getTime()) * BigInt(1_000_000);
}

/**
 * Get the end of a specific calendar month
 */
export function getMonthEnd(year: number, month: number): bigint {
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return BigInt(end.getTime()) * BigInt(1_000_000);
}

/**
 * Get the start of a specific day
 */
export function getDayStart(date: Date): bigint {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return BigInt(start.getTime()) * BigInt(1_000_000);
}

/**
 * Get the end of a specific day
 */
export function getDayEnd(date: Date): bigint {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return BigInt(end.getTime()) * BigInt(1_000_000);
}

/**
 * Convert nanosecond timestamp to milliseconds
 */
export function nsToMs(ns: bigint): number {
  return Number(ns / BigInt(1_000_000));
}

/**
 * Convert milliseconds to nanosecond timestamp
 */
export function msToNs(ms: number): bigint {
  return BigInt(ms) * BigInt(1_000_000);
}
