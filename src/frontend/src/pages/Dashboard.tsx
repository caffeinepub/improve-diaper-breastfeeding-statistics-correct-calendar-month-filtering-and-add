import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Check, Copy, Info, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import ActivityTimeline from "../components/ActivityTimeline";
import AddChildButton from "../components/AddChildButton";
import BreastfeedingModule from "../components/BreastfeedingModule";
import ChildProfile from "../components/ChildProfile";
import ChildSelector from "../components/ChildSelector";
import DiaperModule from "../components/DiaperModule";
import FeedingModule from "../components/FeedingModule";
import JournalModule from "../components/JournalModule";
import MobileMenu from "../components/MobileMenu";
import ModuleNavigation from "../components/ModuleNavigation";
import PumpingModule from "../components/PumpingModule";
import TummyTimeModule from "../components/TummyTimeModule";
import WeightModule from "../components/WeightModule";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAcceptChildInvite,
  useGetAllChildrenForUser,
} from "../hooks/useQueries";

type ActiveModule =
  | "overview"
  | "diapers"
  | "breastfeeding"
  | "tummytime"
  | "weight"
  | "journal"
  | "pumping"
  | "feeding";

export default function Dashboard() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: children = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetAllChildrenForUser();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ActiveModule>("overview");
  const [processingInvite, setProcessingInvite] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const acceptInvite = useAcceptChildInvite();

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString() || "";

  // Force refetch children when identity becomes available
  useEffect(() => {
    if (isAuthenticated && !isInitializing && !isFetching) {
      console.log("Identity available, refetching children...");
      refetch();
    }
  }, [isAuthenticated, isInitializing, refetch, isFetching]);

  // Handle invite code from URL
  useEffect(() => {
    if (!isAuthenticated || processingInvite || isInitializing) return;

    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get("invite");

    if (inviteCode) {
      setProcessingInvite(true);

      acceptInvite.mutate(inviteCode, {
        onSuccess: async () => {
          toast.success("Kvietimas priimtas sėkmingai!");
          await refetch();
          window.history.replaceState({}, "", window.location.pathname);
          setProcessingInvite(false);
        },
        onError: (error: any) => {
          const errorMsg =
            error.message || "Nepavyko priimti kvietimo. Bandykite dar kartą.";
          toast.error(errorMsg);
          window.history.replaceState({}, "", window.location.pathname);
          setProcessingInvite(false);
        },
      });
    }
  }, [
    isAuthenticated,
    acceptInvite,
    refetch,
    processingInvite,
    isInitializing,
  ]);

  // Auto-select first child when children load
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      console.log("Auto-selecting first child:", children[0].name);
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopiedPrincipal(true);
      toast.success("ID nukopijuotas į iškarpinę!");
      setTimeout(() => setCopiedPrincipal(false), 2000);
    } catch (_error) {
      toast.error("Nepavyko nukopijuoti ID");
    }
  };

  const handleModuleChange = (module: ActiveModule) => {
    setActiveModule(module);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickAccessNavigation = (module: "diapers" | "breastfeeding") => {
    setActiveModule(module);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-full overflow-hidden px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src="/assets/generated/dashboard-hero.dim_800x400.png"
            alt="Frėjos žurnalas"
            className="mx-auto mb-8 w-full max-w-full rounded-2xl shadow-lg"
          />
          <h2 className="mb-4 text-2xl sm:text-3xl font-bold">
            Sveiki atvykę į Frėjos žurnalą
          </h2>
          <p className="mb-8 text-base sm:text-lg text-muted-foreground">
            Sekite savo mažylio kasdienę veiklą, augimą ir svarbius momentus
            vienoje vietoje.
          </p>
          <Alert className="text-left">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Prisijunkite, kad galėtumėte pridėti vaikus ir pradėti sekti jų
              pažangą.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading || processingInvite || isInitializing) {
    return (
      <div className="w-full max-w-full overflow-hidden px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mb-4 inline-block h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {processingInvite
                ? "Priimamas kvietimas..."
                : "Kraunami duomenys..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="w-full max-w-full overflow-hidden px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src="/assets/generated/default-baby-photo.dim_150x150.png"
            alt="Pridėti vaiką"
            className="mx-auto mb-8 h-32 w-32 rounded-full"
          />
          <h2 className="mb-4 text-xl sm:text-2xl font-bold">
            Dar neturite pridėtų vaikų
          </h2>
          <p className="mb-8 text-sm sm:text-base text-muted-foreground">
            Pradėkite pridėdami savo pirmąjį vaiką ir sekite jo kasdienę veiklą.
          </p>

          <div className="mb-8 flex flex-col items-center gap-4">
            <AddChildButton />

            <div className="w-full max-w-md rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Jūsų Internet Identity ID:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-muted px-3 py-2 text-xs sm:text-sm font-mono">
                  {principalId}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPrincipal}
                  className="flex-shrink-0"
                  title="Kopijuoti ID"
                >
                  {copiedPrincipal ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Naudokite šį ID, kad kiti galėtų su jumis dalintis prieiga prie
                savo vaikų profilių.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <MobileMenu
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
            />
            <div className="flex-1 min-w-0">
              <ChildSelector
                childProfiles={children}
                selectedChildId={selectedChildId}
                onSelectChild={setSelectedChildId}
              />
            </div>
          </div>
          <div className="hidden lg:block flex-shrink-0">
            <AddChildButton />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6 min-w-0 overflow-hidden">
            {activeModule === "overview" && (
              <>
                <ActivityTimeline childId={selectedChildId} />
                <ChildProfile
                  childId={selectedChildId}
                  onModuleChange={handleQuickAccessNavigation}
                />
              </>
            )}
            {activeModule === "diapers" && (
              <DiaperModule childId={selectedChildId} />
            )}
            {activeModule === "breastfeeding" && (
              <BreastfeedingModule childId={selectedChildId} />
            )}
            {activeModule === "tummytime" && (
              <TummyTimeModule childId={selectedChildId} />
            )}
            {activeModule === "weight" && (
              <WeightModule childId={selectedChildId} />
            )}
            {activeModule === "journal" && (
              <JournalModule childId={selectedChildId} />
            )}
            {activeModule === "pumping" && (
              <PumpingModule childId={selectedChildId} />
            )}
            {activeModule === "feeding" && (
              <FeedingModule childId={selectedChildId} />
            )}
          </div>

          <div className="hidden lg:block lg:sticky lg:top-24 lg:h-fit flex-shrink-0">
            <ModuleNavigation
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
