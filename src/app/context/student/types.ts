import { type AutocompleteOption } from "@/components/InputAutocomplete";
import { type Discipline } from "@prisma/client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string;
};

export type StudentState = {
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
  setupCompleted: boolean;
};