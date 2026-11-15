"use client";

import { DaysOfWeek } from "@/app/context";
import { SavedScheduleDiscipline } from "@/app/context/student/types";
import { HelpOutline } from "@mui/icons-material";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  capitalize,
} from "@mui/material";
import { useMemo } from "react";

type ChoosedDisciplinesKey = "code" | "classNumber" | "name" | "professor";

const choosedDisciplinesHeader: ChoosedDisciplinesKey[] = [
  "code",
  "classNumber",
  "name",
  "professor",
];
const choosedDisciplinesMap: Record<string, string> = {
  code: "Código",
  classNumber: "Turma",
  name: "Disciplina",
  professor: "Professor",
};

const daysOfWeekHeader = [
  "Horário",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function ScheduleTable({
  scheduleCombination,
}: {
  scheduleCombination: Record<string, SavedScheduleDiscipline>;
}) {
  const currentData = Object.values(scheduleCombination);
  const scheduleMap: Record<string, Record<string, string>> = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};

    currentData.forEach((course) => {
      course.schedule.forEach((sched) => {
        const time = sched.startTime;
        const day = DaysOfWeek[sched.dayOfWeek];

        if (!map[time]) map[time] = {};
        map[time][day] = course.code;
      });
    });

    return map;
  }, [currentData]);

  const timeSlots = Object.keys(scheduleMap).sort();

  return (
    <>
      <div className="overflow-x-auto">
        <Table size="small" className="mb-4">
          <TableHead>
            <TableRow>
              {daysOfWeekHeader.map((day, index) => (
                <TableCell key={index} align="center" className="font-bold">
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((time, index) => (
              <TableRow key={index}>
                <TableCell align="center" className="font-bold">
                  {time}
                </TableCell>
                {daysOfWeekHeader.slice(1).map((day, i) => (
                  <TableCell
                    key={i}
                    align="center"
                    className={scheduleMap[time][day] ? "bg-blue-100" : ""}
                  >
                    {scheduleMap[time][day] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center sticky top-0 bg-white z-10 pt-4 pb-2">
        <h3 className="text-lg font-semibold">Disciplinas Escolhidas</h3>
        <Tooltip title="Esta tabela mostra os detalhes das disciplinas incluídas na grade atual.">
          <HelpOutline fontSize="small" className="ml-2 cursor-help" />
        </Tooltip>
      </div>
      <div className="flex gap-8 w-full">
        {choosedDisciplinesHeader.map((col) => (
          <div
            key={col}
            className={`flex flex-col overflow-hidden gap-1 ${
              col === "name" || col === "professor" ? "flex-1" : "w-fit"
            }`}
          >
            <span className="font-semibold">{choosedDisciplinesMap[col]}</span>
            {Object.values(scheduleCombination).map((value, idx) => (
              <span
                key={idx}
                className={`overflow-hidden whitespace-nowrap ${
                  col === "name" || col === "professor" ? "truncate" : ""
                }`}
              >
                {col === "name" || col === "professor"
                  ? capitalize(value[col])
                  : value[col]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default ScheduleTable;
