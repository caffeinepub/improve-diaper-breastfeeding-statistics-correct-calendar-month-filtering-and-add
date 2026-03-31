import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import React from "react";
import type { Variant_left_right } from "../backend";
import { useGetBreastfeedingSessionsForChild } from "../hooks/useQueries";

interface BreastfeedingHistoryProps {
  childId: string | null;
}

export default function BreastfeedingHistory({
  childId,
}: BreastfeedingHistoryProps) {
  const { data: sessions = [] } = useGetBreastfeedingSessionsForChild(childId);

  const formatDuration = (durationNs: bigint) => {
    const seconds = Number(durationNs / BigInt(1_000_000_000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp / BigInt(1_000_000)));
    return date.toLocaleDateString("lt-LT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSide = (side: Variant_left_right) => {
    return side === "left" ? "Kairė" : "Dešinė";
  };

  const sortedSessions = [...sessions].sort((a, b) =>
    Number(b.startTime - a.startTime),
  );

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Žindymo istorija</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Dar nėra žindymo sesijų
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Žindymo istorija</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSessions.slice(0, 10).map((session) => (
            <div
              key={session.startTime.toString()}
              className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20 p-4 transition-all hover:shadow-md"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(session.startTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    {formatDuration(session.duration)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {getSide(session.side)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {sessions.length > 10 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Rodoma {Math.min(10, sessions.length)} iš {sessions.length} sesijų
          </p>
        )}
      </CardContent>
    </Card>
  );
}
