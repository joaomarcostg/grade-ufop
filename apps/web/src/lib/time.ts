import type { Weekday } from "./catalog-types";

export const WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  MON: "Seg",
  TUE: "Ter",
  WED: "Qua",
  THU: "Qui",
  FRI: "Sex",
  SAT: "Sáb",
  SUN: "Dom",
};

export const WEEKDAY_LONG: Record<Weekday, string> = {
  MON: "Segunda-feira",
  TUE: "Terça-feira",
  WED: "Quarta-feira",
  THU: "Quinta-feira",
  FRI: "Sexta-feira",
  SAT: "Sábado",
  SUN: "Domingo",
};

export type Shift = "morning" | "afternoon" | "night";

export const SHIFT_LABEL: Record<Shift, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

/** 450 -> "07:30" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** The shift a class starting at ``start`` belongs to. */
export function shiftOf(start: number): Shift {
  if (start < 12 * 60) return "morning";
  if (start < 18 * 60) return "afternoon";
  return "night";
}

/** Breaks up to this long between classes are not counted as gaps. */
export const MAX_BREAK_MINUTES = 30;
