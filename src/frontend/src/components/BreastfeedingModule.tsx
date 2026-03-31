import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pause, Play, Square } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCompleteBreastfeedingSession,
  useGetActiveBreastfeedingTimer,
  useGetBreastfeedingSessionsForChild,
  usePauseBreastfeedingTimer,
  useResumeBreastfeedingTimer,
  useStartBreastfeedingSession,
} from "../hooks/useQueries";
import { aggregateSessionsByMonth } from "../utils/yearMonthAggregations";
import BreastfeedingDayCalendar from "./BreastfeedingDayCalendar";
import BreastfeedingHistory from "./BreastfeedingHistory";
import BreastfeedingStatistics from "./BreastfeedingStatistics";
import ManualBreastfeedingEntry from "./ManualBreastfeedingEntry";
import YearMonthSummary from "./YearMonthSummary";

interface BreastfeedingModuleProps {
  childId: string | null;
}

type TimerMode = "chronometer" | "countdown";

export default function BreastfeedingModule({
  childId,
}: BreastfeedingModuleProps) {
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [mode, setMode] = useState<TimerMode>("chronometer");
  const [displayTime, setDisplayTime] = useState(0);

  const { data: sessions = [] } = useGetBreastfeedingSessionsForChild(childId);
  const startSession = useStartBreastfeedingSession();
  const completeSession = useCompleteBreastfeedingSession();
  const pauseTimer = usePauseBreastfeedingTimer();
  const resumeTimer = useResumeBreastfeedingTimer();
  const { data: activeTimer } = useGetActiveBreastfeedingTimer(childId);

  useEffect(() => {
    if (activeTimer) {
      setSide(activeTimer.side === "left" ? "left" : "right");

      const calculateElapsed = () => {
        const now = Date.now();
        const startTimeMs = Number(activeTimer.startTime / BigInt(1_000_000));
        const totalPausedMs = Number(
          activeTimer.totalPausedDuration / BigInt(1_000_000),
        );

        if (activeTimer.isPaused && activeTimer.pausedAt) {
          const pausedAtMs = Number(activeTimer.pausedAt / BigInt(1_000_000));
          return Math.floor((pausedAtMs - startTimeMs - totalPausedMs) / 1000);
        }
        return Math.floor((now - startTimeMs - totalPausedMs) / 1000);
      };

      setDisplayTime(calculateElapsed());
    } else {
      setDisplayTime(0);
    }
  }, [activeTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTimer && !activeTimer.isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        const startTimeMs = Number(activeTimer.startTime / BigInt(1_000_000));
        const totalPausedMs = Number(
          activeTimer.totalPausedDuration / BigInt(1_000_000),
        );
        const elapsed = Math.floor((now - startTimeMs - totalPausedMs) / 1000);
        setDisplayTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const handleStart = async () => {
    if (!side || !childId) {
      toast.error("Pasirinkite pusę");
      return;
    }

    try {
      await startSession.mutateAsync({ childId, side });
      setMode("chronometer");
      toast.success("Laikmatis pradėtas");
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Nepavyko pradėti sesijos");
    }
  };

  const handlePause = async () => {
    if (!childId) return;
    try {
      await pauseTimer.mutateAsync(childId);
    } catch (error) {
      console.error("Error pausing timer:", error);
      toast.error("Nepavyko pristabdyti laikmačio");
    }
  };

  const handleResume = async () => {
    if (!childId) return;
    try {
      await resumeTimer.mutateAsync(childId);
    } catch (error) {
      console.error("Error resuming timer:", error);
      toast.error("Nepavyko tęsti laikmačio");
    }
  };

  const handleStop = async () => {
    if (!childId) return;

    try {
      await completeSession.mutateAsync(childId);
      const durationMinutes = Math.floor(displayTime / 60);
      const durationSeconds = displayTime % 60;
      toast.success(
        `Sesija užbaigta! Trukmė: ${durationMinutes} min ${durationSeconds} sek`,
      );
      setSide(null);
      setMode("chronometer");
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Nepavyko užbaigti sesijos");
    }
  };

  const startCountdown = async (_minutes: number) => {
    if (!side || !childId) {
      toast.error("Pasirinkite pusę");
      return;
    }

    try {
      await startSession.mutateAsync({ childId, side });
      setMode("countdown");
    } catch (error) {
      console.error("Error starting countdown:", error);
      toast.error("Nepavyko pradėti sesijos");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimerActive = !!activeTimer;
  const isTimerPaused = activeTimer?.isPaused || false;

  // Year-by-month summary
  const currentYear = new Date().getFullYear();
  const monthSummaries = aggregateSessionsByMonth(sessions, currentYear);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <Card className="w-full max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/bottle-icon-transparent.dim_100x100.png"
                alt="Žindymas"
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="truncate">Žindymas</span>
            </div>
            <ManualBreastfeedingEntry childId={childId} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 block text-sm font-medium">Pasirinkite pusę</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSide("left")}
                disabled={isTimerActive}
                className={`rounded-xl border-2 px-4 py-4 text-center font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  side === "left"
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                Kairė
              </button>
              <button
                type="button"
                onClick={() => setSide("right")}
                disabled={isTimerActive}
                className={`rounded-xl border-2 px-4 py-4 text-center font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  side === "right"
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                Dešinė
              </button>
            </div>
          </div>

          {!isTimerActive && (
            <>
              <div>
                <p className="mb-2 block text-sm font-medium">Chronometras</p>
                <Button
                  onClick={handleStart}
                  disabled={!side || startSession.isPending}
                  className="w-full gap-2"
                >
                  <Play className="h-4 w-4" />
                  Pradėti
                </Button>
              </div>

              <div>
                <p className="mb-2 block text-sm font-medium">
                  Greiti nustatymai
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => startCountdown(15)}
                    disabled={!side || startSession.isPending}
                    variant="outline"
                  >
                    15 min
                  </Button>
                  <Button
                    onClick={() => startCountdown(20)}
                    disabled={!side || startSession.isPending}
                    variant="outline"
                  >
                    20 min
                  </Button>
                  <Button
                    onClick={() => startCountdown(30)}
                    disabled={!side || startSession.isPending}
                    variant="outline"
                  >
                    30 min
                  </Button>
                  <Button
                    onClick={() => startCountdown(60)}
                    disabled={!side || startSession.isPending}
                    variant="outline"
                  >
                    1 val
                  </Button>
                </div>
              </div>
            </>
          )}

          {isTimerActive && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center shadow-sm">
                <p className="mb-2 text-sm text-muted-foreground font-medium">
                  {mode === "chronometer"
                    ? "Chronometras"
                    : "Atgalinis skaičiavimas"}
                </p>
                <p className="text-5xl font-bold tabular-nums text-primary mb-3">
                  {formatTime(displayTime)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pusė:{" "}
                  <span className="font-semibold text-foreground">
                    {side === "left" ? "Kairė" : "Dešinė"}
                  </span>
                </p>
                {isTimerPaused && (
                  <p className="mt-3 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    ⏸ Pristabdyta
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!isTimerPaused ? (
                  <>
                    <Button
                      onClick={handlePause}
                      variant="outline"
                      className="gap-2"
                      disabled={pauseTimer.isPending}
                    >
                      <Pause className="h-4 w-4" />
                      Pauzė
                    </Button>
                    <Button
                      onClick={handleStop}
                      className="gap-2"
                      disabled={completeSession.isPending}
                    >
                      <Square className="h-4 w-4" />
                      {completeSession.isPending ? "Saugoma..." : "Baigta"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleResume}
                      className="gap-2"
                      disabled={resumeTimer.isPending}
                    >
                      <Play className="h-4 w-4" />
                      Tęsti
                    </Button>
                    <Button
                      onClick={handleStop}
                      variant="outline"
                      className="gap-2"
                      disabled={completeSession.isPending}
                    >
                      <Square className="h-4 w-4" />
                      {completeSession.isPending ? "Saugoma..." : "Baigta"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BreastfeedingStatistics sessions={sessions} />
      <BreastfeedingDayCalendar sessions={sessions} />
      <YearMonthSummary
        title="Monthly Breastfeeding Summary"
        monthSummaries={monthSummaries}
        showDuration={true}
      />
      <BreastfeedingHistory childId={childId} />
    </div>
  );
}
