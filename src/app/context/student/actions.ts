import { type Discipline } from "@prisma/client";
import { AutocompleteOption } from "@/components/InputAutocomplete";
import { UserProfile, type StudentState } from "./types";

export enum StudentActionType {
  INIT_STATE = "INIT_STATE",
  SET_USER_DATA = "SET_USER_DATA",
  SET_COURSES = "SET_COURSES",
  SELECT_COURSE = "SELECT_COURSE",
  SELECT_COURSED_DISCIPLINE = "SELECT_COURSED_DISCIPLINE",
  SET_MULTIPLE_COURSED_DISCIPLINES = "SET_MULTIPLE_COURSED_DISCIPLINES",
  SET_AVAILABLE_OPTIONS = "SET_AVAILABLE_OPTIONS",
  REMOVE_FROM_AVAILABLE_OPTIONS = "REMOVE_FROM_AVAILABLE_OPTIONS",
  ADD_TO_AVAILABLE_OPTIONS = "ADD_TO_AVAILABLE_OPTIONS",
  ADD_TO_SELECTED_DISCIPLINES = "ADD_TO_SELECTED_DISCIPLINES",
  REMOVE_FROM_SELECTED_DISCIPLINES = "REMOVE_FROM_SELECTED_DISCIPLINES",
  CREATE_DISCIPLINES_SLOT = "CREATE_DISCIPLINES_SLOT",
  DELETE_DISCIPLINES_SLOT = "DELETE_DISCIPLINES_SLOT",
  ADD_TO_DISCIPLINES_SLOT = "ADD_TO_DISCIPLINES_SLOT",
  REMOVE_FROM_DISCIPLINES_SLOT = "REMOVE_FROM_DISCIPLINES_SLOT",
  SET_DISCIPLINES_SLOT = "SET_DISCIPLINES_SLOT",
  SET_SETUP_COMPLETED = "SET_SETUP_COMPLETED",
}

// Define the Action type as a discriminated union
export type StudentAction =
  | { type: StudentActionType.INIT_STATE; payload: StudentState }
  | { type: StudentActionType.SET_USER_DATA; payload: UserProfile | null }
  | { type: StudentActionType.SET_COURSES; payload: Array<AutocompleteOption> }
  | {
      type: StudentActionType.SELECT_COURSE;
      payload: AutocompleteOption;
    }
  | { type: StudentActionType.SET_MULTIPLE_COURSED_DISCIPLINES; payload: Discipline[] }
  | { type: StudentActionType.SELECT_COURSED_DISCIPLINE; payload: Discipline }
  | {
      type: StudentActionType.SET_AVAILABLE_OPTIONS;
      payload: NonNullable<AutocompleteOption>[];
    }
  | {
      type: StudentActionType.REMOVE_FROM_AVAILABLE_OPTIONS;
      payload: NonNullable<AutocompleteOption>;
    }
  | {
      type: StudentActionType.ADD_TO_AVAILABLE_OPTIONS;
      payload: NonNullable<AutocompleteOption>;
    }
  | {
      type: StudentActionType.ADD_TO_SELECTED_DISCIPLINES;
      payload: {
        slotId: string;
        disciplineId: string;
      };
    }
  | {
      type: StudentActionType.REMOVE_FROM_SELECTED_DISCIPLINES;
      payload: {
        slotId: string;
        disciplineId: string;
      };
    }
  | {
      type: StudentActionType.CREATE_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
      };
    }
  | {
      type: StudentActionType.DELETE_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
      };
    }
  | {
      type: StudentActionType.ADD_TO_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
        value: NonNullable<AutocompleteOption>;
      };
    }
  | {
      type: StudentActionType.REMOVE_FROM_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
        value: NonNullable<AutocompleteOption>;
      };
    }
  | {
      type: StudentActionType.SET_DISCIPLINES_SLOT;
      payload: {
        [slotId: string]: AutocompleteOption[];
      };
    }
  | { type: StudentActionType.SET_SETUP_COMPLETED; payload: boolean };
