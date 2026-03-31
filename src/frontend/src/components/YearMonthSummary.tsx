import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import React from "react";
import type { MonthSummary } from "../utils/yearMonthAggregations";
import { formatDuration, getMonthName } from "../utils/yearMonthAggregations";

interface YearMonthSummaryProps {
  title: string;
  monthSummaries: MonthSummary[];
  showDuration?: boolean;
}

export default function YearMonthSummary({
  title,
  monthSummaries,
  showDuration = false,
}: YearMonthSummaryProps) {
  const currentYear = monthSummaries[0]?.year || new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title} - {currentYear}
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
              {showDuration && summary.totalDuration !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDuration(summary.totalDuration)}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
