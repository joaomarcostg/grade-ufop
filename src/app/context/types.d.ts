import { type AutocompleteOption } from "../components/InputAutocomplete";

export type InitialStateType = {
  course: {
    label: string;
    value: string;
  } | null
  coursedDisciplines: string[];
  availableOptions: AutocompleteOption[]
};

type ActionMap<M extends { [index: string]: any }> = {
    [Key in keyof M]: M[Key] extends undefined
      ? {
          type: Key;
        }
      : {
          type: Key;
          payload: M[Key];
        }
  };