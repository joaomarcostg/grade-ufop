import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import { RequestResponse } from "@/lib/fetch-api/fetch-buildGrades";

type ScheduleViewerProps = {
  combinations: NonNullable<RequestResponse>;
};

const daysOfWeekMap: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
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
  ];

  return (
    <div className="w-full flex flex-col items-start mt-8 gap-4">
      <h3 className="font-bold text-lg">Grades Geradas</h3>
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
    </div>
  );
};

export default ScheduleViewer;
