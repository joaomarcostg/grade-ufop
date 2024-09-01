"use client";
import { useContext, useEffect, useState } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "@/app/context/actions";
import { getDisciplinesByCourse } from "@/lib/fetch-api/fetch-disciplines";
import { type Discipline } from "@prisma/client";

export default function ManualPicker() {
  const { state, dispatch } = useContext(StudentContext);

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  const handleDisciplineSelection = (discipline: string) => {
    dispatch({
      payload: discipline,
      type: ActionType["SELECT_COURSED_DISCIPLINE"],
    });
  };

  useEffect(() => {
    async function fetchData() {
      const disciplinesData = await getDisciplinesByCourse({
        course: state.course?.value,
        mandatoryOnly: true,
      });
      setDisciplines(disciplinesData);
    }

    fetchData();
  }, [state.course]);

  return (
    <ul className="h-[300px] w-fit overflow-auto p-4">
      {disciplines.map((disc) => (
        <div key={disc.code} className="flex flex-row justify-between gap-4">
          <li>
            {disc.code} - {disc.name}
          </li>
          <input checked={state.coursedDisciplines.includes(disc.id)} type="checkbox" onChange={() => handleDisciplineSelection(disc.id)} />
        </div>
      ))}
    </ul>
  );
}
