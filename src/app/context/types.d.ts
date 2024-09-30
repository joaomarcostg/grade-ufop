import { type AutocompleteOption } from "../components/InputAutocomplete";
import { type Discipline } from "@prisma/client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image: string;
};

export type AppState = {
  user: UserProfile | null;
  course: {
    label: string;
    value: string;
  } | null;
  coursedDisciplines: Map<string, Discipline>;
  availableOptions: AutocompleteOption[];
  selectedDisciplines: {
    [slotId: string]: string[];
  };
  disciplineSlots: {
    [slotId: string]: AutocompleteOption[];
  };
  setupCompleted: boolean;
};

export type ObjAppState = AppState & {
  coursedDisciplines: Record<string, Discipline>;
};
