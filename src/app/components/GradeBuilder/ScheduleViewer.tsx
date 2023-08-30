import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Divider,
} from "@mui/material";
import { RequestResponse } from "@/lib/fetch-api/fetch-buildGrades";
import { capitalize } from "@/app/utils/converters";

type ScheduleViewerProps = {
  combinations: NonNullable<RequestResponse>;
};

type ChoosedDisciplinesKey = "code" | "class_number" | "name" | "professor";

const daysOfWeekMap: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
};

const choosedDisciplinesHeader: ChoosedDisciplinesKey[] = [
  "code",
  "class_number",
  "name",
  "professor",
];
const choosedDisciplinesMap: Record<string, string> = {
  code: "Código",
  class_number: "Turma",
  name: "Disciplina",
  professor: "Professor",
};

const ScheduleViewer = ({ combinations }: ScheduleViewerProps) => {
  const [currentCombination, setCurrentCombination] = useState(0);

  const navigateCombination = (direction: "next" | "prev") => {
    if (direction === "prev" && currentCombination > 0) {
      setCurrentCombination(currentCombination - 1);
    }

    if (
      direction === "next" &&
      currentCombination < Object.keys(combinations).length - 1
    ) {
      setCurrentCombination(currentCombination + 1);
    }
  };

  const currentData = Object.values(combinations[currentCombination] || {});
  const scheduleMap: Record<string, Record<string, string>> = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};

    currentData.forEach((course) => {
      course.schedule.forEach((sched) => {
        const time = sched.time;
        const day = daysOfWeekMap[sched.day_of_week];

        if (!map[time]) map[time] = {};
        map[time][day] = course.code;
      });
    });

    return map;
  }, [currentData]);

  const timeSlots = Object.keys(scheduleMap).sort();
  const daysOfWeek = [
    "Horários",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  return (
    <div className="w-full flex flex-col items-center mt-12 gap-4">
      <h4 className="font-bold text-xl text-primary">Grades Disponíveis</h4>
      <Table>
        <TableHead>
          <TableRow>
            {daysOfWeek.map((day, index) => (
              <TableCell key={index}>{day}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {timeSlots.map((time, index) => (
            <TableRow key={index}>
              <TableCell>{time}</TableCell>
              {daysOfWeek.slice(1).map((day, i) => (
                <TableCell key={i}>{scheduleMap[time][day] || "-"}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between w-full">
        <Button
          disabled={currentCombination === 0}
          onClick={() => navigateCombination("prev")}
        >
          Anterior
        </Button>
        <Button
          disabled={currentCombination === Object.keys(combinations).length - 1}
          onClick={() => navigateCombination("next")}
        >
          Próxima
        </Button>
      </div>

      <div className="flex-col w-full mt-8">
        <h5 className="text-lg font-bold self-start mb-4">
          Disciplinas Escolhidas
        </h5>
        <div className="flex gap-8 w-full">
          {choosedDisciplinesHeader.map((col) => (
            <div
              key={col}
              className={`flex flex-col overflow-hidden gap-1 ${
                col === "name" || col === "professor" ? "flex-1" : "w-fit"
              }`}
            >
              <span className="font-bold">{choosedDisciplinesMap[col]}</span>
              {Object.values(combinations[currentCombination]).map(
                (value, idx) => (
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
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewer;
