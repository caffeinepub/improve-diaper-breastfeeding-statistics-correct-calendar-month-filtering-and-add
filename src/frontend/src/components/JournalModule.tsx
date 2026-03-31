import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { NoteColor } from "../backend";
import {
  useAddJournalNote,
  useDeleteJournalNote,
  useGetJournalNotesForChild,
} from "../hooks/useQueries";

interface JournalModuleProps {
  childId: string | null;
}

const colorOptions: {
  value: NoteColor;
  label: string;
  bg: string;
  border: string;
}[] = [
  {
    value: NoteColor.yellow,
    label: "Geltona",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  {
    value: NoteColor.pink,
    label: "Rožinė",
    bg: "bg-pink-100 dark:bg-pink-900/30",
    border: "border-pink-300 dark:border-pink-700",
  },
  {
    value: NoteColor.blue,
    label: "Mėlyna",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-300 dark:border-blue-700",
  },
  {
    value: NoteColor.green,
    label: "Žalia",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-700",
  },
  {
    value: NoteColor.purple,
    label: "Violetinė",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-300 dark:border-purple-700",
  },
];

export default function JournalModule({ childId }: JournalModuleProps) {
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>(
    NoteColor.yellow,
  );

  const { data: notes = [] } = useGetJournalNotesForChild(childId);
  const addNote = useAddJournalNote();
  const deleteNote = useDeleteJournalNote();

  const handleAddNote = async () => {
    if (!childId || !noteText.trim()) {
      toast.error("Įveskite užrašo tekstą");
      return;
    }

    try {
      await addNote.mutateAsync({
        childId,
        text: noteText.trim(),
        color: selectedColor,
      });

      toast.success("Užrašas pridėtas!");
      setNoteText("");
      setSelectedColor(NoteColor.yellow);
      setShowForm(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Nepavyko pridėti užrašo");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!childId) return;

    try {
      await deleteNote.mutateAsync({ childId, noteId });
      toast.success("Užrašas ištrintas");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Nepavyko ištrinti užrašo");
    }
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

  const getColorClasses = (color: NoteColor) => {
    const colorOption = colorOptions.find((c) => c.value === color);
    return colorOption || colorOptions[0];
  };

  const sortedNotes = [...notes].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <Card className="w-full max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/sticky-note-icon-transparent.dim_100x100.png"
                alt="Žurnalas"
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="truncate">Žurnalas</span>
            </div>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                size="icon"
                className="flex-shrink-0"
                title="Pridėti užrašą"
              >
                <Plus className="h-5 w-5" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForm && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
              <div>
                <label
                  htmlFor="journal-note-text"
                  className="mb-2 block text-sm font-medium"
                >
                  Užrašo tekstas
                </label>
                <Textarea
                  id="journal-note-text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Įveskite savo užrašą..."
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {noteText.length}/500
                </p>
              </div>

              <div>
                <p className="mb-2 block text-sm font-medium">
                  Pasirinkite spalvą
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`flex-1 min-w-[80px] rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all hover:scale-105 ${
                        color.bg
                      } ${color.border} ${
                        selectedColor === color.value
                          ? "ring-2 ring-primary ring-offset-2 shadow-md"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNote.isPending}
                  className="flex-1"
                >
                  {addNote.isPending ? "Saugoma..." : "Išsaugoti"}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setNoteText("");
                    setSelectedColor(NoteColor.yellow);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Atšaukti
                </Button>
              </div>
            </div>
          )}

          {sortedNotes.length === 0 && !showForm && (
            <div className="text-center py-12">
              <img
                src="/assets/generated/sticky-note-icon-transparent.dim_100x100.png"
                alt="Nėra užrašų"
                className="h-16 w-16 mx-auto mb-4 opacity-50"
              />
              <p className="text-muted-foreground">Dar nėra užrašų</p>
              <p className="text-sm text-muted-foreground mt-1">
                Paspauskite "+" mygtuką, kad pridėtumėte pirmąjį užrašą
              </p>
            </div>
          )}

          {sortedNotes.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedNotes.map((note) => {
                const colorClasses = getColorClasses(note.color);
                return (
                  <div
                    key={note.createdAt.toString()}
                    className={`relative rounded-lg border-2 p-4 shadow-md transition-all hover:shadow-lg ${
                      colorClasses.bg
                    } ${colorClasses.border}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteNote(note.createdAt.toString())
                      }
                      className="absolute top-2 right-2 rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      title="Ištrinti užrašą"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="pr-6">
                      <p className="text-sm whitespace-pre-wrap break-words mb-3 min-h-[60px]">
                        {note.text}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
