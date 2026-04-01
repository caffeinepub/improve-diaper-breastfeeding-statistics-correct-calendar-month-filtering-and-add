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
import { Plus, Trash2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useAddFeedingSession,
  useDeleteFeedingSession,
  useGetFeedingSessionsForChild,
} from "../hooks/useQueries";

interface FeedingModuleProps {
  childId: string | null;
}

function fromNsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

function getLTMonthKey(tsMs: number): string {
  const d = new Date(tsMs);
  const lt = new Date(
    d.toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
  );
  return `${lt.getFullYear()}-${String(lt.getMonth() + 1).padStart(2, "0")}`;
}

const TYPE_LABELS: Record<string, string> = {
  misinukas: "Mišinukas",
  mamosPienas: "Mamos pienas",
};

export default function FeedingModule({ childId }: FeedingModuleProps) {
  const { data: sessions = [] } = useGetFeedingSessionsForChild(childId);
  const addSession = useAddFeedingSession();
  const deleteSession = useDeleteFeedingSession();

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"misinukas" | "mamosPienas">(
    "misinukas",
  );
  const [mlAmount, setMlAmount] = useState("");

  const handleAdd = async () => {
    if (!childId) return;
    const ml = Number.parseFloat(mlAmount);
    if (Number.isNaN(ml) || ml <= 0) {
      toast.error("Įveskite teisingą ml kiekį");
      return;
    }
    try {
      const now = BigInt(Date.now()) * 1_000_000n;
      await addSession.mutateAsync({
        childId,
        timestamp: now,
        mlAmount: ml,
        feedingType: selectedType,
      });
      toast.success("Maitinimas išsaugotas");
      setOpen(false);
      setMlAmount("");
      setSelectedType("misinukas");
    } catch {
      toast.error("Nepavyko išsaugoti");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!childId) return;
    try {
      await deleteSession.mutateAsync({ childId, sessionId });
      toast.success("Įrašas ištrintas");
    } catch {
      toast.error("Nepavyko ištrinti");
    }
  };

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => Number(b.timestamp - a.timestamp)),
    [sessions],
  );

  const today = new Date();
  const todayLT = new Date(
    today.toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
  );
  const todayKey = `${todayLT.getFullYear()}-${String(todayLT.getMonth() + 1).padStart(2, "0")}-${String(todayLT.getDate()).padStart(2, "0")}`;
  const thisMonthKey = `${todayLT.getFullYear()}-${String(todayLT.getMonth() + 1).padStart(2, "0")}`;

  const todaySessions = useMemo(
    () =>
      sessions.filter((s) => {
        const ms = fromNsToMs(s.timestamp);
        const d = new Date(ms);
        const lt = new Date(
          d.toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
        );
        const key = `${lt.getFullYear()}-${String(lt.getMonth() + 1).padStart(2, "0")}-${String(lt.getDate()).padStart(2, "0")}`;
        return key === todayKey;
      }),
    [sessions, todayKey],
  );

  const thisWeekSessions = useMemo(() => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
    );
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dow);
    weekStart.setHours(0, 0, 0, 0);
    return sessions.filter((s) => {
      const ms = fromNsToMs(s.timestamp);
      const lt = new Date(
        new Date(ms).toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
      );
      return lt >= weekStart;
    });
  }, [sessions]);

  const thisMonthSessions = useMemo(
    () =>
      sessions.filter(
        (s) => getLTMonthKey(fromNsToMs(s.timestamp)) === thisMonthKey,
      ),
    [sessions, thisMonthKey],
  );

  if (!childId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Pasirinkite vaiką, kad matytumėte maitinimo sesijas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Maitinimas</h2>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (o) {
              setMlAmount("");
              setSelectedType("misinukas");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Pridėti
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nauja maitinimo sesija</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Type selector */}
              <div>
                <Label className="mb-2 block text-sm font-medium">Tipas</Label>
                <div className="flex gap-2">
                  {(["misinukas", "mamosPienas"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selectedType === type
                          ? "border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-400 dark:bg-pink-950/30 dark:text-pink-300"
                          : "border-border bg-card text-muted-foreground hover:border-pink-300"
                      }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ML amount */}
              <div>
                <Label
                  htmlFor="feed-ml"
                  className="mb-1 block text-sm font-medium"
                >
                  Kiekis (ml)
                </Label>
                <Input
                  id="feed-ml"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="pvz. 120"
                  value={mlAmount}
                  onChange={(e) => setMlAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Laikas bus automatiškai užfiksuotas kaip dabar.
              </p>

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Šiandien</p>
            <p className="text-2xl font-bold">{todaySessions.length}</p>
            <p className="text-xs text-muted-foreground">
              {todaySessions.reduce((s, x) => s + x.mlAmount, 0).toFixed(0)} ml
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ši savaitė</p>
            <p className="text-2xl font-bold">{thisWeekSessions.length}</p>
            <p className="text-xs text-muted-foreground">
              {thisWeekSessions.reduce((s, x) => s + x.mlAmount, 0).toFixed(0)}{" "}
              ml
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Šis mėnuo</p>
            <p className="text-2xl font-bold">{thisMonthSessions.length}</p>
            <p className="text-xs text-muted-foreground">
              {thisMonthSessions.reduce((s, x) => s + x.mlAmount, 0).toFixed(0)}{" "}
              ml
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Istorija</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Dar nėra įrašų.</p>
          ) : (
            sorted.slice(0, 20).map((s) => {
              const ms = fromNsToMs(s.timestamp);
              const typeKey =
                typeof s.feedingType === "object"
                  ? "misinukas" in s.feedingType
                    ? "misinukas"
                    : "mamosPienas"
                  : s.feedingType;
              return (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {s.mlAmount.toFixed(0)} ml &bull;{" "}
                      {TYPE_LABELS[typeKey] ?? typeKey}
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
    </div>
  );
}
