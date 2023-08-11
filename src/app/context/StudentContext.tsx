"use client";
import React, { createContext, useReducer, Dispatch } from 'react';
import { globalReducer, type Action } from './reducers';
import { InitialStateType } from './types'

const initialState: InitialStateType = {
  course: null,
  coursedDisciplines: [],
}

const StudentContext = createContext<{
  state: InitialStateType;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null
});

function StudentProvider ({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <StudentContext.Provider value={{state, dispatch}}>
        {children}
    </StudentContext.Provider>
  );
}

export { StudentProvider, StudentContext };