import { DayOfWeek, TimeRange } from "./types";

// Define action types
export enum FilterActionType {
  SET_TIME_RANGES = "SET_TIME_RANGES",
  SET_DAYS = "SET_DAYS",
  SET_INCLUDE_ELECTIVE = "SET_INCLUDE_ELECTIVE",
  SET_IGNORE_PREREQUISITE = "SET_IGNORE_PREREQUISITE",
  SET_DAY_WEIGHT = "SET_DAY_WEIGHT",
  SET_GAP_WEIGHT = "SET_GAP_WEIGHT",
}

export type FilterAction =
  | { type: FilterActionType.SET_TIME_RANGES; payload: TimeRange[] }
  | { type: FilterActionType.SET_DAYS; payload: DayOfWeek[] }
  | { type: FilterActionType.SET_INCLUDE_ELECTIVE; payload: boolean }
  | { type: FilterActionType.SET_IGNORE_PREREQUISITE; payload: boolean }
  | { type: FilterActionType.SET_DAY_WEIGHT; payload: number }
  | { type: FilterActionType.SET_GAP_WEIGHT; payload: number };
