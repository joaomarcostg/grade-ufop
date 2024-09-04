"use client";
import React, { useState, useContext, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@mui/material";
import { type AutocompleteOption } from "@/components/InputAutocomplete"; // Import your Autocomplete component
import { StudentContext } from "@/app/context/StudentContext";
import { getAvailableDisciplines } from "@/lib/fetch-api/fetch-disciplines";
import { ActionType } from "@/app/context/actions";
import DisciplinesSlot from "./DisciplinesSlot";
import { capitalize } from "@/app/utils/converters";
import { RequestResponse, getGrades } from "@/lib/fetch-api/fetch-buildGrades";
import ScheduleViewer from "./ScheduleViewer";

function DisciplinesSelector() {
  const { state, dispatch } = useContext(StudentContext);

  const [focused, setFocus] = useState<string>("");
  const [showDnd, setShowDnd] = useState(true);
  const [grids, setGrids] = useState<RequestResponse>(null);
  const [generateDisabled, setGenerateDisabled] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      if(!state.course?.value) return;

      const disciplines = await getAvailableDisciplines({
        coursedDisciplines: state.coursedDisciplines,
        courseId: state.course?.value ?? "",
      });

      const autocompleteOptions = disciplines.reduce<NonNullable<AutocompleteOption>[]>((acc, discipline) => {
        discipline.classes.forEach((classItem) => {
          acc.push({
            index: acc.length,
            value: classItem.id,
            label: `${discipline.code} - ${capitalize(discipline.name)} - T${classItem.classNumber} ${capitalize(classItem.professor)}`,
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
  }, [dispatch, state.course?.value, state.coursedDisciplines]);

  const addDisciplinesSlot = useCallback(() => {
    const slotId = uuid();

    dispatch({
      type: ActionType.CREATE_DISCIPLINES_SLOT,
      payload: {
        slotId,
      },
    });

    setFocus(slotId);
  }, [dispatch]);

  const removeDisciplinesSlot = (id: string) => {
    if (Object.keys(state.disciplineSlots).length <= 1) {
      return;
    }

    const disciplinesFromSlot = Object.values(state.disciplineSlots[id]);

    for (const discipline of disciplinesFromSlot) {
      dispatch({
        type: ActionType.REMOVE_FROM_SELECTED_DISCIPLINES,
        payload: {
          slotId: id,
          disciplineId: discipline?.disciplineId ?? "",
        },
      });
    }

    dispatch({
      type: ActionType.DELETE_DISCIPLINES_SLOT,
      payload: {
        slotId: id,
      },
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    // Handling drag and drop while disciplineSlots is an object
    const items = Object.entries(state.disciplineSlots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedSlots = Object.fromEntries(items);

    dispatch({
      type: ActionType.SET_DISCIPLINES_SLOT,
      payload: reorderedSlots,
    });
  };

  async function buildGrades() {
    const data = await getGrades({
      disciplineSlots: state.disciplineSlots,
    });

    setGrids(data);
  }

  useEffect(() => {
    setShowDnd(true);

    const slots = Object.values(state.disciplineSlots);

    if (!slots.length) {
      // addDisciplinesSlot();
    }

    return setGenerateDisabled(slots.length === 0 || slots.some((slot) => slot.length === 0));
  }, [addDisciplinesSlot, state.disciplineSlots]);

  return showDnd ? (
    <div className="flex flex-col w-full max-w-[800px]">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="options">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {Object.entries(state.disciplineSlots).map(([key, _], index) => (
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
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <div className="flex justify-between items-center">
        <Button variant="contained" onClick={addDisciplinesSlot}>
          Adicionar Slot
        </Button>
        <Button disabled={generateDisabled} variant="contained" onClick={buildGrades}>
          Gerar Grade
        </Button>
      </div>
      <div className="flex">{grids ? <ScheduleViewer combinations={grids} /> : <></>}</div>
    </div>
  ) : (
    <></>
  );
}

export default DisciplinesSelector;
