import type { Section } from "./catalog-types";
import type { UnavailableReason } from "./scheduler";
import { formatMinutes, SHIFT_LABEL, shiftOf, WEEKDAY_SHORT, WEEKDAYS } from "./time";

/** "Ter e Qui · tarde" */
export function sectionSummary(section: Section): string {
  if (section.meetings.length === 0) return "sem horário fixo";
  const days = [...new Set(section.meetings.map((m) => m.day))].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
  const shifts = [...new Set(section.meetings.map((m) => SHIFT_LABEL[shiftOf(m.start)].toLowerCase()))];
  const dayText = days.map((d) => WEEKDAY_SHORT[d]).join(days.length === 2 ? " e " : ", ");
  return `${dayText} · ${shifts.join(" e ")}`;
}

/** "Ter 13:30–15:10, Qui 15:20–17:00" */
export function sectionTimes(section: Section): string {
  if (section.meetings.length === 0) return "sem horário fixo";
  return section.meetings
    .map((m) => `${WEEKDAY_SHORT[m.day]} ${formatMinutes(m.start)}–${formatMinutes(m.end)}`)
    .join(", ");
}

export function seatsLabel(section: Section): string | null {
  if (section.seats === null) return null;
  if (section.seats <= 0) return "sem vagas";
  return section.seats === 1 ? "1 vaga" : `${section.seats} vagas`;
}

/** Calendar tints, one per subject in the plan. None is green (passed) or wine (brand). */
export const SUBJECT_COLORS = [
  { bg: "#dce7ff", border: "#8daeff", text: "#173a8f" },
  { bg: "#ffe6d1", border: "#e7a877", text: "#7a3300" },
  { bg: "#d5f0ea", border: "#7fc9b8", text: "#0e5047" },
  { bg: "#e9e1ff", border: "#b39df2", text: "#45289a" },
  { bg: "#fff3c4", border: "#e6cb62", text: "#5c4a00" },
  { bg: "#d9f1fb", border: "#86cbe6", text: "#0b4f6c" },
  { bg: "#e4e8ee", border: "#a9b4c2", text: "#2e3a48" },
  { bg: "#f3e2f0", border: "#d6a3cd", text: "#6b2460" },
];

export const UNAVAILABLE_TEXT: Record<UnavailableReason, string> = {
  "not-offered": "não ofertada neste semestre",
  shift: "nenhuma turma nos turnos escolhidos",
  seats: "todas as turmas sem vagas",
};
