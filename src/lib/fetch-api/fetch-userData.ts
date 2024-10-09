import { Discipline, User } from "@prisma/client";
import { fetchRequest } from "./utils";
import { UserData } from "@/app/context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UserWithCourseAndDisciplines = {
  course: { id: string; name: string } | null;
  completedDisciplines: Discipline[];
};

export async function getUserCourseAndDisciplines() {
  try {
    const { data } = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/user/course-and-disciplines`,
      {
        method: "GET",
      }
    );

    if (!data) {
      throw new Error("Failed to fetch data");
    }

    return data;
  } catch (error) {
    console.error("Error fetching user course and disciplines:", error);
    return null;
  }
}

export async function getUserData(): Promise<UserData | null> {
  try {
    const { data } = await fetchRequest<{ data: UserData }>(
      `${API_BASE_URL}/user`,
      {
        method: "GET",
      }
    );

    if (!data) {
      throw new Error("Failed to fetch user profile");
    }

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function setUserCourse(courseId: string) {
  try {
    const body = JSON.stringify({ courseId });

    const { data } = await fetchRequest<{ data: User }>(
      `${API_BASE_URL}/user/course`,
      {
        method: "POST",
        body,
      }
    );

    if (!data) {
      throw new Error("Failed to update user course");
    }

    return data;
  } catch (error) {
    console.error("Error setting user course:", error);
    return null;
  }
}

export async function updateCoursedDisciplines(disciplineIds: string[]) {
  try {
    const res = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/user/coursedDisciplines`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplineIds }),
      }
    );

    if (!res.data) {
      throw new Error("Failed to update coursed disciplines");
    }

    return res.data;
  } catch (error) {
    console.error("Error updating coursed disciplines:", error);
    return null;
  }
}

export async function addCompletedDiscipline(disciplineId: string) {
  try {
    const { data } = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/user/coursedDisciplines`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplineId }),
      }
    );

    if (!data) {
      throw new Error("Failed to add completed discipline");
    }

    return data;
  } catch (error) {
    console.error("Error adding completed discipline:", error);
    return null;
  }
}

export async function removeCompletedDiscipline(disciplineId: string) {
  try {
    const { data } = await fetchRequest<{ data: UserWithCourseAndDisciplines }>(
      `${API_BASE_URL}/user/coursedDisciplines/${disciplineId}`,
      {
        method: "DELETE",
      }
    );

    if (!data) {
      throw new Error("Failed to remove completed discipline");
    }

    return data;
  } catch (error) {
    console.error("Error removing completed discipline:", error);
    return null;
  }
}