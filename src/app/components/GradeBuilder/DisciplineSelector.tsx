"use client";
import React, { useContext, useEffect, useCallback, useState } from "react";
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
} from "@mui/material";
import { Add, Create, Visibility, HelpOutline } from "@mui/icons-material";
import { type AutocompleteOption } from "@/components/InputAutocomplete";
import { StudentContext } from "@/app/context/StudentContext";
import { getAvailableDisciplines } from "@/lib/fetch-api/fetch-disciplines";
import { ActionType } from "@/app/context/actions";
import DisciplinesSlot from "./DisciplinesSlot";
import { capitalize } from "@/app/utils/converters";
import { RequestResponse, getGrades } from "@/lib/fetch-api/fetch-buildGrades";
import ScheduleViewer from "./ScheduleViewer";
import { FilterProvider, useFilter } from "./FilterContext";
import { FilterSection } from "./FilterSection";

function DisciplinesSelectorContent() {
  const { state, dispatch } = useContext(StudentContext);
  const { timeSlots, days, dayWeight, gapWeight } = useFilter();

  const [focused, setFocus] = useState<string>("");
  const [results, setResults] = useState<RequestResponse>(null);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [generateDisabled, setGenerateDisabled] = useState(true);
  const [slotsAdditionDisabled, setSlotsAdditionDisabled] = useState(false);

  useEffect(() => {
    console.log(Object.keys(state.disciplineSlots));
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

  useEffect(() => {
    async function fetchRequest() {
      if (!state.course?.value) return;
      const disciplines = await getAvailableDisciplines({ timeSlots, days });
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
        type: ActionType["SET_AVAILABLE_OPTIONS"],
        payload: autocompleteOptions,
      });
    }
    fetchRequest();
  }, [
    dispatch,
    state.course?.value,
    state.coursedDisciplines,
    timeSlots,
    days,
  ]);

  useEffect(() => {
    const slots = Object.values(state.disciplineSlots);
    setGenerateDisabled(slots.length === 0);
  }, [state.disciplineSlots]);

  const addDisciplinesSlot = useCallback(() => {
    const slotId = uuid();
    dispatch({
      type: ActionType.CREATE_DISCIPLINES_SLOT,
      payload: { slotId },
    });
    setFocus(slotId);
  }, [dispatch]);

  const removeDisciplinesSlot = (id: string) => {
    Object.values(state.disciplineSlots[id]).forEach((discipline) => {
      dispatch({
        type: ActionType.REMOVE_FROM_SELECTED_DISCIPLINES,
        payload: {
          slotId: id,
          disciplineId: discipline?.disciplineId ?? "",
        },
      });
    });
    dispatch({
      type: ActionType.DELETE_DISCIPLINES_SLOT,
      payload: { slotId: id },
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Object.entries(state.disciplineSlots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    dispatch({
      type: ActionType.SET_DISCIPLINES_SLOT,
      payload: Object.fromEntries(items),
    });
  };

  async function buildGrades() {
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
  }

  return (
    <div className="flex flex-col w-full max-w-[800px] space-y-6">
      <div className="bg-gray-100 p-4 rounded-lg">
        <Stepper activeStep={-1} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="body2">{step.label}</Typography>
                <Typography variant="caption" className="text-gray-600">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </div>

      <FilterSection />

      <div className="py-6">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold">Slots de Disciplinas</h2>
          <Tooltip title="Os slots representam diferentes opções de disciplinas para o mesmo horário. Arraste os slots para reordená-los por prioridade e adicione múltiplas disciplinas em cada slot para criar combinações.">
            <HelpOutline className="ml-2 cursor-help" />
          </Tooltip>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="options">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-8"
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
        <div className="mt-4 flex items-center gap-4 justify-center">
          <div className="flex-1 border" />
          <Tooltip title="Adicione um novo slot para incluir mais opções de disciplinas">
            <Button
              variant="text"
              onClick={addDisciplinesSlot}
              startIcon={<Add />}
              disabled={slotsAdditionDisabled}
            >
              Adicionar Slot
            </Button>
          </Tooltip>
          <div className="flex-1 border" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Tooltip title="Gerar novas combinações de grade com base nas seleções atuais">
          <span>
            <Button
              disabled={generateDisabled}
              variant="contained"
              onClick={() => {
                buildGrades();
              }}
              startIcon={<Create />}
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
              startIcon={<Visibility />}
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

export default function DisciplinesSelector() {
  return (
    <FilterProvider>
      <DisciplinesSelectorContent />
    </FilterProvider>
  );
}
