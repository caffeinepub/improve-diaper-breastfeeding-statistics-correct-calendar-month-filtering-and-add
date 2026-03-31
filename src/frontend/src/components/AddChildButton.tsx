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
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useAddChild } from "../hooks/useQueries";

export default function AddChildButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const addChild = useAddChild();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !birthDate) {
      toast.error("Prašome užpildyti visus laukus");
      return;
    }

    try {
      const birthTimestamp = BigInt(new Date(birthDate).getTime() * 1_000_000);
      let photo: ExternalBlob | null = null;

      if (photoFile) {
        const arrayBuffer = await photoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        photo = ExternalBlob.fromBytes(uint8Array);
      }

      await addChild.mutateAsync({
        name: name.trim(),
        birthDate: birthTimestamp,
        photo,
        isPublic,
      });

      toast.success("Vaikas sėkmingai pridėtas!");
      setOpen(false);
      setName("");
      setBirthDate("");
      setIsPublic(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      toast.error("Nepavyko pridėti vaiko");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Pridėti vaiką
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pridėti naują vaiką</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vardas</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pvz., Jonukas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Gimimo data</Label>
            <Input
              id="birthDate"
              type="datetime-local"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Nuotrauka (neprivaloma)</Label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <label htmlFor="photo" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Pasirinkti nuotrauką
                </label>
              </Button>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Viešas profilis</Label>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={addChild.isPending}
          >
            {addChild.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pridedama...
              </>
            ) : (
              "Pridėti"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
