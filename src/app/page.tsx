import CoursePicker from "@/components/CoursePicker";
import DisciplinesPicker from "@/components/DisciplinesPicker";
import { getCourses } from "@/lib/fetch-api/fetch-courses";

export default async function Home() {
  const coursesData = await getCourses();

  const courses = coursesData.map((course) => ({
    label: course.name,
    value: course.id,
  }));

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 pt-0 mt-16">
      <header className="flex fixed top-0 h-16 p-4 text-lg font-bold">
        GradeUFOP
      </header>
      <CoursePicker courses={courses} />
      <DisciplinesPicker />
    </main>
  );
}
