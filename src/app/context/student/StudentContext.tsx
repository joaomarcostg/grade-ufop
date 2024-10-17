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
import { useToast } from "../ToastContext";

// Initial state
const defaultState: StudentState = {
  course: null,
  user: null,
  coursedDisciplines: new Map(),
  availableDisciplineOptions: [],
  disciplineSlots: {},
  selectedDisciplines: {},
  setup: {
    completed: false,
    step: 0,
  },
  scheduleCombinations: {},
  courses: [],
};

interface StudentContextType {
  state: StudentState;
  dispatch: React.Dispatch<StudentAction>;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType>({
  state: defaultState,
  isLoading: false,
  dispatch: () => null,
});

// Function to load the initial state from both the database and local storage
const loadFromDatabase = async (): Promise<StudentState> => {
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

  const { scheduleCombinations } = userData;

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
    scheduleCombinations,
    courses,
  };
};

export const StudentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { addToast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(studentReducer, defaultState);

  const initializeState = useCallback(async () => {
    try {
      setIsLoading(true);
      const existingState = await loadFromDatabase();
      dispatch({ type: StudentActionType.INIT_STATE, payload: existingState });
      setInitialized(true);
    } catch (error) {
      addToast({
        message: "Erro ao carregar dados do usuário",
        severity: "error",
      });
      console.error("Error initializing student state:", error);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

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
    <StudentContext.Provider value={{ state, isLoading, dispatch }}>
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
