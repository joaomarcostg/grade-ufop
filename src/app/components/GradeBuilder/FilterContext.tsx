import React, { createContext, useState, useContext, ReactNode } from "react";

export const TIME_SLOTS = [
  "07:30-09:10",
  "09:20-11:00",
  "11:10-12:50",
  "13:30-15:10",
  "15:20-17:00",
  "17:10-19:00",
  "19:00-20:40",
  "21:00-22:40",
];

export const DAYS_OF_WEEK = [
  { label: "Segunda", value: "SEG" },
  { label: "Terça", value: "TER" },
  { label: "Quarta", value: "QUA" },
  { label: "Quinta", value: "QUI" },
  { label: "Sexta", value: "SEX" },
];

type FilterContextType = {
  timeSlots: string[];
  setTimeSlots: React.Dispatch<React.SetStateAction<string[]>>;
  days: string[];
  setDays: React.Dispatch<React.SetStateAction<string[]>>;
  dayWeight: number;
  setDayWeight: React.Dispatch<React.SetStateAction<number>>;
  gapWeight: number;
  setGapWeight: React.Dispatch<React.SetStateAction<number>>;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [timeSlots, setTimeSlots] = useState<string[]>(TIME_SLOTS);
  const [days, setDays] = useState<string[]>(DAYS_OF_WEEK.map((day) => day.value));
  const [dayWeight, setDayWeight] = useState<number>(1);
  const [gapWeight, setGapWeight] = useState<number>(1);

  return (
    <FilterContext.Provider
      value={{
        timeSlots,
        setTimeSlots,
        days,
        setDays,
        dayWeight,
        setDayWeight,
        gapWeight,
        setGapWeight,
      }}
    >
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
