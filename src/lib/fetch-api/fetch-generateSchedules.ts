const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { fetchRequest } from "./utils";
import { AutocompleteOption } from "@/app/components/InputAutocomplete";

export type DayOfWeek = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB";

export type SelectedDiscipline = {
  code: string;
  name: string;
  classNumber: string;
  professor: string;
  schedule: {
    dayOfWeek: DayOfWeek;
    startTime: string;
  }[];
};

export type RequestResponse = {
  [key: string]: {
    [disciplineClassId: string]: SelectedDiscipline;
  };
} | null;

export async function getGrades({
  disciplineSlots,
  dayWeight = 1,
  gapWeight = 1,
}: {
  disciplineSlots: {
    [slotId: string]: AutocompleteOption[];
  };
  dayWeight?: number;
  gapWeight?: number;
}): Promise<RequestResponse> {
  try {
    let apiUrl = `${API_BASE_URL}/generateSchedules`;
    const body = JSON.stringify({ disciplineSlots, dayWeight, gapWeight });

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
