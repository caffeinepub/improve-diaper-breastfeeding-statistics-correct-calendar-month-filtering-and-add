import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Activity,
  Baby,
  BookOpen,
  Droplets,
  HelpCircle,
  Home,
  Menu,
  Milk,
  Scale,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import AddChildButton from "./AddChildButton";

interface MobileMenuProps {
  activeModule:
    | "overview"
    | "diapers"
    | "breastfeeding"
    | "tummytime"
    | "weight"
    | "journal"
    | "pumping";
  onModuleChange: (
    module:
      | "overview"
      | "diapers"
      | "breastfeeding"
      | "tummytime"
      | "weight"
      | "journal"
      | "pumping",
  ) => void;
}

export default function MobileMenu({
  activeModule,
  onModuleChange,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString();

  const modules = [
    { id: "overview" as const, label: "Apžvalga", icon: Home },
    { id: "diapers" as const, label: "Pampersai", icon: Baby },
    { id: "breastfeeding" as const, label: "Žindymas", icon: Milk },
    { id: "tummytime" as const, label: "Pilvo Laikas", icon: Activity },
    { id: "weight" as const, label: "Svoris", icon: Scale },
    { id: "journal" as const, label: "Žurnalas", icon: BookOpen },
    { id: "pumping" as const, label: "Pieno nutraukimas", icon: Droplets },
  ];

  const handleModuleClick = (
    moduleId:
      | "overview"
      | "diapers"
      | "breastfeeding"
      | "tummytime"
      | "weight"
      | "journal"
      | "pumping",
  ) => {
    onModuleChange(moduleId);
    setOpen(false);
  };

  const handleCopyPrincipalId = async () => {
    if (!principalId) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(principalId);
        toast.success("Nukopijuota!", {
          description: "Principal ID nukopijuotas į iškarpinę",
          duration: 2000,
        });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = principalId;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          toast.success("Nukopijuota!", {
            description: "Principal ID nukopijuotas į iškarpinę",
            duration: 2000,
          });
        } catch (_err) {
          toast.error("Klaida", {
            description: "Nepavyko nukopijuoti. Bandykite dar kartą.",
            duration: 2000,
          });
        }

        textArea.remove();
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Klaida", {
        description: "Nepavyko nukopijuoti. Bandykite dar kartą.",
        duration: 2000,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Atidaryti meniu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Meniu</SheetTitle>
        </SheetHeader>

        {isAuthenticated && userProfile && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border border-pink-200/50 dark:border-pink-800/50">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Vardas
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {userProfile.name}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Principal ID
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                    onClick={handleCopyPrincipalId}
                    title="Kopijuoti Principal ID"
                  >
                    <HelpCircle className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <span className="sr-only">Kopijuoti Principal ID</span>
                  </Button>
                </div>
                <p className="text-[11px] font-mono break-all text-muted-foreground bg-background/50 px-2 py-1.5 rounded border border-border/50">
                  {principalId}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex-1 flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-2">
              Moduliai
            </p>
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Button
                  key={module.id}
                  variant={activeModule === module.id ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => handleModuleClick(module.id)}
                >
                  <Icon className="h-4 w-4" />
                  {module.label}
                </Button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t pl-6">
            <AddChildButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
