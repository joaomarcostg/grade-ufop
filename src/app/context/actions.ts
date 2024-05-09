import { AutocompleteOption } from "../components/InputAutocomplete";
import { type InitialStateType } from "./types";

export enum ActionType {
  INIT_STATE = "INIT_STATE",
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
}

// Define the Action type as a discriminated union
export type Action =
  | { type: ActionType.INIT_STATE; payload: InitialStateType }
  | {
      type: ActionType.SELECT_COURSE;
      payload: AutocompleteOption;
    }
  | { type: ActionType.SET_MULTIPLE_COURSED_DISCIPLINES; payload: string[] }
  | { type: ActionType.SELECT_COURSED_DISCIPLINE; payload: string }
  | { type: ActionType.SET_AVAILABLE_OPTIONS; payload: NonNullable<AutocompleteOption>[] }
  | {
      type: ActionType.REMOVE_FROM_AVAILABLE_OPTIONS;
      payload: NonNullable<AutocompleteOption>;
    }
  | {
      type: ActionType.ADD_TO_AVAILABLE_OPTIONS;
      payload: NonNullable<AutocompleteOption>;
    }
  | {
      type: ActionType.ADD_TO_SELECTED_DISCIPLINES;
      payload: {
        slotId: string;
        disciplineId: string;
      };
    }
  | {
      type: ActionType.REMOVE_FROM_SELECTED_DISCIPLINES;
      payload: {
        slotId: string;
        disciplineId: string;
      };
    }
  | {
      type: ActionType.CREATE_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
      };
    }
  | {
      type: ActionType.DELETE_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
      };
    }
  | {
      type: ActionType.ADD_TO_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
        value: NonNullable<AutocompleteOption>;
      };
    }
  | {
      type: ActionType.REMOVE_FROM_DISCIPLINES_SLOT;
      payload: {
        slotId: string;
        value: NonNullable<AutocompleteOption>;
      };
    }
  | {
      type: ActionType.SET_DISCIPLINES_SLOT;
      payload: {
        [slotId: string]: AutocompleteOption[];
      };
    };
