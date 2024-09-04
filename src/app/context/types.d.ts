import { type AutocompleteOption } from "../components/InputAutocomplete";

export type AppState = {
  course: {
    label: string;
    value: string;
  } | null;
  coursedDisciplines: string[];
  availableOptions: AutocompleteOption[];
  selectedDisciplines: {
    [slotId: string]: string[];
  };
  disciplineSlots: {
    [slotId: string]: AutocompleteOption[];
  };
  setupCompleted: boolean;
};
