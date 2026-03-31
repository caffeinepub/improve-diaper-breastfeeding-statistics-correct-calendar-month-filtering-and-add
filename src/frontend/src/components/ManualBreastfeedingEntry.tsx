import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddManualBreastfeedingSession } from "../hooks/useQueries";

interface ManualBreastfeedingEntryProps {
  childId: string | null;
}

export default function ManualBreastfeedingEntry({
  childId,
}: ManualBreastfeedingEntryProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [side, setSide] = useState<"left" | "right" | null>(null);

  const addManualSession = useAddManualBreastfeedingSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!childId || !date || !time || !durationMinutes || !side) {
      toast.error("Užpildykite visus laukus");
      return;
    }

    const duration = Number.parseInt(durationMinutes);
    if (Number.isNaN(duration) || duration <= 0) {
      toast.error("Įveskite teisingą trukmę minutėmis");
      return;
    }

    try {
      // Combine date and time
      const dateTimeString = `${date}T${time}`;
      const dateTime = new Date(dateTimeString);

      if (Number.isNaN(dateTime.getTime())) {
        toast.error("Netinkama data arba laikas");
        return;
      }

      const dateNs = BigInt(dateTime.getTime()) * BigInt(1_000_000);
      const durationNs = BigInt(duration * 60) * BigInt(1_000_000_000);

      await addManualSession.mutateAsync({
        childId,
        date: dateNs,
        duration: durationNs,
        side,
      });

      toast.success("Žindymo sesija pridėta!");

      // Reset form
      setDate("");
      setTime("");
      setDurationMinutes("");
      setSide(null);
      setOpen(false);
    } catch (error) {
      console.error("Error adding manual session:", error);
      toast.error("Nepavyko pridėti sesijos");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Pridėti rankinį įrašą">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pridėti rankinį žindymo įrašą</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Laikas</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Trukmė (minutėmis)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="Pvz., 15"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Pusė</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSide("left")}
                className={`rounded-xl border-2 px-4 py-3 text-center font-medium transition-all hover:scale-105 ${
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
                className={`rounded-xl border-2 px-4 py-3 text-center font-medium transition-all hover:scale-105 ${
                  side === "right"
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                Dešinė
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={addManualSession.isPending}
              className="flex-1"
            >
              {addManualSession.isPending ? "Saugoma..." : "Išsaugoti"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Atšaukti
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
