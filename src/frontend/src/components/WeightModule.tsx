import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Edit2,
  Minus,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { WeightEntry } from "../backend";
import {
  useAddWeightEntry,
  useDeleteWeightEntry,
  useGetWeightEntriesForChild,
  useUpdateWeightEntry,
} from "../hooks/useQueries";

interface WeightModuleProps {
  childId: string | null;
}

export default function WeightModule({ childId }: WeightModuleProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<WeightEntry | null>(null);

  const { data: weightEntries = [] } = useGetWeightEntriesForChild(childId);
  const addWeightEntry = useAddWeightEntry();
  const updateWeightEntry = useUpdateWeightEntry();
  const deleteWeightEntry = useDeleteWeightEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!childId) {
      toast.error("Pasirinkite vaiką");
      return;
    }

    const weightValue = Number.parseFloat(weight);
    if (Number.isNaN(weightValue) || weightValue <= 0) {
      toast.error("Įveskite teisingą svorio reikšmę");
      return;
    }

    try {
      const selectedDate = new Date(date);
      selectedDate.setHours(12, 0, 0, 0);
      const timestamp = BigInt(selectedDate.getTime()) * BigInt(1_000_000);

      await addWeightEntry.mutateAsync({
        childId,
        weight: weightValue,
        timestamp,
      });

      toast.success("Svorio įrašas pridėtas!");
      setIsAddDialogOpen(false);
      setWeight("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Error adding weight entry:", error);
      toast.error("Nepavyko pridėti svorio įrašo");
    }
  };

  const handleEditClick = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setWeight(entry.weight.toString());
    const entryDate = new Date(Number(entry.timestamp / BigInt(1_000_000)));
    setDate(entryDate.toISOString().split("T")[0]);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!childId || !editingEntry) {
      toast.error("Klaida redaguojant įrašą");
      return;
    }

    const weightValue = Number.parseFloat(weight);
    if (Number.isNaN(weightValue) || weightValue <= 0) {
      toast.error("Įveskite teisingą svorio reikšmę");
      return;
    }

    try {
      const selectedDate = new Date(date);
      selectedDate.setHours(12, 0, 0, 0);
      const timestamp = BigInt(selectedDate.getTime()) * BigInt(1_000_000);

      await updateWeightEntry.mutateAsync({
        childId,
        weightId: editingEntry.weightId,
        newWeight: weightValue,
        newTimestamp: timestamp,
      });

      toast.success("Svorio įrašas atnaujintas!");
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      setWeight("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Error updating weight entry:", error);
      toast.error("Nepavyko atnaujinti svorio įrašo");
    }
  };

  const handleDeleteClick = (entry: WeightEntry) => {
    setDeletingEntry(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!childId || !deletingEntry) {
      toast.error("Klaida trinant įrašą");
      return;
    }

    try {
      await deleteWeightEntry.mutateAsync({
        childId,
        weightId: deletingEntry.weightId,
      });

      toast.success("Svorio įrašas ištrintas!");
      setIsDeleteDialogOpen(false);
      setDeletingEntry(null);
    } catch (error) {
      console.error("Error deleting weight entry:", error);
      toast.error("Nepavyko ištrinti svorio įrašo");
    }
  };

  // Sort entries by date
  const sortedEntries = [...weightEntries].sort((a, b) =>
    Number(a.timestamp - b.timestamp),
  );

  // Prepare chart data
  const chartData = sortedEntries.map((entry) => ({
    date: new Date(
      Number(entry.timestamp / BigInt(1_000_000)),
    ).toLocaleDateString("lt-LT", {
      month: "short",
      day: "numeric",
    }),
    weight: entry.weight,
    fullDate: new Date(
      Number(entry.timestamp / BigInt(1_000_000)),
    ).toLocaleDateString("lt-LT"),
  }));

  // Calculate statistics
  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const previousEntry = sortedEntries[sortedEntries.length - 2];
  const weightChange =
    latestEntry && previousEntry
      ? latestEntry.weight - previousEntry.weight
      : 0;

  if (!childId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Pasirinkite vaiką, kad pradėtumėte sekti svorį
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950">
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/weight-icon-transparent.dim_100x100.png"
                alt="Svoris"
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="truncate">Svoris</span>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Pridėti
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pridėti svorio įrašą</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Svoris (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="pvz., 4.5"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Atšaukti
                    </Button>
                    <Button type="submit" disabled={addWeightEntry.isPending}>
                      {addWeightEntry.isPending ? "Saugoma..." : "Išsaugoti"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Dar nėra svorio įrašų</p>
              <p className="text-sm mt-2">
                Pradėkite pridėdami pirmąjį matavimą
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 border border-blue-200/50 dark:border-blue-800/50">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Dabartinis svoris
                  </h3>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {latestEntry?.weight.toFixed(2)} kg
                  </p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 border border-blue-200/50 dark:border-blue-800/50">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Pokytis
                  </h3>
                  <div className="flex items-center gap-2">
                    {weightChange > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : weightChange < 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                    <p
                      className={`text-2xl font-bold ${
                        weightChange > 0
                          ? "text-green-700 dark:text-green-400"
                          : weightChange < 0
                            ? "text-red-700 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {weightChange > 0 ? "+" : ""}
                      {weightChange.toFixed(2)} kg
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 border border-blue-200/50 dark:border-blue-800/50">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Įrašų skaičius
                  </h3>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {sortedEntries.length}
                  </p>
                </div>
              </div>

              {/* Growth Chart */}
              {chartData.length > 1 && (
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-4">Augimo kreivė</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        domain={["dataMin - 0.5", "dataMax + 0.5"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [
                          `${value.toFixed(2)} kg`,
                          "Svoris",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Weight History */}
              <div className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Istorija</h3>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {[...sortedEntries].reverse().map((entry) => (
                    <div
                      key={entry.weightId}
                      className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {entry.weight.toFixed(2)} kg
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            Number(entry.timestamp / BigInt(1_000_000)),
                          ).toLocaleDateString("lt-LT", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(entry)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Redaguoti
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(entry)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Ištrinti
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redaguoti svorio įrašą</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-weight">Svoris (kg)</Label>
              <Input
                id="edit-weight"
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="pvz., 4.5"
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingEntry(null);
                  setWeight("");
                  setDate(new Date().toISOString().split("T")[0]);
                }}
              >
                Atšaukti
              </Button>
              <Button type="submit" disabled={updateWeightEntry.isPending}>
                {updateWeightEntry.isPending ? "Saugoma..." : "Išsaugoti"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ar tikrai norite ištrinti šį įrašą?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Šis veiksmas negrįžtamas. Svorio įrašas bus visam laikui
              ištrintas.
              {deletingEntry && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-medium">
                    {deletingEntry.weight.toFixed(2)} kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      Number(deletingEntry.timestamp / BigInt(1_000_000)),
                    ).toLocaleDateString("lt-LT", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingEntry(null)}>
              Atšaukti
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteWeightEntry.isPending}
            >
              {deleteWeightEntry.isPending ? "Trinama..." : "Ištrinti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
