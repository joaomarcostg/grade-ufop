import { Action, ActionType } from "./actions";
import { AppState } from "./types";

const updateSelectedDisciplines = (
  obj: AppState["selectedDisciplines"],
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
  obj: AppState["selectedDisciplines"],
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
  state: AppState,
  { type, payload }: Action
): AppState => {
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

      const coursedDisciplines = new Map(state.coursedDisciplines)
      
      if (coursedDisciplines.has(payload.id)) {
        coursedDisciplines.delete(payload.id);
      } else {
        coursedDisciplines.set(payload.id, payload);
      }

      return {
        ...state,
        coursedDisciplines
      };

    case ActionType.SET_MULTIPLE_COURSED_DISCIPLINES:
      return {
        ...state,
        coursedDisciplines: new Map(payload.map((d) => [d.id, d])),
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
    case ActionType.SET_SETUP_COMPLETED:
      return {
        ...state,
        setupCompleted: payload,
      };
    default:
      return state;
  }
};
