const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { type Discipline } from "@prisma/client";
import { fetchRequest } from "./utils";

type FetchGetDisciplinesByCourseResponse = {
  data: Discipline[];
};

export async function getDisciplinesByCourse({ course, mandatoryOnly }: { course?: string | null; mandatoryOnly?: boolean }) {
  try {
    if (!course) {
      return [];
    }

    let apiUrl = `${API_BASE_URL}/disciplines?courseId=${course}`;

    if (mandatoryOnly) {
      apiUrl += "&mandatory";
    }

    const res = await fetchRequest<FetchGetDisciplinesByCourseResponse>(apiUrl, {
      method: "GET",
      next: {
        revalidate: 3600,
      },
    });

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

export async function getAvailableDisciplines(filters: { timeSlots?: string[]; days?: string[]; includeOtherCourses?: boolean }) {
  try {
    const timeSlots = filters.timeSlots?.join(",") || "";
    const days = filters.days?.join(",") || "";
    const includeOtherCourses = filters.includeOtherCourses ? "true" : "";

    let queryParams = "";
    if (timeSlots) {
      queryParams += `timeSlots=${timeSlots}&`;
    }
    if (days) {
      queryParams += `days=${days}&`;
    }
    if (includeOtherCourses) {
      queryParams += `includeOtherCourses=${includeOtherCourses}`;
    }

    const res = await fetchRequest<FetchGetAvailableDisciplinesResponse>(`${API_BASE_URL}/availableDisciplines?${queryParams}`, {
      method: "GET",
      next: {
        revalidate: 3600,
      },
    });

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    console.error("Error fetching available disciplines:", error);
    return [];
  }
}
