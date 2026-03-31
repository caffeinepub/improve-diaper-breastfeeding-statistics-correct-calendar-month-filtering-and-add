import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Info, Link2, Loader2, UserPlus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useGenerateChildInviteLink, useGetChild } from "../hooks/useQueries";

interface SharedAccessSectionProps {
  childId: string;
}

export default function SharedAccessSection({
  childId,
}: SharedAccessSectionProps) {
  const { data: child } = useGetChild(childId);
  const generateInviteLink = useGenerateChildInviteLink();

  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const sharedUsers = child?.sharedWith || [];

  const handleGenerateInviteLink = async () => {
    try {
      const code = await generateInviteLink.mutateAsync(childId);
      const link = `${window.location.origin}?invite=${code}`;
      setInviteLink(link);
      setIsInviteLinkDialogOpen(true);
      toast.success("Kvietimo nuoroda sugeneruota sėkmingai");
    } catch (error: any) {
      const errorMsg = error.message || "Nežinoma klaida";
      toast.error(`Nepavyko sugeneruoti nuorodos: ${errorMsg}`);
      console.error(error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Nuoroda nukopijuota į iškarpinę");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Bendrinimas
        </CardTitle>
        <CardDescription>
          Valdykite, kas gali matyti ir redaguoti šio vaiko duomenis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleGenerateInviteLink}
            disabled={generateInviteLink.isPending}
          >
            {generateInviteLink.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Generuoti kvietimo nuorodą
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Bendrinami su ({sharedUsers.length})
          </p>
          {sharedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Dar nėra bendrinamų naudotojų
            </p>
          ) : (
            <div className="space-y-2">
              {sharedUsers.map((user) => (
                <div
                  key={user.toString()}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1 overflow-hidden">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs truncate max-w-full"
                    >
                      {user.toString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog
          open={isInviteLinkDialogOpen}
          onOpenChange={setIsInviteLinkDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kvietimo nuoroda</DialogTitle>
              <DialogDescription>
                Pasidalinkite šia nuoroda su naudotoju. Ji galioja vieną kartą
                ir bus automatiškai pašalinta po panaudojimo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <input
                  value={inviteLink}
                  readOnly
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Naudotojas turi būti prisijungęs, kad galėtų priimti kvietimą.
                  Po sėkmingo priėmimo, jis iš karto matys vaiką savo sąraše.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsInviteLinkDialogOpen(false)}>
                Uždaryti
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
