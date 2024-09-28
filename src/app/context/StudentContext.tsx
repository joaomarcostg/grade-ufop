"use client";
import React, {
  createContext,
  useReducer,
  useEffect,
  Dispatch,
  useCallback,
  useState,
} from "react";
import { globalReducer } from "./reducers";
import { type Action, ActionType } from "./actions";
import { ObjAppState, type AppState } from "./types";
import { getUserCourseAndDisciplines } from "@/lib/fetch-api/fetch-user-data";

const defaultState: AppState = {
  course: null,
  coursedDisciplines: new Map(),
  availableOptions: [],
  disciplineSlots: {},
  selectedDisciplines: {},
  setupCompleted: false,
};

interface StudentContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StudentContext = createContext<StudentContextType>({
  state: defaultState,
  dispatch: () => null,
});

const saveToLocalStorage = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("appState", serializedState);
  } catch (e) {
    console.error("Could not save state", e);
  }
};

const loadFromLocalStorage = (): AppState | null => {
  try {
    const appState = localStorage.getItem("appState");

    if (!appState) {
      return null;
    }

    const appStateObj = JSON.parse(appState) as ObjAppState;
    const coursedDisciplines = new Map();

    console.log(appStateObj)

    for (const key in appStateObj.coursedDisciplines) {
      coursedDisciplines.set(key, appStateObj.coursedDisciplines[key]);
    }

    const finalState = JSON.parse(appState) as AppState;
    finalState.coursedDisciplines = coursedDisciplines;

    return finalState;
  } catch (e) {
    console.error("Could not load state", e);
    return null;
  }
};

const loadFromDatabase = async (): Promise<AppState | null> => {
  try {
    const dbData = await getUserCourseAndDisciplines();
    console.log("dbData", dbData);

    if (!dbData) return null;

    const course = dbData.course
      ? {
          label: dbData.course.name,
          value: dbData.course.id,
        }
      : null;

    const coursedDisciplines = new Map(
      dbData.completedDisciplines.map((d) => [d.id, d])
    );

    console.log("coursedDisciplines", coursedDisciplines);

    return {
      ...defaultState,
      course,
      coursedDisciplines,
    };
  } catch (error) {
    console.error("Failed to fetch initial data from database:", error);
    return null;
  }
};

function StudentProvider({ children }: React.PropsWithChildren<{}>) {
  const [initialized, setInitialized] = useState(false);
  const [state, dispatch] = useReducer(globalReducer, defaultState);

  const initializeState = async () => {
    const existingState = loadFromLocalStorage() || (await loadFromDatabase());
    dispatch({
      type: ActionType.INIT_STATE,
      payload: existingState ?? defaultState,
    });
    setInitialized(true);
  };

  useEffect(() => {
    initializeState().catch((error) => {
      console.error("Error initializing state:", error);
      setInitialized(false);
    });
  }, []);

  useEffect(() => {
    if (!initialized) return;
    saveToLocalStorage(state);
  }, [state, initialized]);

  if (!initialized) return <>{children}</>;

  return (
    <StudentContext.Provider value={{ state, dispatch }}>
      {children}
    </StudentContext.Provider>
  );
}

export { StudentProvider, StudentContext };
