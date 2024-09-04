import { User } from "@prisma/client";
import { fetchRequest } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UserWithCourseAndDisciplines = {
  course: { id: string; name: string } | null;
  completedDisciplines: { disciplineId: string }[];
};

export async function getUserCourseAndDisciplines() {
  try {
    const res = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(`${API_BASE_URL}/user/course-and-disciplines`, {
      method: "GET",
    });

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    console.error("Error fetching user course and disciplines:", error);
    return null;
  }
}

// TODO: Implement the setUserCourse function
export async function setUserCourse(courseId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/course`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ courseId }),
    });

    if (!response.ok) {
      throw new Error("Failed to update user course");
    }

    const data: User = await response.json();
    return data;
  } catch (error) {
    console.error("Error setting user course:", error);
    return null;
  }
}

export async function addCompletedDiscipline(userId: string, disciplineId: string) {
  try {
    const res = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(`${API_BASE_URL}/user/${userId}/completed-disciplines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disciplineId }),
    });

    if (!res.data) {
      throw new Error("Failed to add completed discipline");
    }

    return res.data;
  } catch (error) {
    console.error("Error adding completed discipline:", error);
    return null;
  }
}

export async function removeCompletedDiscipline(userId: string, disciplineId: string) {
  try {
    const res = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/user/${userId}/completed-disciplines/${disciplineId}`,
      { method: "DELETE" }
    );

    if (!res.data) {
      throw new Error("Failed to remove completed discipline");
    }

    return res.data;
  } catch (error) {
    console.error("Error removing completed discipline:", error);
    return null;
  }
}
