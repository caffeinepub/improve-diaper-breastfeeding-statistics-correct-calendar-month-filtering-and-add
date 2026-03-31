import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Globe, Loader2, Lock, Milk } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetChild, useToggleChildVisibility } from "../hooks/useQueries";
import AgeCounter from "./AgeCounter";
import ChildStatistics from "./ChildStatistics";
import SharedAccessSection from "./SharedAccessSection";

interface ChildProfileProps {
  childId: string | null;
  onModuleChange?: (module: "diapers" | "breastfeeding") => void;
}

export default function ChildProfile({
  childId,
  onModuleChange,
}: ChildProfileProps) {
  const { data: child, isLoading } = useGetChild(childId);
  const toggleVisibility = useToggleChildVisibility();
  const { identity } = useInternetIdentity();

  if (isLoading) {
    return (
      <Card className="w-full max-w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!child) {
    return (
      <Card className="w-full max-w-full">
        <CardContent className="py-12 text-center text-muted-foreground">
          Vaikas nerastas
        </CardContent>
      </Card>
    );
  }

  const isParent =
    identity && child.parent.toString() === identity.getPrincipal().toString();

  const handleToggleVisibility = async () => {
    try {
      await toggleVisibility.mutateAsync(child.id);
      toast.success(
        child.isPublic ? "Profilis dabar privatus" : "Profilis dabar viešas",
      );
    } catch (error) {
      toast.error("Nepavyko pakeisti matomumo");
      console.error(error);
    }
  };

  const handleQuickAccessClick = (module: "diapers" | "breastfeeding") => {
    if (onModuleChange) {
      onModuleChange(module);
      // Smooth scroll to top of page for better UX
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const photoUrl = child.photo
    ? child.photo.getDirectURL()
    : "/assets/generated/default-baby-photo.dim_150x150.png";

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <Card className="overflow-hidden w-full max-w-full">
        <CardHeader className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl sm:text-2xl truncate">
              {child.name}
            </CardTitle>
            <Badge
              variant={child.isPublic ? "default" : "secondary"}
              className="gap-1 flex-shrink-0"
            >
              {child.isPublic ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span className="hidden xs:inline">Viešas</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span className="hidden xs:inline">Privatus</span>
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            {/* Quick Access Buttons */}
            <div className="flex gap-3 w-full max-w-xs justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAccessClick("diapers")}
                className="flex-1 gap-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all"
              >
                <Baby className="h-4 w-4" />
                Pampersas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAccessClick("breastfeeding")}
                className="flex-1 gap-2 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800 hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30 transition-all"
              >
                <Milk className="h-4 w-4" />
                Žindymas
              </Button>
            </div>

            {/* Child Photo and Info */}
            <img
              src={photoUrl}
              alt={child.name}
              className="h-32 w-32 flex-shrink-0 rounded-full border-4 border-primary/20 object-cover shadow-lg"
            />
            <div className="flex-1 space-y-4 text-center min-w-0 w-full">
              <AgeCounter birthDate={child.birthDate} />
              {isParent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleVisibility}
                  disabled={toggleVisibility.isPending}
                  className="gap-2"
                >
                  {toggleVisibility.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : child.isPublic ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  <span className="hidden xs:inline">
                    {child.isPublic ? "Padaryti privatų" : "Padaryti viešą"}
                  </span>
                  <span className="xs:hidden">
                    {child.isPublic ? "Privatus" : "Viešas"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ChildStatistics childId={childId} />

      {isParent && <SharedAccessSection childId={child.id} />}
    </div>
  );
}
