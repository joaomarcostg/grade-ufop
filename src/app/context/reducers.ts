import { InitialStateType } from "./types";

export enum ActionType {
  INIT_STATE = "INIT_STATE",
  SELECT_COURSE = "SELECT_COURSE",
  SELECT_COURSED_DISCIPLINE = "SELECT_COURSED_DISCIPLINE",
  SET_AVAILABLE_OPTIONS = "SET_AVAILABLE_OPTIONS",
  REMOVE_FROM_AVAILABLE_OPTIONS = "REMOVE_FROM_AVAILABLE_OPTIONS",
  ADD_TO_AVAILABLE_OPTIONS = "ADD_TO_AVAILABLE_OPTIONS",
}

export type Action = {
  type: ActionType;
  payload: any;
};

export const globalReducer = (
  state: InitialStateType,
  { type, payload }: Action
): InitialStateType => {
  switch (type) {
    case ActionType.INIT_STATE:
      return payload;

    case ActionType.SET_AVAILABLE_OPTIONS:
      return {
        ...state,
        availableOptions: payload,
      };

    case ActionType.REMOVE_FROM_AVAILABLE_OPTIONS:
      return {
        ...state,
        availableOptions: state.availableOptions.filter(
          (item) => item?.value !== payload.value
        ),
      };

    case ActionType.ADD_TO_AVAILABLE_OPTIONS:
      const newArrayWithAdded = [...state.availableOptions, payload];
      newArrayWithAdded.sort((a, b) => a.index - b.index);

      return {
        ...state,
        availableOptions: newArrayWithAdded,
      };

    case ActionType.SELECT_COURSE:
      return {
        ...state,
        course: payload,
      };
    case ActionType.SELECT_COURSED_DISCIPLINE:
      if (!payload) {
        return state;
      }

      const idx = state.coursedDisciplines.indexOf(payload);
      if (idx === -1) {
        return {
          ...state,
          coursedDisciplines: [...state.coursedDisciplines, payload],
        };
      }

      return {
        ...state,
        coursedDisciplines: state.coursedDisciplines.filter(
          (discipline) => discipline !== payload
        ),
      };

    default:
      return state;
  }
};
