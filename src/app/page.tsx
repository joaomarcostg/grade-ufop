import { redirect } from "next/navigation";
import { getCourses } from "@/lib/fetch-api/fetch-courses";
import { auth } from "@/lib/auth";
import { Course } from "@prisma/client";
import { AutocompleteOption } from "./components/InputAutocomplete";
import HomeContent from "./components/HomeContent";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const coursesData: Course[] = await getCourses();

  const courses: AutocompleteOption[] = coursesData.map((course) => ({
    label: course.name,
    value: course.id,
  }));

  return <HomeContent session={session} courses={courses} />;
}
