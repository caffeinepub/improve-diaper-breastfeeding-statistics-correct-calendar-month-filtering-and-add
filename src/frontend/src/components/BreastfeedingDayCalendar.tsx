import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import React from "react";
import type { BreastfeedingSession } from "../backend";
import {
  formatDuration,
  groupSessionsByDay,
} from "../utils/breastfeedingAggregations";

interface BreastfeedingDayCalendarProps {
  sessions: BreastfeedingSession[];
}

export default function BreastfeedingDayCalendar({
  sessions,
}: BreastfeedingDayCalendarProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const dayData = groupSessionsByDay(sessions, currentYear, currentMonth);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Daily Calendar - {monthNames[currentMonth]} {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from(
            { length: dayData[0]?.date.getDay() || 0 },
            (_, i) =>
              `empty-bf-${dayData[0]?.date.getMonth() ?? 0}-${dayData[0]?.date.getFullYear() ?? 0}-${i}`,
          ).map((emptyKey) => (
            <div key={emptyKey} className="p-2" />
          ))}

          {/* Day cells */}
          {dayData.map((day) => {
            const isToday =
              day.date.getDate() === now.getDate() &&
              day.date.getMonth() === now.getMonth() &&
              day.date.getFullYear() === now.getFullYear();

            return (
              <div
                key={day.date.toISOString()}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  isToday
                    ? "border-primary bg-primary/10"
                    : day.sessionCount > 0
                      ? "border-border bg-accent/30 hover:bg-accent/50"
                      : "border-border/50 bg-card"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${isToday ? "text-primary" : ""}`}
                >
                  {day.date.getDate()}
                </div>
                {day.sessionCount > 0 ? (
                  <>
                    <div className="text-xs font-medium text-foreground">
                      {day.sessionCount}{" "}
                      {day.sessionCount === 1 ? "session" : "sessions"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(day.totalDuration)}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">-</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
