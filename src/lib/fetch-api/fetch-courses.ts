import { fetchRequest } from './utils';
import { Course } from '@prisma/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchCourses(): Promise<Course[] | null> {
  try {
    const { data } = await fetchRequest<{ data: Course[] }>(`${API_BASE_URL}/courses`, {
      method: "GET",
    });

    if (!data) {
      throw new Error("Failed to fetch courses");
    }

    return data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return null;
  }
}