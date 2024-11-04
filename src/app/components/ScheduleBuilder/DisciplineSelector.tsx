"use client";
import React, { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Button,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Add, Create, Visibility, HelpOutline } from "@mui/icons-material";
import { type AutocompleteOption } from "@/components/InputAutocomplete";
import { useStudent, useFilter, StudentActionType } from "@/app/context";
import { getAvailableDisciplines } from "@/lib/fetch-api/fetch-disciplines";
import DisciplinesSlot from "./DisciplinesSlot";
import { capitalize } from "@/app/utils/converters";
import {
  RequestResponse,
  getGrades,
} from "@/lib/fetch-api/fetch-generateSchedules";
import ScheduleViewer from "./ScheduleViewer";
import { FilterSection } from "./FilterSection";
import { useToast } from "@/app/context/ToastContext";
import { useSmallScreen } from "@/app/hooks/useSmallScreen";

export default function DisciplinesSelector() {
  const router = useRouter();
  const { state, dispatch } = useStudent();
  const {
    state: {
      timeSlots,
      days,
      includeElective,
      ignorePrerequisite,
      dayWeight,
      gapWeight,
    },
  } = useFilter();
  const { addToast } = useToast();
  const { isSmallScreen } = useSmallScreen();
  const [focused, setFocus] = useState<string>("");
  const [results, setResults] = useState<RequestResponse>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [generateDisabled, setGenerateDisabled] = useState(true);
  const [slotsAdditionDisabled, setSlotsAdditionDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!state.setup.completed) {
      router.push("/");
    }
  }, [state.setup.completed, router]);

  useEffect(() => {
    if (Object.keys(state.disciplineSlots).length >= 8) {
      setSlotsAdditionDisabled(true);
    } else {
      setSlotsAdditionDisabled(false);
    }
  }, [state.disciplineSlots]);

  const steps = [
    {
      label: "Filtre (Opcional)",
      description: "Refine suas opções de disciplinas",
    },
    {
      label: "Adicione Disciplinas",
      description: "Selecione as disciplinas desejadas",
    },
    { label: "Gere Grades", description: "Crie combinações de horários" },
  ];

  const fetchAvailableDisciplines = useCallback(async () => {
    if (!state.course?.value) return;
    try {
      const disciplines = await getAvailableDisciplines({
        timeSlots,
        days,
        includeElective,
        ignorePrerequisite,
      });
      const autocompleteOptions = disciplines.reduce<
        NonNullable<AutocompleteOption[]>
      >((acc, discipline) => {
        discipline.classes.forEach((classItem) => {
          acc.push({
            index: acc.length,
            value: classItem.id,
            label: `${discipline.code} - ${capitalize(discipline.name)} - T${
              classItem.classNumber
            } ${capitalize(classItem.professor)}`,
            professor: capitalize(classItem.professor),
            disciplineId: discipline.id,
            disabled: !discipline.isEnabled,
          });
        });
        return acc;
      }, []);
      dispatch({
        type: StudentActionType["SET_AVAILABLE_OPTIONS"],
        payload: autocompleteOptions,
      });
    } catch (error) {
      console.error("Error fetching available disciplines:", error);
      addToast({
        message:
          "Erro ao carregar disciplinas disponíveis. Por favor, tente novamente.",
        severity: "error",
      });
    }
  }, [
    state.course?.value,
    timeSlots,
    days,
    includeElective,
    ignorePrerequisite,
    dispatch,
    addToast,
  ]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchAvailableDisciplines();
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchAvailableDisciplines();
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchAvailableDisciplines]);

  useEffect(() => {
    const slots = Object.values(state.disciplineSlots);
    setGenerateDisabled(slots.length === 0);
  }, [state.disciplineSlots]);

  const addDisciplinesSlot = useCallback(() => {
    const slotId = uuid();
    dispatch({
      type: StudentActionType.CREATE_DISCIPLINES_SLOT,
      payload: { slotId },
    });
    setFocus(slotId);
  }, [dispatch]);

  const removeDisciplinesSlot = (id: string) => {
    Object.values(state.disciplineSlots[id]).forEach((discipline) => {
      dispatch({
        type: StudentActionType.REMOVE_FROM_SELECTED_DISCIPLINES,
        payload: {
          slotId: id,
          disciplineId: discipline?.disciplineId ?? "",
        },
      });
    });
    dispatch({
      type: StudentActionType.DELETE_DISCIPLINES_SLOT,
      payload: { slotId: id },
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Object.entries(state.disciplineSlots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    dispatch({
      type: StudentActionType.SET_DISCIPLINES_SLOT,
      payload: Object.fromEntries(items),
    });
  };

  async function generateSchedules() {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const validSlots = Object.entries(state.disciplineSlots).filter(
        ([_, disciplines]) => disciplines.length > 0
      );

      const disciplineSlots = Object.fromEntries(validSlots);

      const data = await getGrades({
        disciplineSlots,
        dayWeight,
        gapWeight,
      });
      setResults(data);
      setResultsDialogOpen(true);
    } catch (error) {
      console.error("Error generating schedules:", error);
      addToast({
        message: "Erro ao gerar grades. Por favor, tente novamente.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!state.setup.completed) {
    return <></>;
  }

  return (
    <div className="flex flex-col w-full max-w-[800px] space-y-4 sm:space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 sm:p-8 rounded-lg flex gap-3 sm:gap-4 flex-col items-center">
            <CircularProgress size={isSmallScreen ? 48 : 60} />
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              className="mt-2 sm:mt-4"
            >
              Gerando grades
            </Typography>
          </div>
        </div>
      )}

      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
        <Stepper
          activeStep={-1}
          orientation={isSmallScreen ? "vertical" : "horizontal"}
          alternativeLabel={!isSmallScreen}
          connector={isSmallScreen ? <></> : undefined}
          className={isSmallScreen ? "gap-2" : ""}
        >
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography
                  variant="body2"
                  className={`${isSmallScreen ? "text-sm font-medium" : ""}`}
                >
                  {step.label}
                </Typography>
                <Typography
                  variant="caption"
                  className={`text-gray-600 ${
                    isSmallScreen ? "text-xs block mt-0.5" : ""
                  }`}
                >
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </div>

      <FilterSection />

      <div className="py-3 sm:py-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Slots de Disciplinas</h2>
          <Tooltip title="Os slots representam diferentes opções de disciplinas para o mesmo horário. Arraste os slots para reordená-los por prioridade e adicione múltiplas disciplinas em cada slot para criar combinações.">
            <HelpOutline className="ml-2 cursor-help text-base sm:text-xl" />
          </Tooltip>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="options">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4 sm:space-y-8"
              >
                {Object.entries(state.disciplineSlots).map(
                  ([key, _], index) => (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(provided) => (
                        <DisciplinesSlot
                          provided={provided}
                          removeAction={() => removeDisciplinesSlot(key)}
                          isFocused={focused === key}
                          changeFocus={() => setFocus(key)}
                          slotId={key}
                        />
                      )}
                    </Draggable>
                  )
                )}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-4 justify-center">
          <div className="flex-1 border" />
          <Tooltip title="Adicione um novo slot para incluir mais opções de disciplinas">
            <span>
              <Button
                variant="text"
                onClick={addDisciplinesSlot}
                startIcon={<Add className="text-base sm:text-xl" />}
                disabled={slotsAdditionDisabled}
                size={isSmallScreen ? "small" : "medium"}
                className="text-sm sm:text-base"
              >
                Adicionar Slot
              </Button>
            </span>
          </Tooltip>
          <div className="flex-1 border" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <Tooltip title="Gerar novas combinações de grade com base nas seleções atuais">
          <span>
            <Button
              disabled={generateDisabled}
              variant="contained"
              onClick={generateSchedules}
              startIcon={<Create className="text-base sm:text-xl" />}
              size={isSmallScreen ? "small" : "medium"}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Gerar Grades
            </Button>
          </span>
        </Tooltip>

        {results && (
          <Tooltip title="Visualizar as combinações de grade geradas">
            <Button
              variant="outlined"
              onClick={() => setResultsDialogOpen(true)}
              startIcon={<Visibility className="text-base sm:text-xl" />}
              size={isSmallScreen ? "small" : "medium"}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Exibir Resultados
            </Button>
          </Tooltip>
        )}
      </div>

      {results && (
        <ScheduleViewer
          combinations={results}
          open={resultsDialogOpen}
          onClose={() => setResultsDialogOpen(false)}
        />
      )}
    </div>
  );
}
