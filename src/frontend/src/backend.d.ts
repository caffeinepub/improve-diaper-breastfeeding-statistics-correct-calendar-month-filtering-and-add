import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ChildProfileView {
    id: string;
    birthDate: bigint;
    name: string;
    sharedWith: Array<Principal>;
    isPublic: boolean;
    photo?: ExternalBlob;
    parent: Principal;
}
export type Time = bigint;
export interface TummyTimeSession {
    startTime: bigint;
    duration: bigint;
    childId: string;
}
export interface TummyTimeTimerState {
    startTime: bigint;
    pausedAt?: bigint;
    userId: Principal;
    isPaused: boolean;
    totalPausedDuration: bigint;
    childId: string;
}
export interface DiaperLog {
    contents: {
        tuscia: boolean;
        kakis: boolean;
        sysius: boolean;
    };
    childId: string;
    timestamp: bigint;
}
export interface BreastfeedingSession {
    startTime: bigint;
    duration: bigint;
    side: Variant_left_right;
    childId: string;
}
export interface JournalNote {
    createdAt: bigint;
    color: NoteColor;
    text: string;
    childId: string;
    updatedAt: bigint;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface ActiveTimerState {
    startTime: bigint;
    pausedAt?: bigint;
    userId: Principal;
    isPaused: boolean;
    side: Variant_left_right;
    totalPausedDuration: bigint;
    childId: string;
}
export interface WeightEntry {
    weight: number;
    childId: string;
    weightId: string;
    timestamp: bigint;
}
export enum PumpSide {
    left = "left",
    right = "right",
    both = "both"
}
export interface MilkPumpingSession {
    sessionId: string;
    childId: string;
    timestamp: bigint;
    mlAmount: number;
    side: PumpSide;
}
export interface FeedingSession {
    sessionId: string;
    childId: string;
    timestamp: bigint;
    mlAmount: number;
    feedingType: { misinukas: null } | { mamosPienas: null };
}
export interface UserProfile {
    name: string;
}
export enum NoteColor {
    blue = "blue",
    pink = "pink",
    purple = "purple",
    green = "green",
    yellow = "yellow"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_left_right {
    left = "left",
    right = "right"
}
export interface backendInterface {
    acceptChildInvite(inviteCode: string): Promise<void>;
    addChild(name: string, birthDate: bigint, photo: ExternalBlob | null, isPublic: boolean): Promise<string>;
    addJournalNote(childId: string, text: string, color: NoteColor): Promise<void>;
    addManualBreastfeedingSession(childId: string, date: bigint, duration: bigint, side: Variant_left_right): Promise<void>;
    addWeightEntry(childId: string, weight: number, timestamp: bigint): Promise<void>;
    addMilkPumpingSession(childId: string, timestamp: bigint, mlAmount: number, side: { left: null } | { right: null } | { both: null }): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateAgeInDays(childId: string): Promise<bigint>;
    completeBreastfeedingSession(childId: string): Promise<void>;
    completeTummyTimeSession(childId: string): Promise<void>;
    deleteJournalNote(childId: string, noteId: string): Promise<void>;
    deleteWeightEntry(childId: string, weightId: string): Promise<void>;
    deleteMilkPumpingSession(childId: string, sessionId: string): Promise<void>;
    generateChildInviteLink(childId: string): Promise<string>;
    generateInviteCode(): Promise<string>;
    getActiveBreastfeedingTimer(childId: string): Promise<ActiveTimerState | null>;
    getActiveTummyTimeTimer(childId: string): Promise<TummyTimeTimerState | null>;
    getAllPublicChildren(): Promise<Array<ChildProfileView>>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getBreastfeedingSessionsForChild(childId: string): Promise<Array<BreastfeedingSession>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChild(childId: string): Promise<ChildProfileView>;
    getChildStatistics(childId: string): Promise<{
        totalDiapers: bigint;
        totalBreastfeedingSessions: bigint;
        totalTummyTime: bigint;
    }>;
    getChildrenByParent(parent: Principal): Promise<Array<ChildProfileView>>;
    getDiaperLogsForChild(childId: string): Promise<Array<DiaperLog>>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getJournalNotesForChild(childId: string): Promise<Array<JournalNote>>;
    getSharedChildren(): Promise<Array<ChildProfileView>>;
    getSharedUsers(childId: string): Promise<Array<Principal>>;
    getTummyTimeSessionsForChild(childId: string): Promise<Array<TummyTimeSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeightEntriesForChild(childId: string): Promise<Array<WeightEntry>>;
    getMilkPumpingSessionsForChild(childId: string): Promise<Array<MilkPumpingSession>>;
    addFeedingSession(childId: string, timestamp: bigint, mlAmount: number, feedingType: { misinukas: null } | { mamosPienas: null }): Promise<void>;
    deleteFeedingSession(childId: string, sessionId: string): Promise<void>;
    getFeedingSessionsForChild(childId: string): Promise<Array<FeedingSession>>;
    isCallerAdmin(): Promise<boolean>;
    logDiaperChange(childId: string, kakis: boolean, sysius: boolean, tuscia: boolean): Promise<void>;
    pauseBreastfeedingTimer(childId: string): Promise<void>;
    pauseTummyTimeTimer(childId: string): Promise<void>;
    regenerateChildPhoto(childId: string): Promise<void>;
    resumeBreastfeedingTimer(childId: string): Promise<void>;
    resumeTummyTimeTimer(childId: string): Promise<void>;
    revokeChildAccess(childId: string, userId: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchJournalNotes(childId: string, searchTerm: string): Promise<Array<JournalNote>>;
    shareChildWithUser(childId: string, userId: Principal): Promise<void>;
    startBreastfeedingSession(childId: string, side: Variant_left_right): Promise<void>;
    startTummyTimeSession(childId: string): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    toggleChildVisibility(childId: string): Promise<void>;
    updateJournalNote(childId: string, noteId: string, newText: string, newColor: NoteColor | null): Promise<void>;
    updateWeightEntry(childId: string, weightId: string, newWeight: number, newTimestamp: bigint): Promise<void>;
}
