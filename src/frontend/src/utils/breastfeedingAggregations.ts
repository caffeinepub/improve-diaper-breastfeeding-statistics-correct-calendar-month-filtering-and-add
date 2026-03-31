import type { BreastfeedingSession } from "../backend";
import { getDayEnd, getDayStart, nsToMs } from "./dateRanges";

export interface DaySessionData {
  date: Date;
  sessionCount: number;
  totalDuration: number; // in seconds
}

/**
 * Group breastfeeding sessions by day for a given month
 * Returns an array of day data with session counts and total durations
 */
export function groupSessionsByDay(
  sessions: BreastfeedingSession[],
  year: number,
  month: number,
): DaySessionData[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayMap = new Map<string, DaySessionData>();

  // Initialize all days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = date.toISOString().split("T")[0];
    dayMap.set(key, {
      date,
      sessionCount: 0,
      totalDuration: 0,
    });
  }

  // Aggregate sessions by day
  for (const session of sessions) {
    const sessionDate = new Date(nsToMs(session.startTime));
    const key = sessionDate.toISOString().split("T")[0];

    if (dayMap.has(key)) {
      const dayData = dayMap.get(key)!;
      dayData.sessionCount++;
      dayData.totalDuration += Number(session.duration / BigInt(1_000_000_000)); // Convert ns to seconds
    }
  }

  return Array.from(dayMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
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
