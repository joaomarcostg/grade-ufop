import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { RequestResponse } from "@/lib/fetch-api/fetch-generateSchedules";
import { HelpOutline, Close, SaveOutlined, Check } from "@mui/icons-material";
import { saveScheduleCombination } from "@/lib/fetch-api/fetch-userData";
import {useStudent } from "@/app/context/student";
import ScheduleTable from "./ScheduleTable";

type ScheduleViewerProps = {
  combinations: NonNullable<RequestResponse>;
  open: boolean;
  onClose: () => void;
};

const ScheduleViewer = ({
  combinations,
  open,
  onClose,
}: ScheduleViewerProps) => {
  const { state } = useStudent();
  const [currentCombination, setCurrentCombination] = useState(0);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleSaveCombination = async (index: number) => {
    const disciplineClassIds = Object.keys(combinations[index]);
    await saveScheduleCombination({ disciplineClassIds });
  };

  const isCombinationSaved = useCallback(
    (index: number) => {
      const currentSemester = process.env.NEXT_PUBLIC_CURRENT_SEMESTER;
      if (!currentSemester || !state.scheduleCombinations) return false;

      const semesterSchedules = state.scheduleCombinations[currentSemester];
      if (!semesterSchedules) return false;

      const currentCombinationIds = new Set(Object.keys(combinations[index]));

      return Object.values(semesterSchedules).some((schedule) => {
        const scheduleIds = new Set(Object.keys(schedule));
        return (
          currentCombinationIds.size === scheduleIds.size &&
          [...currentCombinationIds].every((id) => scheduleIds.has(id))
        );
      });
    },
    [combinations, state.scheduleCombinations]
  );

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
          maxHeight: fullScreen ? "100%" : "800px",
          display: "flex",
          flexDirection: "column",
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
        <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">
              Grade {currentCombination + 1}/{Object.keys(combinations).length}
            </h3>
            <Tooltip title="Esta tabela mostra o horário das aulas para a combinação atual. Cada célula contém o código da disciplina no horário correspondente.">
              <HelpOutline fontSize="small" className="ml-2 cursor-help" />
            </Tooltip>
          </div>
          <Button
            endIcon={
              isCombinationSaved(currentCombination) ? (
                <Check />
              ) : (
                <SaveOutlined />
              )
            }
            onClick={() => handleSaveCombination(currentCombination)}
            disabled={isCombinationSaved(currentCombination)}
          >
            {isCombinationSaved(currentCombination)
              ? "Grade Salva"
              : "Salvar Grade"}
          </Button>
        </div>
        <ScheduleTable scheduleCombination={combinations[currentCombination]} />
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
