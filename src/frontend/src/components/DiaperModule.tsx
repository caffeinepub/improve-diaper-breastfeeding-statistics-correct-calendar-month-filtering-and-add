import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetDiaperLogsForChild,
  useLogDiaperChange,
} from "../hooks/useQueries";
import DiaperStatistics from "./DiaperStatistics";

interface DiaperModuleProps {
  childId: string | null;
}

export default function DiaperModule({ childId }: DiaperModuleProps) {
  const [kakis, setKakis] = useState(false);
  const [sysius, setSysius] = useState(false);
  const [tuscia, setTuscia] = useState(false);
  const { isFetching } = useGetDiaperLogsForChild(childId);
  const logDiaper = useLogDiaperChange();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!childId) {
      toast.error("Pasirinkite vaiką");
      return;
    }

    if (!kakis && !sysius && !tuscia) {
      toast.error("Pasirinkite bent vieną variantą");
      return;
    }

    try {
      await logDiaper.mutateAsync({ childId, kakis, sysius, tuscia });
      toast.success("Sauskelė užregistruota!");
      setKakis(false);
      setSysius(false);
      setTuscia(false);
    } catch (error) {
      toast.error("Nepavyko užregistruoti sauskelės");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src="/assets/generated/diaper-icon-transparent.dim_100x100.png"
              alt="Sauskelė"
              className="h-8 w-8 flex-shrink-0"
            />
            <span className="truncate">Pampersai</span>
            {isFetching && (
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Sinchronizuojama
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-3 grid-cols-1 xs:grid-cols-3">
              <button
                type="button"
                onClick={() => setKakis(!kakis)}
                className={`rounded-xl border-2 px-3 py-4 text-center font-medium transition-all hover:scale-105 ${
                  kakis
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                Kakis
              </button>
              <button
                type="button"
                onClick={() => setSysius(!sysius)}
                className={`rounded-xl border-2 px-3 py-4 text-center font-medium transition-all hover:scale-105 ${
                  sysius
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                Sysius
              </button>
              <button
                type="button"
                onClick={() => setTuscia(!tuscia)}
                className={`rounded-xl border-2 px-3 py-4 text-center font-medium transition-all hover:scale-105 ${
                  tuscia
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                Tuščia
              </button>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={logDiaper.isPending}
            >
              {logDiaper.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registruojama...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Užregistruoti keitimą
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DiaperStatistics childId={childId} />
    </div>
  );
}
