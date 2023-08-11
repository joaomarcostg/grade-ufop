const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { type discipline } from "@prisma/client";
import { fetchRequest } from "./utils";

type FetchGetDisciplinesByCourseResponse = {
  data: discipline[];
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
      { method: "GET", next: {
        revalidate: 3600
      } }
    );

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    return [];
  }
}
