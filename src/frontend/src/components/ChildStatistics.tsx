import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Baby, Milk } from "lucide-react";
import React from "react";
import { useGetChildStatistics } from "../hooks/useQueries";

interface ChildStatisticsProps {
  childId: string | null;
}

export default function ChildStatistics({ childId }: ChildStatisticsProps) {
  const { data: stats } = useGetChildStatistics(childId);

  const formatTummyTimeDuration = (ns: bigint) => {
    const totalSeconds = Number(ns / BigInt(1_000_000_000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Iš viso sauskelių
          </CardTitle>
          <Baby className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Number(stats.totalDiapers)}</div>
          <p className="text-xs text-muted-foreground">
            Pakeistų sauskelių skaičius
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Žindymo seansų</CardTitle>
          <Milk className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Number(stats.totalBreastfeedingSessions)}
          </div>
          <p className="text-xs text-muted-foreground">
            Iš viso žindymo seansų
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pilvo laikas</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatTummyTimeDuration(stats.totalTummyTime)}
          </div>
          <p className="text-xs text-muted-foreground">
            Iš viso pilvo laiko trukmė
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
