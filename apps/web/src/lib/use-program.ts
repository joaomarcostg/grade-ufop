"use client";

import { useCallback, useEffect, useMemo } from "react";

import type { ProgramBundle } from "./catalog-types";
import { computeEligibility } from "./eligibility";
import { type ProgramState, programKey, useHydrated, useProgramState, useStudentStore } from "./store";
import { passedBefore } from "./transcript/match";

/** A program's catalog data joined with what this student saved for it. */
export function useProgram(bundle: ProgramBundle) {
  const key = programKey(bundle.institution.code, bundle.program.code);
  const hydrated = useHydrated();
  const state = useProgramState(key);
  const update = useStudentStore((s) => s.update);
  const visit = useStudentStore((s) => s.visit);

  useEffect(() => {
    if (hydrated) visit(bundle.institution.code, bundle.program.code);
  }, [hydrated, visit, bundle.institution.code, bundle.program.code]);

  // While replaying a past semester, "passed" comes from the imported history.
  const simulating = state.simulateAt !== null && state.history !== null;
  const passedCodes = useMemo(
    () =>
      simulating && state.history
        ? passedBefore(state.history, state.history.mapping, state.simulateAt)
        : state.completed,
    [simulating, state.history, state.simulateAt, state.completed],
  );
  const completed = useMemo(() => new Set(passedCodes), [passedCodes]);
  const eligibility = useMemo(
    () => computeEligibility(bundle, completed, state.track),
    [bundle, completed, state.track],
  );

  const change = useCallback((fn: (s: ProgramState) => Partial<ProgramState>) => update(key, fn), [update, key]);

  const setCompleted = useCallback(
    (codes: string[], done: boolean) =>
      change((s) => {
        if (s.simulateAt) return {}; // a replay is read-only
        const next = new Set(s.completed);
        for (const code of codes) {
          if (done) next.add(code);
          else next.delete(code);
        }
        // Passed subjects leave the plan.
        return { completed: [...next].sort(), planned: done ? s.planned.filter((c) => !next.has(c)) : s.planned };
      }),
    [change],
  );

  const setPlanned = useCallback(
    (code: string, planned: boolean) =>
      change((s) => {
        if (planned) return { planned: s.planned.includes(code) ? s.planned : [...s.planned, code] };
        const locked = { ...s.locked };
        delete locked[code];
        return { planned: s.planned.filter((c) => c !== code), locked };
      }),
    [change],
  );

  const name = useCallback((code: string) => bundle.subjects[code]?.name ?? code, [bundle.subjects]);

  return { key, hydrated, state, simulating, completed, eligibility, change, setCompleted, setPlanned, name };
}

export type Program = ReturnType<typeof useProgram>;

export function formatHours(hours: number) {
  return `${hours.toLocaleString("pt-BR")} h`;
}
