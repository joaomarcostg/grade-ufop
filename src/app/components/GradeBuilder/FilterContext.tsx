import React, { createContext, useState, useContext, ReactNode } from 'react';

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

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [dayWeight, setDayWeight] = useState<number>(1);
  const [gapWeight, setGapWeight] = useState<number>(1);

  return (
    <FilterContext.Provider value={{ 
      timeSlots, setTimeSlots, 
      days, setDays, 
      dayWeight, setDayWeight, 
      gapWeight, setGapWeight 
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};