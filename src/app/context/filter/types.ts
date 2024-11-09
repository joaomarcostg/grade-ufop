export type TimeRange = {
  start: string;
  end: string;
};

export type DayOfWeek = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB";
export interface FilterState {
  timeRanges: TimeRange[];
  selectedDays: DayOfWeek[];
  includeElective: boolean;
  ignorePrerequisite: boolean;
  dayWeight: number;
  gapWeight: number;
}
