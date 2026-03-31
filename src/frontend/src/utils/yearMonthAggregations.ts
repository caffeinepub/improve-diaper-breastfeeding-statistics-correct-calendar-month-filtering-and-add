import { getMonthEnd, getMonthStart, nsToMs } from "./dateRanges";

export interface MonthSummary {
  month: number; // 0-11
  year: number;
  count: number;
  totalDuration?: number; // in seconds, optional for sessions with duration
}

/**
 * Aggregate timestamped records into current-year month buckets
 */
export function aggregateByMonth<T extends { timestamp: bigint }>(
  records: T[],
  year: number,
): MonthSummary[] {
  const monthSummaries: MonthSummary[] = [];

  for (let month = 0; month < 12; month++) {
    const monthStart = getMonthStart(year, month);
    const monthEnd = getMonthEnd(year, month);

    const monthRecords = records.filter(
      (record) =>
        record.timestamp >= monthStart && record.timestamp <= monthEnd,
    );

    monthSummaries.push({
      month,
      year,
      count: monthRecords.length,
    });
  }

  return monthSummaries;
}

/**
 * Aggregate sessions with duration into current-year month buckets
 */
export function aggregateSessionsByMonth<
  T extends { startTime: bigint; duration: bigint },
>(sessions: T[], year: number): MonthSummary[] {
  const monthSummaries: MonthSummary[] = [];

  for (let month = 0; month < 12; month++) {
    const monthStart = getMonthStart(year, month);
    const monthEnd = getMonthEnd(year, month);

    const monthSessions = sessions.filter(
      (session) =>
        session.startTime >= monthStart && session.startTime <= monthEnd,
    );

    const totalDuration = monthSessions.reduce(
      (sum, session) => sum + Number(session.duration / BigInt(1_000_000_000)),
      0,
    );

    monthSummaries.push({
      month,
      year,
      count: monthSessions.length,
      totalDuration,
    });
  }

  return monthSummaries;
}

/**
 * Get month name in English
 */
export function getMonthName(month: number): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[month];
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
