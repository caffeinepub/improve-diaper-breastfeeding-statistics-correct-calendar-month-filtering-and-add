import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useAddMilkPumpingSession,
  useDeleteMilkPumpingSession,
  useGetMilkPumpingSessionsForChild,
} from "../hooks/useQueries";

interface PumpingModuleProps {
  childId: string | null;
}

function toLTTimestamp(dateStr: string, timeStr: string): bigint {
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  return BigInt(dt.getTime()) * 1_000_000n;
}

function fromNsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

function getLTDayKey(tsMs: number): string {
  const d = new Date(tsMs);
  const lt = new Date(
    d.toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
  );
  return `${lt.getFullYear()}-${String(lt.getMonth() + 1).padStart(2, "0")}-${String(lt.getDate()).padStart(2, "0")}`;
}

function getLTMonthKey(tsMs: number): string {
  const d = new Date(tsMs);
  const lt = new Date(
    d.toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
  );
  return `${lt.getFullYear()}-${String(lt.getMonth() + 1).padStart(2, "0")}`;
}

const SIDE_LABELS: Record<string, string> = {
  left: "Kairė",
  right: "Dešinė",
  both: "Abu",
};

export default function PumpingModule({ childId }: PumpingModuleProps) {
  const { data: sessions = [] } = useGetMilkPumpingSessionsForChild(childId);
  const addSession = useAddMilkPumpingSession();
  const deleteSession = useDeleteMilkPumpingSession();

  const [open, setOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | "both">(
    "both",
  );
  const [mlAmount, setMlAmount] = useState("");
  const [dateStr, setDateStr] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!childId) return;
    const ml = Number.parseFloat(mlAmount);
    if (Number.isNaN(ml) || ml <= 0) {
      toast.error("Įveskite teisingą ml kiekį");
      return;
    }
    try {
      await addSession.mutateAsync({
        childId,
        timestamp: toLTTimestamp(dateStr, timeStr),
        mlAmount: ml,
        side: selectedSide,
      });
      toast.success("Pieno nutraukimas išsaugotas");
      setOpen(false);
      setMlAmount("");
      setSelectedSide("both");
    } catch {
      toast.error("Nepavyko išsaugoti");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!childId) return;
    try {
      await deleteSession.mutateAsync({ childId, sessionId });
      toast.success("Sesija ištrinta");
    } catch {
      toast.error("Nepavyko ištrinti");
    }
  };

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => Number(b.timestamp - a.timestamp)),
    [sessions],
  );

  // Calendar helpers
  const calMonthKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;

  const dayMap = useMemo(() => {
    const map: Record<string, { count: number; totalMl: number }> = {};
    for (const s of sessions) {
      const ms = fromNsToMs(s.timestamp);
      const day = getLTDayKey(ms);
      if (!map[day]) map[day] = { count: 0, totalMl: 0 };
      map[day].count++;
      map[day].totalMl += s.mlAmount;
    }
    return map;
  }, [sessions]);

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const days: { key: string; day: string | null }[] = [];
    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7; // Monday-based
    for (let i = 1; i < startDow; i++)
      days.push({ key: `empty-${calYear}-${calMonth}-${i}`, day: null });
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ key: dayStr, day: dayStr });
    }
    return days;
  }, [calYear, calMonth]);

  const monthNames = [
    "Sausis",
    "Vasaris",
    "Kovas",
    "Balandis",
    "Gegužė",
    "Birželis",
    "Liepa",
    "Rugpjūtis",
    "Rugsėjis",
    "Spalis",
    "Lapkritis",
    "Gruodis",
  ];

  const selectedDayData = selectedDay ? dayMap[selectedDay] : null;

  const totalMl = sessions.reduce((sum, s) => sum + s.mlAmount, 0);
  const thisMonthSessions = sessions.filter(
    (s) => getLTMonthKey(fromNsToMs(s.timestamp)) === calMonthKey,
  );
  const thisMonthMl = thisMonthSessions.reduce((sum, s) => sum + s.mlAmount, 0);

  if (!childId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Pasirinkite vaiką, kad matytumėte pieno traukimo sesijas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Pieno nutraukimas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Pridėti
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nauja pieno traukimo sesija</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Side selector */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Krūtinė
                </Label>
                <div className="flex gap-2">
                  {(["left", "right", "both"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setSelectedSide(side)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selectedSide === side
                          ? "border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-400 dark:bg-pink-950/30 dark:text-pink-300"
                          : "border-border bg-card text-muted-foreground hover:border-pink-300"
                      }`}
                    >
                      {SIDE_LABELS[side]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ML amount */}
              <div>
                <Label htmlFor="ml" className="mb-1 block text-sm font-medium">
                  Kiekis (ml)
                </Label>
                <Input
                  id="ml"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="pvz. 120"
                  value={mlAmount}
                  onChange={(e) => setMlAmount(e.target.value)}
                />
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="date"
                    className="mb-1 block text-sm font-medium"
                  >
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="time"
                    className="mb-1 block text-sm font-medium"
                  >
                    Laikas
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleAdd}
                disabled={addSession.isPending}
              >
                {addSession.isPending ? "Saugoma..." : "Išsaugoti"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Iš viso seansų</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Iš viso ml</p>
            <p className="text-2xl font-bold">{totalMl.toFixed(0)} ml</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Šį mėnesį seansų</p>
            <p className="text-2xl font-bold">{thisMonthSessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Šį mėnesį ml</p>
            <p className="text-2xl font-bold">{thisMonthMl.toFixed(0)} ml</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Paskutinės sesijos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Dar nėra sesijų.</p>
          ) : (
            sorted.slice(0, 10).map((s) => {
              const ms = fromNsToMs(s.timestamp);
              const sideKey =
                s.side === "left" ||
                (typeof s.side === "object" && "left" in s.side)
                  ? "left"
                  : s.side === "right" ||
                      (typeof s.side === "object" && "right" in s.side)
                    ? "right"
                    : "both";
              return (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {s.mlAmount.toFixed(0)} ml &bull; {SIDE_LABELS[sideKey]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ms).toLocaleString("lt-LT", {
                        timeZone: "Europe/Vilnius",
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(s.sessionId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Kalendorius</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else setCalMonth((m) => m - 1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {monthNames[calMonth]} {calYear}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else setCalMonth((m) => m + 1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"].map((d) => (
              <div
                key={d}
                className="text-xs font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
            {calDays.map(({ key, day }) => {
              if (!day) return <div key={key} />;
              const data = dayMap[day];
              const isSelected = selectedDay === day;
              const isToday = day === getLTDayKey(Date.now());
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`rounded-lg p-1 text-xs transition-all ${
                    isSelected
                      ? "bg-pink-500 text-white ring-2 ring-pink-400"
                      : data
                        ? "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200 hover:bg-pink-200"
                        : isToday
                          ? "bg-muted font-bold"
                          : "hover:bg-muted"
                  }`}
                >
                  <div>{Number.parseInt(day.slice(-2))}</div>
                  {data && (
                    <div className="text-[9px] font-semibold leading-tight">
                      {data.totalMl.toFixed(0)}ml
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-3 rounded-lg border border-pink-200 bg-pink-50 p-3 dark:border-pink-800 dark:bg-pink-950/20">
              <p className="text-sm font-medium">
                {new Date(selectedDay).toLocaleDateString("lt-LT", {
                  dateStyle: "long",
                })}
              </p>
              {selectedDayData ? (
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Seansų:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedDayData.count}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Iš viso:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedDayData.totalMl.toFixed(0)} ml
                    </span>
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Šią dieną sesijų nebuvo.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
