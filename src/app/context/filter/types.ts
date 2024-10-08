export interface FilterState {
  timeSlots: string[];
  days: string[];
  includeElective: boolean;
  ignorePrerequisite: boolean;
  dayWeight: number;
  gapWeight: number;
}