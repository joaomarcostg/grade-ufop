import { type AutocompleteOption } from "@/components/InputAutocomplete";
import { type Discipline } from "@prisma/client";
import { DayOfWeek } from "../filter/types";

export type SavedScheduleDiscipline = {
  code: string;
  name: string;
  classNumber: string;
  professor: string;
  schedule: {
    dayOfWeek: DayOfWeek;
    startTime: string;
  }[];
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string;
}

export type ScheduleCombination = {
  [scheduleId: string]: {
    [disciplineClassId: string]: SavedScheduleDiscipline;
  };
};

export type UserScheduleCombinations = {
  [semester: string]: ScheduleCombination;
};

export interface UserData extends UserProfile {
  course: AutocompleteOption | null;
  coursedDisciplines: Discipline[];
  scheduleCombinations: UserScheduleCombinations;
}

export interface StudentState {
  user: UserProfile | null;
  course: AutocompleteOption | null;
  courses: AutocompleteOption[];
  coursedDisciplines: Map<string, Discipline>;
  availableDisciplineOptions: AutocompleteOption[];
  selectedDisciplines: {
    [slotId: string]: string[];
  };
  disciplineSlots: {
    [slotId: string]: AutocompleteOption[];
  };
  scheduleCombinations: UserScheduleCombinations;
  setup: {
    step: number;
    completed: boolean;
  };
}
