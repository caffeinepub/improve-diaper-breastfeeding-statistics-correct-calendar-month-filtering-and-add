import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Calendar, TrendingUp } from "lucide-react";
import React from "react";
import { useGetDiaperLogsForChild } from "../hooks/useQueries";
import {
  getCurrentMonthEnd,
  getCurrentMonthStart,
  getTodayStart,
  getWeekAgoStart,
} from "../utils/dateRanges";
import { aggregateByMonth, getMonthName } from "../utils/yearMonthAggregations";

interface DiaperStatisticsProps {
  childId: string | null;
}

export default function DiaperStatistics({ childId }: DiaperStatisticsProps) {
  const { data: logs = [] } = useGetDiaperLogsForChild(childId);

  const todayStart = getTodayStart();
  const weekStart = getWeekAgoStart();
  const monthStart = getCurrentMonthStart();
  const monthEnd = getCurrentMonthEnd();

  const todayLogs = logs.filter((log) => log.timestamp >= todayStart);
  const weekLogs = logs.filter((log) => log.timestamp >= weekStart);
  const monthLogs = logs.filter(
    (log) => log.timestamp >= monthStart && log.timestamp <= monthEnd,
  );

  const countContents = (logsList: typeof logs) => {
    return {
      total: logsList.length,
      kakis: logsList.filter((log) => log.contents.kakis).length,
      sysius: logsList.filter((log) => log.contents.sysius).length,
      tuscia: logsList.filter((log) => log.contents.tuscia).length,
    };
  };

  const todayStats = countContents(todayLogs);
  const weekStats = countContents(weekLogs);
  const monthStats = countContents(monthLogs);

  // Year-by-month summary
  const currentYear = new Date().getFullYear();
  const monthSummaries = aggregateByMonth(logs, currentYear);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Calendar className="h-5 w-5" />
            Šiandien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Iš viso:</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {todayStats.total}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 rounded bg-amber-100 dark:bg-amber-900/30">
                <div className="font-semibold text-amber-700 dark:text-amber-300">
                  Kakis
                </div>
                <div className="text-lg font-bold">{todayStats.kakis}</div>
              </div>
              <div className="text-center p-2 rounded bg-yellow-100 dark:bg-yellow-900/30">
                <div className="font-semibold text-yellow-700 dark:text-yellow-300">
                  Sysius
                </div>
                <div className="text-lg font-bold">{todayStats.sysius}</div>
              </div>
              <div className="text-center p-2 rounded bg-gray-100 dark:bg-gray-800">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  Tuščia
                </div>
                <div className="text-lg font-bold">{todayStats.tuscia}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <TrendingUp className="h-5 w-5" />
            Ši savaitė
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Iš viso:</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {weekStats.total}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 rounded bg-amber-100 dark:bg-amber-900/30">
                <div className="font-semibold text-amber-700 dark:text-amber-300">
                  Kakis
                </div>
                <div className="text-lg font-bold">{weekStats.kakis}</div>
              </div>
              <div className="text-center p-2 rounded bg-yellow-100 dark:bg-yellow-900/30">
                <div className="font-semibold text-yellow-700 dark:text-yellow-300">
                  Sysius
                </div>
                <div className="text-lg font-bold">{weekStats.sysius}</div>
              </div>
              <div className="text-center p-2 rounded bg-gray-100 dark:bg-gray-800">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  Tuščia
                </div>
                <div className="text-lg font-bold">{weekStats.tuscia}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Baby className="h-5 w-5" />
            Šis mėnuo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Iš viso:</span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {monthStats.total}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 rounded bg-amber-100 dark:bg-amber-900/30">
                <div className="font-semibold text-amber-700 dark:text-amber-300">
                  Kakis
                </div>
                <div className="text-lg font-bold">{monthStats.kakis}</div>
              </div>
              <div className="text-center p-2 rounded bg-yellow-100 dark:bg-yellow-900/30">
                <div className="font-semibold text-yellow-700 dark:text-yellow-300">
                  Sysius
                </div>
                <div className="text-lg font-bold">{monthStats.sysius}</div>
              </div>
              <div className="text-center p-2 rounded bg-gray-100 dark:bg-gray-800">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  Tuščia
                </div>
                <div className="text-lg font-bold">{monthStats.tuscia}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year-by-month summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Monthly Summary - {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {monthSummaries.map((summary) => (
              <div
                key={summary.month}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {getMonthName(summary.month)}
                </div>
                <div className="text-2xl font-bold">{summary.count}</div>
                <div className="text-xs text-muted-foreground">changes</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
