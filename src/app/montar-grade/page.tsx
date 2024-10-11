import DisciplineSelector from "@/components/ScheduleBuilder/DisciplineSelector";

export default async function ScheduleBuilder() {
  return (
    <main className="flex flex-col items-center justify-start p-4 sm:p-8 pt-0 mt-16">
      <DisciplineSelector />
    </main>
  );
}
