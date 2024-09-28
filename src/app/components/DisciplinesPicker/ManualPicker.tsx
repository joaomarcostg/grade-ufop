"use client";
import { useContext, useEffect, useState } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "@/app/context/actions";
import { getDisciplinesByCourse } from "@/lib/fetch-api/fetch-disciplines";
import { type Discipline } from "@prisma/client";
import { Tooltip } from "@mui/material";

type DisciplinesByPeriod = {
  [key: number]: Discipline[];
};

export default function ManualPicker() {
  const { state, dispatch } = useContext(StudentContext);
  const [disciplinesByPeriod, setDisciplinesByPeriod] = useState<DisciplinesByPeriod>({});
  const [maxPeriod, setMaxPeriod] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  console.log("scd", state.coursedDisciplines)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const disciplinesData = await getDisciplinesByCourse({
          course: state.course?.value,
          mandatoryOnly: true,
        });
  
        const groupedDisciplines: DisciplinesByPeriod = {};
        let max = 0;
  
        disciplinesData.forEach((discipline) => {
          const period = discipline.period || 0;
          if (!groupedDisciplines[period]) {
            groupedDisciplines[period] = [];
          }
          groupedDisciplines[period].push(discipline);
          max = Math.max(max, period);
        });
  
        setDisciplinesByPeriod(groupedDisciplines);
        setMaxPeriod(max);
      } catch (error) {
        console.error("Error fetching disciplines:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [state.course]);

  const handleDisciplineSelection = (discipline: Discipline) => {
    console.log("discipline", discipline)
    dispatch({
      payload: discipline,
      type: ActionType.SELECT_COURSED_DISCIPLINE,
    });
  };

  const handlePeriodSelection = (period: number) => {
    const disciplinesInPeriod = disciplinesByPeriod[period] || [];
    const allSelected = disciplinesInPeriod.every((d) => state.coursedDisciplines.has(d.id));

    disciplinesInPeriod.forEach((discipline) => {
      if (allSelected && state.coursedDisciplines.has(discipline.id)) {
        handleDisciplineSelection(discipline);
      } else if (!allSelected && !state.coursedDisciplines.has(discipline.id)) {
        handleDisciplineSelection(discipline);
      }
    });
  };

  if(isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            {Array.from({ length: maxPeriod + 1 }, (_, i) => (
              <th 
                key={i} 
                className="border p-2 cursor-pointer hover:bg-red-100 transition-colors duration-200 w-20"
                onClick={() => handlePeriodSelection(i)}
              >
                <div className="flex items-center justify-center">
                  <span>{i === 0 ? "Período" : `${i}º`}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.max(...Object.values(disciplinesByPeriod).map((d) => d.length)) }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: maxPeriod + 1 }, (_, colIndex) => {
                const discipline = disciplinesByPeriod[colIndex]?.[rowIndex];
                const isSelected = discipline && state.coursedDisciplines.has(discipline.id);
                return (
                  <td 
                    key={colIndex} 
                    className={`border p-2 transition-colors cursor-pointer duration-200 ${
                      isSelected ? 'bg-red-200' : colIndex !== 0 && 'hover:bg-red-100'
                    }`}
                    onClick={() => discipline && handleDisciplineSelection(discipline)}
                  >
                    {discipline && (
                      <Tooltip title={discipline.name || ''}>
                        <div className="flex items-center">
                          <span className="truncate">{discipline.code}</span>
                        </div>
                      </Tooltip>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}