import { InitialStateType } from "./types";

export enum ActionType {
  SELECT_COURSE = "SELECT_COURSE",
  SELECT_COURSED_DISCIPLINE = "SELECT_COURSED_DISCIPLINE",
}

export type Action = {
  type: ActionType;
  payload: string | null;
};

export const globalReducer = (
  state: InitialStateType,
  { type, payload }: Action
): InitialStateType => {
  switch (type) {
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
