const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { fetchRequest } from "./utils";
import { AutocompleteOption } from "@/app/components/InputAutocomplete";

export type SelectedDiscipline = {
  code: string;
  name: string;
  class_number: string;
  professor: string;
  schedule: {
    day_of_week: string;
    time: string;
  }[];
};

export type RequestResponse = {
  [key: string]: {
    [disciplineClassId: string]: SelectedDiscipline;
  };
} | null;

export async function getGrades({
  disciplineSlots,
}: {
  disciplineSlots: {
    [slotId: string]: AutocompleteOption[];
  };
}): Promise<RequestResponse> {
  try {
    let apiUrl = `${API_BASE_URL}/buildGrades`;
    const body = JSON.stringify(disciplineSlots);

    const res = await fetchRequest<any>(apiUrl, {
      method: "POST",
      body,
    });

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    return null;
  }
}
