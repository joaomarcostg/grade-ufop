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
    <div className="flex  flex-col items-center justify-start p-8 pt-0 mt-16">
     
      <CoursePicker courses={courses} />
      <DisciplinesPicker />
    </div>
  );
}
