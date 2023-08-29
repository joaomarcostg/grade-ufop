"use client";
import React, { useState, useContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@mui/material";
import { type AutocompleteOption } from "@/components/InputAutocomplete"; // Import your Autocomplete component
import { StudentContext } from "@/app/context/StudentContext";
import { getAvailableDisciplines } from "@/lib/fetch-api/fetch-disciplines";
import { ActionType } from "@/app/context/actions";
import DisciplinesSlot from "./DisciplinesSlot";
import { capitalize } from "@/app/utils/converters";

function DisciplinesSelector() {
  const { state, dispatch } = useContext(StudentContext);

  const [focused, setFocus] = useState<string>("");
  const [showDnd, setShowDnd] = useState(false);

  useEffect(() => {
    setShowDnd(true);
  }, []);

  useEffect(() => {
    async function fetchRequest() {
      const disciplines = await getAvailableDisciplines({
        coursedDisciplines: state.coursedDisciplines,
        courseId: state.course?.value ?? "",
      });

      const autocompleteOptions = disciplines.reduce<
        NonNullable<AutocompleteOption>[]
      >((acc, discipline) => {
        discipline.classes.forEach((classItem) => {
          acc.push({
            index: acc.length,
            value: classItem.id,
            label: `${discipline.code} - ${capitalize(discipline.name)} - T${
              classItem.class_number
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
  }, [dispatch, state.course?.value, state.coursedDisciplines]);

  const addDisciplinesSlot = () => {
    const slotId = uuid();

    dispatch({
      type: ActionType.CREATE_DISCIPLINES_SLOT,
      payload: {
        slotId,
      },
    });

    setFocus(slotId);
  };

  const removeDisciplinesSlot = (id: string) => {
    if (Object.keys(state.disciplineSlots).length <= 1) {
      return;
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

  return showDnd ? (
    <div className="flex flex-col">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="options">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="w-fit">
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
        <Button variant="contained" onClick={() => {}}>
          Gerar Grade
        </Button>
      </div>
    </div>
  ) : (
    <></>
  );
}

export default DisciplinesSelector;
