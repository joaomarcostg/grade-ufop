import DisciplineSelector from "@/components/ScheduleBuilder/DisciplineSelector";

export default async function ScheduleBuilder() {
  return (
    <div className="flex flex-col items-center justify-start p-2 sm:p-8">
      <DisciplineSelector />
    </div>
  );
}
