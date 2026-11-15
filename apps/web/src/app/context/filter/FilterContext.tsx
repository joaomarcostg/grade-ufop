// context/FilterContext.tsx
"use client";

import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
} from "@/app/utils/localStorage";
import { DayOfWeek, FilterState } from "./types";
import { filterReducer } from "./reducer";
import { FilterAction } from "./actions";
import { DaysOfWeek } from "./constants";

// Initial state
const initialState: FilterState = {
  timeRanges: [],
  selectedDays: Object.keys(DaysOfWeek) as DayOfWeek[],
  includeElective: true,
  ignorePrerequisite: false,
  dayWeight: 1,
  gapWeight: 1,
};

const FilterContext = createContext<
  | {
      state: FilterState;
      dispatch: React.Dispatch<FilterAction>;
    }
  | undefined
>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    filterReducer,
    loadFromLocalStorage("filterState", initialState)
  );

  useEffect(() => {
    saveToLocalStorage("filterState", state);
  }, [state]);

  return (
    <FilterContext.Provider value={{ state, dispatch }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
};
