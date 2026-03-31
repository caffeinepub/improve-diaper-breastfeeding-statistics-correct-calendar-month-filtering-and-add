import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BreastfeedingSession,
  ChildProfileView,
  DiaperLog,
  JournalNote,
  MilkPumpingSession,
  NoteColor,
  TummyTimeSession,
  UserProfile,
  WeightEntry,
} from "../backend";
import { type ExternalBlob, Variant_left_right } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Child Management Queries
export function useGetAllChildrenForUser() {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();

  return useQuery<ChildProfileView[]>({
    queryKey: ["children", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) {
        console.log("Child query: actor or identity not ready");
        return [];
      }

      try {
        const principal = identity.getPrincipal();
        console.log("Fetching children for principal:", principal.toString());

        const ownedChildren = await actor.getChildrenByParent(principal);
        console.log("Owned children:", ownedChildren.length);

        const sharedChildren = await actor.getSharedChildren();
        console.log("Shared children:", sharedChildren.length);

        const allAccessibleChildren = [...ownedChildren, ...sharedChildren];
        console.log("Total accessible children:", allAccessibleChildren.length);

        return allAccessibleChildren;
      } catch (error) {
        console.error("Error fetching children:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!identity && !isInitializing,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useGetChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ChildProfileView | null>({
    queryKey: ["child", childId],
    queryFn: async () => {
      if (!actor || !childId) return null;
      try {
        return await actor.getChild(childId);
      } catch (error) {
        console.error("Error fetching child:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 30000,
  });
}

export function useAddChild() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      birthDate,
      photo,
      isPublic,
    }: {
      name: string;
      birthDate: bigint;
      photo: ExternalBlob | null;
      isPublic: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addChild(name, birthDate, photo, isPublic);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useToggleChildVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.toggleChildVisibility(childId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["child"] });
    },
  });
}

// Shared Access Queries
export function useGenerateChildInviteLink() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateChildInviteLink(childId);
    },
  });
}

export function useAcceptChildInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!actor) throw new Error("Aktorius nepasiekiamas");
      if (!identity)
        throw new Error("Turite būti prisijungę, kad priimtumėte kvietimą");

      return actor.acceptChildInvite(inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["child"] });
    },
  });
}

// Diaper Tracking Queries
export function useGetDiaperLogsForChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DiaperLog[]>({
    queryKey: ["diaperLogs", childId],
    queryFn: async () => {
      if (!actor || !childId) return [];
      try {
        return await actor.getDiaperLogsForChild(childId);
      } catch (error) {
        console.error("Error fetching diaper logs:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 10000,
  });
}

export function useLogDiaperChange() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      kakis,
      sysius,
      tuscia,
    }: {
      childId: string;
      kakis: boolean;
      sysius: boolean;
      tuscia: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logDiaperChange(childId, kakis, sysius, tuscia);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["diaperLogs", variables.childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["childStatistics", variables.childId],
      });
    },
  });
}

// Breastfeeding Queries
export function useGetBreastfeedingSessionsForChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<BreastfeedingSession[]>({
    queryKey: ["breastfeedingSessions", childId],
    queryFn: async () => {
      if (!actor || !childId) return [];
      try {
        return await actor.getBreastfeedingSessionsForChild(childId);
      } catch (error) {
        console.error("Error fetching breastfeeding sessions:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 10000,
  });
}

export function useStartBreastfeedingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      side,
    }: {
      childId: string;
      side: "left" | "right";
    }) => {
      if (!actor) throw new Error("Actor not available");
      const breastSide: Variant_left_right =
        side === "left" ? Variant_left_right.left : Variant_left_right.right;
      return actor.startBreastfeedingSession(childId, breastSide);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["activeBreastfeedingTimer", variables.childId],
      });
    },
  });
}

export function usePauseBreastfeedingTimer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.pauseBreastfeedingTimer(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["activeBreastfeedingTimer", childId],
      });
    },
  });
}

export function useResumeBreastfeedingTimer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.resumeBreastfeedingTimer(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["activeBreastfeedingTimer", childId],
      });
    },
  });
}

export function useCompleteBreastfeedingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.completeBreastfeedingSession(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["breastfeedingSessions", childId],
      });
      queryClient.invalidateQueries({ queryKey: ["childStatistics", childId] });
      queryClient.invalidateQueries({
        queryKey: ["activeBreastfeedingTimer", childId],
      });
    },
  });
}

export function useGetActiveBreastfeedingTimer(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["activeBreastfeedingTimer", childId],
    queryFn: async () => {
      if (!actor || !childId) return null;
      try {
        return await actor.getActiveBreastfeedingTimer(childId);
      } catch (error) {
        console.error("Error fetching active timer:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 1000,
  });
}

export function useAddManualBreastfeedingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      date,
      duration,
      side,
    }: {
      childId: string;
      date: bigint;
      duration: bigint;
      side: "left" | "right";
    }) => {
      if (!actor) throw new Error("Actor not available");
      const breastSide: Variant_left_right =
        side === "left" ? Variant_left_right.left : Variant_left_right.right;
      return actor.addManualBreastfeedingSession(
        childId,
        date,
        duration,
        breastSide,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["breastfeedingSessions", variables.childId],
      });
      queryClient.invalidateQueries({
        queryKey: ["childStatistics", variables.childId],
      });
    },
  });
}

