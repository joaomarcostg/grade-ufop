import CoursePicker from "@/components/CoursePicker";
import DisciplinesPicker from "@/components/DisciplinesPicker";
import { getCourses } from "@/lib/fetch-api/fetch-courses";
import Login from "./components/Login";
import { auth } from "@/lib/auth";

export default async function Home() {
  const coursesData = await getCourses();
  const session = await auth();

  const courses = coursesData.map((course) => ({
    label: course.name,
    value: course.id,
  }));

  return (
    <div className="flex  flex-col items-center justify-start p-8 pt-0 mt-16">
      <Login session={session} />
      <CoursePicker courses={courses} />
      <DisciplinesPicker />
    </div>
  );
}
