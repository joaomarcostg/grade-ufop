import { StudentAction, StudentActionType } from "./actions";
import { StudentState } from "./types";

const updateSelectedDisciplines = (
  obj: StudentState["selectedDisciplines"],
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
  obj: StudentState["selectedDisciplines"],
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

export const studentReducer = (
  state: StudentState,
  { type, payload }: StudentAction
): StudentState => {
  switch (type) {
    case StudentActionType.INIT_STATE:
      return payload;

    case StudentActionType.SET_USER_DATA:
      return {
        ...state,
        user: payload,
      };

    case StudentActionType.SET_COURSES:
      return {
        ...state,
        courses: payload,
      };

    case StudentActionType.SET_AVAILABLE_OPTIONS:
      return {
        ...state,
        availableDisciplineOptions: payload,
      };

    case StudentActionType.SELECT_COURSE:
      return {
        ...state,
        course: payload
          ? {
              label: payload.label ?? "",
              value: payload.value,
            }
          : null,
      };

    case StudentActionType.SELECT_COURSED_DISCIPLINE:
      if (!payload) {
        return state;
      }

      const coursedDisciplines = new Map(state.coursedDisciplines);

      if (coursedDisciplines.has(payload.id)) {
        coursedDisciplines.delete(payload.id);
      } else {
        coursedDisciplines.set(payload.id, payload);
      }

      return {
        ...state,
        coursedDisciplines,
      };

    case StudentActionType.SET_MULTIPLE_COURSED_DISCIPLINES:
      return {
        ...state,
        coursedDisciplines: new Map(payload.map((d) => [d.id, d])),
      };

    case StudentActionType.ADD_TO_SELECTED_DISCIPLINES:
      return {
        ...state,
        selectedDisciplines: updateSelectedDisciplines(
          state.selectedDisciplines,
          payload
        ),
      };

    case StudentActionType.REMOVE_FROM_SELECTED_DISCIPLINES:
      return {
        ...state,
        selectedDisciplines: removeFromSelectedDisciplines(
          state.selectedDisciplines,
          payload
        ),
      };

    case StudentActionType.CREATE_DISCIPLINES_SLOT:
      return {
        ...state,
        disciplineSlots: {
          ...state.disciplineSlots,
          [payload.slotId]: [],
        },
      };

    case StudentActionType.DELETE_DISCIPLINES_SLOT:
      const updatedDisciplineSlots = { ...state.disciplineSlots };
      delete updatedDisciplineSlots[payload.slotId];
      return {
        ...state,
        disciplineSlots: updatedDisciplineSlots,
      };

    case StudentActionType.ADD_TO_DISCIPLINES_SLOT:
      return {
        ...state,
        disciplineSlots: {
          ...state.disciplineSlots,
          [payload.slotId]: [
            ...(state.disciplineSlots[payload.slotId] || []),
            payload.value,
          ],
        },
        availableDisciplineOptions: state.availableDisciplineOptions.filter(
          (item) => item?.value !== payload.value?.value
        ),
      };

    case StudentActionType.REMOVE_FROM_DISCIPLINES_SLOT:
      const newArrayWithAdded = [
        ...state.availableDisciplineOptions,
        payload.value,
      ];
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
        availableDisciplineOptions: newArrayWithAdded,
      };

    case StudentActionType.SET_DISCIPLINES_SLOT:
      return {
        ...state,
        disciplineSlots: payload,
      };
    case StudentActionType.SET_SETUP_COMPLETED:
      return {
        ...state,
        setup: {
          ...state.setup,
          completed: payload,
        },
      };
    case StudentActionType.SET_SETUP_STEP:
      return {
        ...state,
        setup: {
          ...state.setup,
          step: payload,
        },
      };
    case StudentActionType.DELETE_SAVED_SCHEDULE:
      const { scheduleId, semester } = payload;

      delete state.scheduleCombinations[semester][scheduleId];

      return {
        ...state,
      };
    case StudentActionType.ADD_SAVED_SCHEDULE:
      state.scheduleCombinations[payload.semester][payload.scheduleId] = {
        ...payload.schedule,
      };

      return {
        ...state,
      };

    default:
      return state;
  }
};
