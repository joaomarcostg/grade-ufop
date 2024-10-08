// context/AppProvider.tsx
import React from "react";
import { StudentProvider } from "./student/StudentContext";
import { FilterProvider } from "./filter/FilterContext";

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <StudentProvider>
      <FilterProvider>{children}</FilterProvider>
    </StudentProvider>
  );
};
