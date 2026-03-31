import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Baby,
  BookOpen,
  Droplets,
  Home,
  Milk,
  Scale,
} from "lucide-react";
import React from "react";

interface ModuleNavigationProps {
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

export default function ModuleNavigation({
  activeModule,
  onModuleChange,
}: ModuleNavigationProps) {
  const modules = [
    { id: "overview" as const, label: "Apžvalga", icon: Home },
    { id: "diapers" as const, label: "Pampersai", icon: Baby },
    { id: "breastfeeding" as const, label: "Žindymas", icon: Milk },
    { id: "tummytime" as const, label: "Pilvo Laikas", icon: Activity },
    { id: "weight" as const, label: "Svoris", icon: Scale },
    { id: "journal" as const, label: "Žurnalas", icon: BookOpen },
    { id: "pumping" as const, label: "Pieno nutraukimas", icon: Droplets },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Moduliai</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Button
              key={module.id}
              variant={activeModule === module.id ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => onModuleChange(module.id)}
            >
              <Icon className="h-4 w-4" />
              {module.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
