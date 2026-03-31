// Local type definitions for types not exported by backend
export interface DiaperLog {
  childId: string;
  timestamp: bigint;
  contents: {
    kakis: boolean;
    sysius: boolean;
    tuscia: boolean;
  };
}

export interface BreastfeedingSession {
  childId: string;
  startTime: bigint;
  duration: bigint;
  side: {
    left?: null;
    right?: null;
  };
}

export interface TummyTimeSession {
  childId: string;
  startTime: bigint;
  duration: bigint;
}
