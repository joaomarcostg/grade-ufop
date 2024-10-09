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
import { UserProfile, type StudentState } from "./types";
import { fetchCourses, getUserData } from "@/lib/fetch-api";
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
  try {
    const storageData = loadFromLocalStorage("studentState", defaultState);
    const [userData, coursesData] = await Promise.all([
      getUserData(),
      fetchCourses(),
    ]);

    if (!userData) {
      return defaultState;
    }

    const user: UserProfile = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
    };

    const course = userData?.course
      ? { label: userData.course.name, value: userData.course.id }
      : null;

    const coursedDisciplines = new Map(
      userData?.coursedDisciplines.map((d) => [d.id, d]) || []
    );

    const courses =
      coursesData?.map((course) => ({
        label: course.name,
        value: course.id,
      })) || [];

    return {
      ...storageData,
      user,
      course,
      coursedDisciplines,
      courses,
    };
  } catch (error) {
    console.error("Error loading data from database:", error);
    return defaultState; // Fallback to default state in case of an error
  }
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
