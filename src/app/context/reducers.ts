import { Action, ActionType } from "./actions";
import { InitialStateType } from "./types";

const updateSelectedDisciplines = (
  obj: InitialStateType["selectedDisciplines"],
  payload: {
    slotId: string;
    disciplineId: string;
  }
) => {
  const updated = { ...obj };
  const { slotId, disciplineId } = payload;

  if (!updated[slotId]) {
    updated[slotId] = [];
  }

  if (!updated[slotId].includes(disciplineId)) {
    updated[slotId].push(disciplineId);
  }

  return updated;
};

const removeFromSelectedDisciplines = (
  obj: InitialStateType["selectedDisciplines"],
  payload: {
    slotId: string;
    disciplineId: string;
  }
) => {
  const updated = { ...obj };
  const { slotId, disciplineId } = payload;

  if (updated[slotId]) {
    updated[slotId] = updated[slotId].filter((id) => id !== disciplineId);
  }

  return updated;
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

    case ActionType.SELECT_COURSE:
      return {
        ...state,
        course: payload
          ? {
              label: payload.label ?? "",
              value: payload.value,
            }
          : null,
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

    case ActionType.ADD_TO_SELECTED_DISCIPLINES:
      return {
        ...state,
        selectedDisciplines: updateSelectedDisciplines(
          state.selectedDisciplines,
          payload
        ),
      };

    case ActionType.REMOVE_FROM_SELECTED_DISCIPLINES:
      return {
        ...state,
        selectedDisciplines: removeFromSelectedDisciplines(
          state.selectedDisciplines,
          payload
        ),
      };

    case ActionType.CREATE_DISCIPLINES_SLOT:
      return {
        ...state,
        disciplineSlots: {
          ...state.disciplineSlots,
          [payload.slotId]: [],
        },
      };

    case ActionType.DELETE_DISCIPLINES_SLOT:
      const updatedDisciplineSlots = { ...state.disciplineSlots };
      delete updatedDisciplineSlots[payload.slotId];
      return {
        ...state,
        disciplineSlots: updatedDisciplineSlots,
      };

    case ActionType.ADD_TO_DISCIPLINES_SLOT:
      return {
        ...state,
        disciplineSlots: {
          ...state.disciplineSlots,
          [payload.slotId]: [
            ...(state.disciplineSlots[payload.slotId] || []),
            payload.value,
          ],
        },
        availableOptions: state.availableOptions.filter(
          (item) => item?.value !== payload.value?.value
        ),
      };

    case ActionType.REMOVE_FROM_DISCIPLINES_SLOT:
      const newArrayWithAdded = [...state.availableOptions, payload.value];
      newArrayWithAdded.sort((a, b) => (a?.index || 0) - (b?.index || 0));

      return {
        ...state,
        disciplineSlots: {
          ...state.disciplineSlots,
          [payload.slotId]: (
            state.disciplineSlots[payload.slotId] || []
          ).filter(
            (disciplineClass) => disciplineClass?.value !== payload.value?.value
          ),
        },
        availableOptions: newArrayWithAdded,
      };

    case ActionType.SET_DISCIPLINES_SLOT:
      return {
        ...state,
        disciplineSlots: payload,
      };
    default:
      return state;
  }
};
