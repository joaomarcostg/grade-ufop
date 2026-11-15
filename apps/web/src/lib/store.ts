"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_PREFERENCES, type Preferences } from "./scheduler";

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

export interface ProgramState {
  completed: string[];
  track: string | null;
  planned: string[];
  locked: Record<string, string>;
  preferences: Preferences;
  saved: SavedPlan[];
}

const EMPTY: ProgramState = {
  completed: [],
  track: null,
  planned: [],
  locked: {},
  preferences: DEFAULT_PREFERENCES,
  saved: [],
};

interface StudentStore {
  lastProgram: { institution: string; program: string } | null;
  programs: Record<string, ProgramState>;
  visit: (institution: string, program: string) => void;
  update: (key: string, change: (state: ProgramState) => Partial<ProgramState>) => void;
}

export function programKey(institution: string, program: string) {
  return `${institution}/${program.toUpperCase()}`;
}

export const useStudentStore = create<StudentStore>()(
  persist(
    (set) => ({
      lastProgram: null,
      programs: {},
      visit: (institution, program) => set({ lastProgram: { institution, program: program.toLowerCase() } }),
      update: (key, change) =>
        set((store) => {
          const current = { ...EMPTY, ...store.programs[key] };
          return { programs: { ...store.programs, [key]: { ...current, ...change(current) } } };
        }),
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

/** The saved state of one program (defaults until the student changes something). */
export function useProgramState(key: string): ProgramState {
  return useStudentStore((store) => store.programs[key]) ?? EMPTY;
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