// Tummy Time Queries
export function useGetTummyTimeSessionsForChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TummyTimeSession[]>({
    queryKey: ["tummyTimeSessions", childId],
    queryFn: async () => {
      if (!actor || !childId) return [];
      try {
        return await actor.getTummyTimeSessionsForChild(childId);
      } catch (error) {
        console.error("Error fetching tummy time sessions:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 10000,
  });
}

export function useStartTummyTimeSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.startTummyTimeSession(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["activeTummyTimeTimer", childId],
      });
    },
  });
}

export function usePauseTummyTimeTimer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.pauseTummyTimeTimer(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["activeTummyTimeTimer", childId],
      });
    },
  });
}

export function useResumeTummyTimeTimer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.resumeTummyTimeTimer(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["activeTummyTimeTimer", childId],
      });
    },
  });
}

export function useCompleteTummyTimeSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.completeTummyTimeSession(childId);
    },
    onSuccess: (_, childId) => {
      queryClient.invalidateQueries({
        queryKey: ["tummyTimeSessions", childId],
      });
      queryClient.invalidateQueries({ queryKey: ["childStatistics", childId] });
      queryClient.invalidateQueries({
        queryKey: ["activeTummyTimeTimer", childId],
      });
    },
  });
}

export function useGetActiveTummyTimeTimer(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["activeTummyTimeTimer", childId],
    queryFn: async () => {
      if (!actor || !childId) return null;
      try {
        return await actor.getActiveTummyTimeTimer(childId);
      } catch (error) {
        console.error("Error fetching active tummy time timer:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 1000,
  });
}

// Weight Tracking Queries
export function useGetWeightEntriesForChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<WeightEntry[]>({
    queryKey: ["weightEntries", childId],
    queryFn: async () => {
      if (!actor || !childId) return [];
      try {
        return await actor.getWeightEntriesForChild(childId);
      } catch (error) {
        console.error("Error fetching weight entries:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 10000,
  });
}

export function useAddWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      weight,
      timestamp,
    }: {
      childId: string;
      weight: number;
      timestamp: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addWeightEntry(childId, weight, timestamp);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["weightEntries", variables.childId],
      });
    },
  });
}

export function useUpdateWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      weightId,
      newWeight,
      newTimestamp,
    }: {
      childId: string;
      weightId: string;
      newWeight: number;
      newTimestamp: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWeightEntry(
        childId,
        weightId,
        newWeight,
        newTimestamp,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["weightEntries", variables.childId],
      });
    },
  });
}

export function useDeleteWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      weightId,
    }: {
      childId: string;
      weightId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteWeightEntry(childId, weightId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["weightEntries", variables.childId],
      });
    },
  });
}

// Journal Notes Queries
export function useGetJournalNotesForChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<JournalNote[]>({
    queryKey: ["journalNotes", childId],
    queryFn: async () => {
      if (!actor || !childId) return [];
      try {
        return await actor.getJournalNotesForChild(childId);
      } catch (error) {
        console.error("Error fetching journal notes:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 10000,
  });
}

export function useAddJournalNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      text,
      color,
    }: {
      childId: string;
      text: string;
      color: NoteColor;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addJournalNote(childId, text, color);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["journalNotes", variables.childId],
      });
    },
  });
}

export function useDeleteJournalNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      noteId,
    }: {
      childId: string;
      noteId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteJournalNote(childId, noteId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["journalNotes", variables.childId],
      });
    },
  });
}

// Statistics
export function useGetChildStatistics(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<{
    totalDiapers: bigint;
    totalBreastfeedingSessions: bigint;
    totalTummyTime: bigint;
  } | null>({
    queryKey: ["childStatistics", childId],
    queryFn: async () => {
      if (!actor || !childId) return null;
      try {
        return await actor.getChildStatistics(childId);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 30000,
  });
}

// Milk Pumping
export function useGetMilkPumpingSessionsForChild(childId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["milkPumpingSessions", childId],
    queryFn: async () => {
      if (!actor || !childId) return [];
      try {
        return await actor.getMilkPumpingSessionsForChild(childId);
      } catch (error) {
        console.error("Error fetching milk pumping sessions:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!childId,
    refetchInterval: 10000,
  });
}

export function useAddMilkPumpingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      timestamp,
      mlAmount,
      side,
    }: {
      childId: string;
      timestamp: bigint;
      mlAmount: number;
      side: "left" | "right" | "both";
    }) => {
      if (!actor) throw new Error("Actor not available");
      const sideVariant =
        side === "left"
          ? { left: null }
          : side === "right"
            ? { right: null }
            : { both: null };
      return actor.addMilkPumpingSession(
        childId,
        timestamp,
        mlAmount,
        sideVariant,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["milkPumpingSessions", variables.childId],
      });
    },
  });
}

export function useDeleteMilkPumpingSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      sessionId,
    }: { childId: string; sessionId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMilkPumpingSession(childId, sessionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["milkPumpingSessions", variables.childId],
      });
    },
  });
}
