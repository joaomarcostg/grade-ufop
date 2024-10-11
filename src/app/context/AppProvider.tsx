// context/AppProvider.tsx
import React from "react";
import { StudentProvider } from "./student/StudentContext";
import { FilterProvider } from "./filter/FilterContext";
import { ToastProvider } from "./ToastContext";

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ToastProvider>
      <StudentProvider>
        <FilterProvider>{children}</FilterProvider>
      </StudentProvider>
    </ToastProvider>
  );
};
