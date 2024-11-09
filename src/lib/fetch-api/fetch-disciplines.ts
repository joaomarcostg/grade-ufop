const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { type Discipline } from "@prisma/client";
import { fetchRequest } from "./utils";
import { TimeRange } from "@/app/context/filter/types";

interface FetchedDiscipline extends Discipline {
  period: number | null;
  classes: {
    id: string;
    classNumber: string | null;
    professor: string | null;
    schedules: {
      dayOfWeek: string | null;
      startTime: string | null;
      endTime: string | null;
      classType: string | null;
    }[];
  }[];
}

type FetchGetDisciplinesByCourseResponse = {
  data: FetchedDiscipline[];
};

export async function getDisciplinesByCourse({
  course,
  mandatoryOnly,
}: {
  course?: string | null;
  mandatoryOnly?: boolean;
}) {
  try {
    if (!course) {
      return [];
    }

    let apiUrl = `${API_BASE_URL}/disciplineCourses?courseId=${course}`;

    if (mandatoryOnly) {
      apiUrl += "&mandatory";
    }

    const res = await fetchRequest<FetchGetDisciplinesByCourseResponse>(
      apiUrl,
      {
        method: "GET",
      }
    );

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    return [];
  }
}

type FetchGetAvailableDisciplinesResponse = {
  data: {
    id: string;
    code: string | null;
    name: string | null;
    isEnabled: boolean;
    period: number | null;
    classes: {
      id: string;
      classNumber: string | null;
      professor: string | null;
      schedules: {
        dayOfWeek: string | null;
        startTime: string | null;
        endTime: string | null;
        classType: string | null;
      }[];
    }[];
    courseId: string;
  }[];
};

export type DisciplineFilters = {
  timeRanges?: TimeRange[];
  selectedDays?: string[];
  includeElective: boolean;
  ignorePrerequisite: boolean;
};

export async function getAvailableDisciplines(filters: DisciplineFilters) {
  try {
    const timeSlots = filters.timeRanges?.map((range) => `${range.start}-${range.end}`).join(",") || "";
    const days = filters.selectedDays?.join(",") || "";
    const includeElective = filters.includeElective ? "true" : "";
    const ignorePrerequisite = filters.ignorePrerequisite ? "true" : "";

    const queryParamsArray = [];
    if (timeSlots) {
      queryParamsArray.push(`timeSlots=${timeSlots}`);
    }
    if (days) {
      queryParamsArray.push(`days=${days}`);
    }
    if (includeElective) {
      queryParamsArray.push("includeElective=true");
    }
    if (ignorePrerequisite) {
      queryParamsArray.push("ignorePrerequisite=true");
    }

    const queryParams = queryParamsArray.join("&");

    const res = await fetchRequest<FetchGetAvailableDisciplinesResponse>(
      `${API_BASE_URL}/availableDisciplines?${queryParams}`,
      {
        method: "GET",
      }
    );

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    console.error("Error fetching available disciplines:", error);
    return [];
  }
}
