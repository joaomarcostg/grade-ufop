"use client";
import { Button } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "../context/reducers";
import { getDisciplinesByCourse } from "@/lib/fetch-api/fetch-disciplines";
import { type discipline } from "@prisma/client";
import { useRouter } from 'next/navigation'

export default function DisciplinePicker() {
  const { state, dispatch } = useContext(StudentContext);
  const router = useRouter()

  const [disciplines, setDisciplines] = useState<discipline[]>([]);

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
    <div className="flex flex-col gap-4 mt-8">
      <ul className="h-[300px] w-fit overflow-auto p-4">
        {disciplines.map((disc) => (
          <div key={disc.code} className="flex flex-row justify-between gap-4">
            <li>
              {disc.code} - {disc.name}
            </li>
            <input
              checked={state.coursedDisciplines.includes(disc.id)}
              type="checkbox"
              onChange={() => handleDisciplineSelection(disc.id)}
            />
          </div>
        ))}
      </ul>
      <Button onClick={() => router.push('/montar-grade')}>
        Próximo
      </Button>
    </div>
  );
}
