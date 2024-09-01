import { User, Discipline } from "@prisma/client";
import { fetchRequest } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UserWithCourseAndDisciplines = User & {
  course: { id: string; name: string } | null;
  completedDisciplines: { discipline: Discipline }[];
};

export async function getUserCourseAndDisciplines(userId: string) {
  try {
    const res = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/users/${userId}/course-and-disciplines`,
      { method: "GET", cache: "no-store" }
    );

    if (!res.data) {
      throw new Error("Failed to fetch data");
    }

    return res.data;
  } catch (error) {
    console.error("Error fetching user course and disciplines:", error);
    return null;
  }
}

export async function setUserCourse(courseId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/course`, {
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
    const res = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/users/${userId}/completed-disciplines`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplineId }),
      }
    );

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
      `${API_BASE_URL}/users/${userId}/completed-disciplines/${disciplineId}`,
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