import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import type { ChildProfileView } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ChildSelectorProps {
  childProfiles: ChildProfileView[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
}

export default function ChildSelector({
  childProfiles,
  selectedChildId,
  onSelectChild,
}: ChildSelectorProps) {
  const { identity } = useInternetIdentity();

  const isParent = (child: ChildProfileView) => {
    return (
      identity && child.parent.toString() === identity.getPrincipal().toString()
    );
  };

  return (
    <Select value={selectedChildId || undefined} onValueChange={onSelectChild}>
      <SelectTrigger className="w-full sm:w-[280px]">
        <SelectValue placeholder="Pasirinkite vaiką" />
      </SelectTrigger>
      <SelectContent>
        {childProfiles.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            <div className="flex items-center gap-2">
              <span>{child.name}</span>
              {!isParent(child) && (
                <Badge variant="secondary" className="text-xs">
                  Bendrinamas
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
