const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { type Discipline } from "@prisma/client";
import { fetchRequest } from "./utils";

type FetchGetDisciplinesByCourseResponse = {
  data: Discipline[] ;
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

    let apiUrl = `${API_BASE_URL}/disciplines?courseId=${course}`;

    if (mandatoryOnly) {
      apiUrl += "&mandatory";
    }

    const res = await fetchRequest<FetchGetDisciplinesByCourseResponse>(
      apiUrl,
      {
        method: "GET",
        next: {
          revalidate: 3600,
        },
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
    }[];
}[] ;
};

export async function getAvailableDisciplines({
  courseId,
  coursedDisciplines,
}: {
  courseId: string;
  coursedDisciplines: string[];
}) {
  try {
    let apiUrl = `${API_BASE_URL}/availableDisciplines`;
    const body = JSON.stringify({
      courseId,
      coursedDisciplines
    });

    const res = await fetchRequest<FetchGetAvailableDisciplinesResponse>(
      apiUrl,
      {
        method: "POST",
        body,
        next: {
          revalidate: 3600,
        },
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
