import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Box,
  Button,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Delete, NavigateBefore, NavigateNext } from "@mui/icons-material";
import { useStudent, StudentActionType } from "@/app/context/student";
import ScheduleTable from "../ScheduleBuilder/ScheduleTable";
import { removeScheduleCombination } from "@/lib/fetch-api/fetch-userData";
import { useToast } from "@/app/context/ToastContext";

const SavedScheduleCombinations = () => {
  const { state, isLoading, dispatch } = useStudent();
  const { addToast } = useToast();
  const theme = useTheme();
  const [currentSemester, setCurrentSemester] = useState(
    process.env.NEXT_PUBLIC_CURRENT_SEMESTER ?? ""
  );
  const [currentCombination, setCurrentCombination] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const semesters = Object.keys(state.scheduleCombinations || {});
    if (semesters.length > 0) {
      setCurrentSemester(semesters[0]);
      setCurrentCombination(0);
    }
  }, [state.scheduleCombinations]);

  const handleChangeSemester = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentSemester(newValue);
    setCurrentCombination(0);
  };

  const handleDeleteSchedule = async () => {
    if (!currentSemester || !state.scheduleCombinations) return;

    try {
      const scheduleId = Object.keys(
        state.scheduleCombinations[currentSemester]
      )[currentCombination];

      await removeScheduleCombination(scheduleId);

      dispatch({
        type: StudentActionType.DELETE_SAVED_SCHEDULE,
        payload: { semester: currentSemester, scheduleId },
      });
      setDeleteDialogOpen(false);
      const lastCombination =
        Object.keys(state.scheduleCombinations[currentSemester]).length - 1;
      if (currentCombination >= lastCombination) {
        setCurrentCombination(Math.max(0, lastCombination));
      }
      addToast({
        message: "Grade removida com sucesso!",
        severity: "success",
      });
    } catch (error) {
      addToast({
        message: "Ocorreu um erro ao remover a grade",
        severity: "error",
      });
      console.error(error);
    }
  };

  const navigateCombination = (direction: "next" | "prev") => {
    if (!currentSemester || !state.scheduleCombinations) return;

    const combinationsCount = Object.keys(
      state.scheduleCombinations[currentSemester]
    ).length;
    if (direction === "next" && currentCombination < combinationsCount - 1) {
      setCurrentCombination(currentCombination + 1);
    } else if (direction === "prev" && currentCombination > 0) {
      setCurrentCombination(currentCombination - 1);
    }
  };

  const hasSavedSchedules = 
    state.scheduleCombinations && 
    Object.keys(state.scheduleCombinations).length > 0 && 
    Object.values(state.scheduleCombinations).some(semester => Object.keys(semester).length > 0);

  const combinationsCount = Object.keys(
    state.scheduleCombinations[currentSemester ?? ""] || {}
  ).length;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
        <Typography variant="h6" style={{ marginLeft: "16px" }}>
          Carregando dados...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Grades Salvas</h2>
      {!hasSavedSchedules ? (
        <Typography variant="body1">
          Não há grades salvas no momento.
        </Typography>
      ) : (
        <>
          <Tabs
            value={currentSemester}
            onChange={handleChangeSemester}
            variant="scrollable"
            scrollButtons="auto"
            className="mb-4"
            textColor="inherit"
            TabIndicatorProps={{
              style: {
                backgroundColor: theme.palette.primary.main,
                height: "3px",
              },
            }}
          >
            {Object.keys(state.scheduleCombinations || {}).map((semester) => (
              <Tab key={semester} label={semester} value={semester} />
            ))}
          </Tabs>
          {combinationsCount === 0 ? (
            <Typography variant="body1">
              Não há grades salvas para este semestre.
            </Typography>
          ) : (
            state.scheduleCombinations[currentSemester] &&
            Object.values(state.scheduleCombinations[currentSemester])[
              currentCombination
            ] && (
              <div className="flex flex-col justify-between">
                <div className="flex flex-col h-[520px] overflow-y-auto">
                  <div className="flex justify-between items-center w-full max-w-4xl mb-4">
                    <div className="text-lg font-semibold">
                      Tabela {currentCombination + 1}/{combinationsCount}
                    </div>
                    <Button
                      startIcon={<Delete />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Excluir Grade
                    </Button>
                  </div>
                  <Box className="mb-4 max-w-4xl w-full overflow-x-auto">
                    <ScheduleTable
                      scheduleCombination={
                        Object.values(
                          state.scheduleCombinations[currentSemester]
                        )[currentCombination]
                      }
                    />
                  </Box>
                </div>

                <div className="flex justify-between items-center w-full max-w-4xl">
                  <Button
                    startIcon={<NavigateBefore />}
                    onClick={() => navigateCombination("prev")}
                    disabled={currentCombination === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    endIcon={<NavigateNext />}
                    onClick={() => navigateCombination("next")}
                    disabled={currentCombination === combinationsCount - 1}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )
          )}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja excluir esta grade? Esta ação não pode
                ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleDeleteSchedule}>
                Excluir
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default SavedScheduleCombinations;