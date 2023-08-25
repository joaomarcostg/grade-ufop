import DisciplineSelector from "@/components/GradeBuilder/DisciplineSelector";

export default async function GradeBuilder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 pt-0 mt-16">
      <DisciplineSelector />
    </main>
  );
}
