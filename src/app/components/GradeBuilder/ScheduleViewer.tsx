import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { RequestResponse } from "@/lib/fetch-api/fetch-buildGrades";
import { capitalize } from "@/app/utils/converters";
import { HelpOutline, Close } from "@mui/icons-material";

type ScheduleViewerProps = {
  combinations: NonNullable<RequestResponse>;
  open: boolean;
  onClose: () => void;
};

type ChoosedDisciplinesKey = "code" | "classNumber" | "name" | "professor";

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

const ScheduleViewer = ({
  combinations,
  open,
  onClose,
}: ScheduleViewerProps) => {
  const [currentCombination, setCurrentCombination] = useState(0);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

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
        const time = sched.startTime;
        const day = daysOfWeekMap[sched.dayOfWeek];

        if (!map[time]) map[time] = {};
        map[time][day] = course.code;
      });
    });

    return map;
  }, [currentData]);

  const timeSlots = Object.keys(scheduleMap).sort();
  const daysOfWeek = [
    "Horário",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        style: {
          height: "100%",
          maxHeight: fullScreen ? '100%' : '540px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-bold">Grades Disponíveis</h2>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </div>
      <DialogContent className="flex-1 overflow-y-auto flex flex-col gap-4 p-6">
        <div className="flex items-center sticky top-0 bg-white z-10 pb-2">
          <h3 className="text-lg font-semibold">
            Grade {currentCombination + 1}/{Object.keys(combinations).length}
          </h3>
          <Tooltip title="Esta tabela mostra o horário das aulas para a combinação atual. Cada célula contém o código da disciplina no horário correspondente.">
            <HelpOutline fontSize="small" className="ml-2 cursor-help" />
          </Tooltip>
        </div>
        <div className="overflow-x-auto">
          <Table size="small" className="mb-4">
            <TableHead>
              <TableRow>
                {daysOfWeek.map((day, index) => (
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
                  {daysOfWeek.slice(1).map((day, i) => (
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
              <span className="font-semibold">
                {choosedDisciplinesMap[col]}
              </span>
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
      </DialogContent>
      <DialogActions className="flex !justify-between !px-4 !py-2 border-t">
        <Button
          onClick={() => navigateCombination("prev")}
          disabled={currentCombination === 0}
        >
          Anterior
        </Button>
        <Button
          onClick={() => navigateCombination("next")}
          disabled={currentCombination === Object.keys(combinations).length - 1}
        >
          Próxima
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleViewer;