const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { type course } from "@prisma/client";
import { fetchRequest } from "./utils";

type FetchGetCoursesResponse = {
  data: course[];
};

export async function getCourses() {
  try {
    const res = await fetchRequest<FetchGetCoursesResponse>(
      `${API_BASE_URL}/courses`,
      { method: "GET", next: { revalidate: 3600 } }
    );

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    return [];
  }
}
