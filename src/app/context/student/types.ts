import { type AutocompleteOption } from "@/components/InputAutocomplete";
import { Schedule, type Discipline } from "@prisma/client";

export type DayOfWeek = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB";

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

type ScheduleCombination = {
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
