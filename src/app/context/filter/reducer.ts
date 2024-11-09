import { FilterState } from "./types";
import { FilterAction } from "./actions";

export function filterReducer(
  state: FilterState,
  action: FilterAction
): FilterState {
  switch (action.type) {
    case "SET_TIME_RANGES":
      return { ...state, timeRanges: action.payload };
    case "SET_DAYS":
      return { ...state, selectedDays: action.payload };
    case "SET_INCLUDE_ELECTIVE":
      return { ...state, includeElective: action.payload };
    case "SET_IGNORE_PREREQUISITE":
      return { ...state, ignorePrerequisite: action.payload };
    case "SET_DAY_WEIGHT":
      return { ...state, dayWeight: action.payload };
    case "SET_GAP_WEIGHT":
      return { ...state, gapWeight: action.payload };
    default:
      return state;
  }
}
