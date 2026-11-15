import type { Entry } from "./catalog-types";
import type { EntryState } from "./eligibility";

/**
 * How much a student may enroll in per semester at UFOP.
 *
 * The limit is counted in weekly class hours (50-minute classes): 32 a week in
 * most programs (Res. CEPE 1.744, art. 17 §3), 24 in Engenharia de Controle e
 * Automação and Engenharia de Produção in Ouro Preto, 34 in Medicina. A
 * program's PPC can set another one, and going over takes a "matrícula com
 * excesso de horas" request to the colegiado. The minimum is 150 h in the
 * semester, waived when the program is nearly done (PROGRAD, Manual do aluno).
 */

/** A weekly 50-minute class over the 18-week semester counts as 15 h. */
export const HOURS_PER_WEEKLY_CLASS = 15;
export const MIN_SEMESTER_HOURS = 150;
export const DEFAULT_WEEKLY_LIMIT = 32;

const WEEKLY_LIMIT: Record<string, number> = { AUT: 24, PRO: 24, MED: 34 };

export function defaultWeeklyLimit(programCode: string): number {
  return WEEKLY_LIMIT[programCode.toUpperCase()] ?? DEFAULT_WEEKLY_LIMIT;
}

/** Weekly class hours of a subject: the curriculum's theory + practice, else its hours / 15. */
export function weeklyClassesOf(entry: Entry | undefined): number {
  if (!entry) return 0;
  return entry.weeklyClasses ?? Math.round((entry.workloadHours ?? 0) / HOURS_PER_WEEKLY_CLASS);
}

/**
 * The order the planner keeps subjects in when they do not all fit: mandatory
 * before the rest, the earliest period first (the ones the student is behind
 * on), then the ones that unlock the most.
 */
function compareSubjects(a: string, b: string, states: Map<string, EntryState>): number {
  const rank = (code: string) => {
    const s = states.get(code);
    return [s?.entry.category === "mandatory" ? 0 : 1, s?.entry.period ?? 99, -(s?.unlocks.length ?? 0)];
  };
  const [x, y] = [rank(a), rank(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

export function byPriority(codes: string[], states: Map<string, EntryState>): string[] {
  return [...codes].sort((a, b) => compareSubjects(a, b, states));
}

/**
 * Adds ``code`` where it belongs by priority, after anything that ranks the
 * same, so a list the student reordered keeps their order.
 */
export function insertByPriority(codes: string[], code: string, states: Map<string, EntryState>): string[] {
  const at = codes.findIndex((other) => compareSubjects(code, other, states) < 0);
  return at < 0 ? [...codes, code] : [...codes.slice(0, at), code, ...codes.slice(at)];
}
