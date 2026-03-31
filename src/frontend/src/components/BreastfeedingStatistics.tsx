import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, Clock } from "lucide-react";
import React from "react";
import type { BreastfeedingSession } from "../backend";
import { getCurrentMonthEnd, getCurrentMonthStart } from "../utils/dateRanges";

interface BreastfeedingStatisticsProps {
  sessions: BreastfeedingSession[];
}

export default function BreastfeedingStatistics({
  sessions,
}: BreastfeedingStatisticsProps) {
  // All-time totals
  const allTimeSessionCount = sessions.length;
  const allTimeTotalDuration = sessions.reduce(
    (sum, session) => sum + Number(session.duration / BigInt(1_000_000_000)),
    0,
  );

  // This month totals (calendar month)
  const monthStart = getCurrentMonthStart();
  const monthEnd = getCurrentMonthEnd();
  const thisMonthSessions = sessions.filter(
    (session) =>
      session.startTime >= monthStart && session.startTime <= monthEnd,
  );
  const thisMonthCount = thisMonthSessions.length;
  const thisMonthDuration = thisMonthSessions.reduce(
    (sum, session) => sum + Number(session.duration / BigInt(1_000_000_000)),
    0,
  );

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* All-time statistics */}
      <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <Activity className="h-5 w-5" />
            All-Time Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Total Sessions
              </div>
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {allTimeSessionCount}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Total Time
              </div>
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {formatDuration(allTimeTotalDuration)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This month statistics */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Calendar className="h-5 w-5" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Sessions
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {thisMonthCount}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Duration
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatDuration(thisMonthDuration)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
