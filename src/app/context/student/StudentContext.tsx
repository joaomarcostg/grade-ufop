// context/StudentContext.tsx
"use client";
import React, {
  createContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useContext,
} from "react";
import { studentReducer } from "./reducer";
import { type StudentAction, StudentActionType } from "./actions";
import { type StudentState } from "./types";
import { getUserCourseAndDisciplines, fetchCourses } from "@/lib/fetch-api";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
} from "@/app/utils/localStorage";

// Initial state
const defaultState: StudentState = {
  course: null,
  user: null,
  coursedDisciplines: new Map(),
  availableDisciplineOptions: [],
  disciplineSlots: {},
  selectedDisciplines: {},
  setupCompleted: false,
  courses: [],
};

interface StudentContextType {
  state: StudentState;
  dispatch: React.Dispatch<StudentAction>;
}

const StudentContext = createContext<StudentContextType>({
  state: defaultState,
  dispatch: () => null,
});

// Function to load the initial state from both the database and local storage
const loadFromDatabase = async (): Promise<StudentState> => {
  const storageData = loadFromLocalStorage("studentState", defaultState);
  const dbData = await getUserCourseAndDisciplines();
  const coursesData = await fetchCourses();

  const course = dbData?.course
    ? { label: dbData.course.name, value: dbData.course.id }
    : null;

  const coursedDisciplines = new Map(
    dbData?.completedDisciplines.map((d) => [d.id, d]) || []
  );
  const courses =
    coursesData?.map((course) => ({ label: course.name, value: course.id })) ||
    [];

  return {
    ...storageData,
    course,
    coursedDisciplines,
    courses,
  };
};

export const StudentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [state, dispatch] = useReducer(studentReducer, defaultState);

  const initializeState = useCallback(async () => {
    const existingState = await loadFromDatabase();
    dispatch({ type: StudentActionType.INIT_STATE, payload: existingState });
    setInitialized(true);
  }, []);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  useEffect(() => {
    if (initialized) {
      saveToLocalStorage("studentState", state);
    }
  }, [state, initialized]);

  if (!initialized) return null;

  return (
    <StudentContext.Provider value={{ state, dispatch }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
};
