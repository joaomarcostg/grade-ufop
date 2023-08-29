"use client";
import React, { createContext, useReducer, useEffect, Dispatch } from "react";
import { globalReducer } from "./reducers";
import { type Action, ActionType } from "./actions";
import { type InitialStateType } from "./types";

const initialState: InitialStateType = {
  course: null,
  coursedDisciplines: [],
  availableOptions: [],
  disciplineSlots: {},
  selectedDisciplines: {},
};

const StudentContext = createContext<{
  state: InitialStateType;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

const saveToLocalStorage = (state: InitialStateType) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("appState", serializedState);
  } catch (e) {
    console.error("Could not save state", e);
  }
};

const loadFromLocalStorage = (): InitialStateType => {
  try {
    const appState = localStorage.getItem("appState");
    return appState ? (JSON.parse(appState) as InitialStateType) : initialState;
  } catch (e) {
    console.error("Could not load state", e);
    return initialState;
  }
};

function StudentProvider({ children }: React.PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  useEffect(() => {
    // Load the state from localStorage when the component mounts
    if (typeof window === undefined) {
      return;
    }

    const appState = loadFromLocalStorage();
    dispatch({ type: ActionType["INIT_STATE"], payload: appState });
  }, []);

  useEffect(() => {
    const currentState = loadFromLocalStorage();
    if (JSON.stringify(currentState) !== JSON.stringify(state)) {
      saveToLocalStorage(state);
    }
  }, [state]);

  return <StudentContext.Provider value={{ state, dispatch }}>{children}</StudentContext.Provider>;
}

export { StudentProvider, StudentContext };
