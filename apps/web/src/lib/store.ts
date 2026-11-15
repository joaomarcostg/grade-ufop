"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_PREFERENCES, type Preferences } from "./scheduler";
import type { Status, Transcript } from "./transcript/parse";

/**
 * Everything a student enters, kept in this browser's localStorage (no account
 * needed). Keyed by "institution/PROGRAM" so switching programs keeps both.
 */

export interface SavedPlan {
  id: string;
  name: string;
  term: string;
  /** Subject code -> section code. */
  sections: Record<string, string>;
  createdAt: string;
}

/** A transcript the student imported, kept to replay any past semester. */
export interface ImportedHistory {
  importedAt: string;
  fileName: string;
  rows: { term: string; code: string; name: string; status: Status; workloadHours: number }[];
  terms: string[];
  /** Transcript code -> curriculum code, as the student confirmed it. */
  mapping: Record<string, string>;
}

export interface ProgramState {
  completed: string[];
  track: string | null;
  planned: string[];
  locked: Record<string, string>;
  preferences: Preferences;
  /** Most weekly class hours to enroll in; null = the program's default. */
  weeklyLimit: number | null;
  saved: SavedPlan[];
  history: ImportedHistory | null;
  /** Replaying the start of this term from the imported history; null = today. */
  simulateAt: string | null;
}

export const EMPTY_PROGRAM: ProgramState = {
  completed: [],
  track: null,
  planned: [],
  locked: {},
  preferences: DEFAULT_PREFERENCES,
  weeklyLimit: null,
  saved: [],
  history: null,
  simulateAt: null,
};

export interface PendingImport {
  institution: string;
  program: string;
  fileName: string;
  transcript: Transcript;
}

interface StudentStore {
  lastProgram: { institution: string; program: string } | null;
  programs: Record<string, ProgramState>;
  /** A parsed transcript waiting for the student to review it. */
  pendingImport: PendingImport | null;
  visit: (institution: string, program: string) => void;
  update: (key: string, change: (state: ProgramState) => Partial<ProgramState>) => void;
  setPendingImport: (pending: PendingImport | null) => void;
}

export function programKey(institution: string, program: string) {
  return `${institution}/${program.toUpperCase()}`;
}

export const useStudentStore = create<StudentStore>()(
  persist(
    (set) => ({
      lastProgram: null,
      programs: {},
      pendingImport: null,
      visit: (institution, program) => set({ lastProgram: { institution, program: program.toLowerCase() } }),
      update: (key, change) =>
        set((store) => {
          const current = { ...EMPTY_PROGRAM, ...store.programs[key] };
          return { programs: { ...store.programs, [key]: { ...current, ...change(current) } } };
        }),
      setPendingImport: (pendingImport) => set({ pendingImport }),
    }),
    {
      name: "grade:student",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated on the client by useHydrated(), so server and first client
      // render agree.
      skipHydration: true,
    },
  ),
);

/** The saved state of one program, with defaults for anything not set yet. */
export function useProgramState(key: string): ProgramState {
  const saved = useStudentStore((store) => store.programs[key]);
  return saved ? { ...EMPTY_PROGRAM, ...saved } : EMPTY_PROGRAM;
}

const subscribeToHydration = (onChange: () => void) => useStudentStore.persist.onFinishHydration(onChange);

/** False until localStorage has been read; render placeholders until then. */
export function useHydrated(): boolean {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => useStudentStore.persist.hasHydrated(),
    () => false,
  );
  useEffect(() => {
    if (!useStudentStore.persist.hasHydrated()) void useStudentStore.persist.rehydrate();
  }, []);
  return hydrated;
}
