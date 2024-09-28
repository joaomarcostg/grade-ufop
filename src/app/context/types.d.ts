import { type AutocompleteOption } from "../components/InputAutocomplete";
import { type Discipline } from "@prisma/client";

export type AppState = {
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


export type ObjAppState = {
  course: {
    label: string;
    value: string;
  } | null;
  coursedDisciplines: Record<string, Discipline>;
  availableOptions: AutocompleteOption[];
  selectedDisciplines: {
    [slotId: string]: string[];
  };
  disciplineSlots: {
    [slotId: string]: AutocompleteOption[];
  };
  setupCompleted: boolean;
};
