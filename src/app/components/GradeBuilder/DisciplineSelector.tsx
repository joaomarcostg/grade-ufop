"use client";
import React, { useState, useContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DraggableProvided,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@mui/material";
import { type AutocompleteOption } from "@/components/InputAutocomplete"; // Import your Autocomplete component
import { StudentContext } from "@/app/context/StudentContext";
import { getAvailableDisciplines } from "@/lib/fetch-api/fetch-disciplines";
import { ActionType } from "@/app/context/reducers";
import ClassesSelector from "./ClassesSelector";

type ClassSelector = {
  id: string;
  selected: AutocompleteOption[];
};

function DisciplinesSelector() {
  const { state, dispatch } = useContext(StudentContext);

  useEffect(() => {
    async function fetchRequest() {
      const disciplines = await getAvailableDisciplines({
        coursedDisciplines: state.coursedDisciplines,
        courseId: state.course?.value ?? "",
      });

      const autocompleteOptions = disciplines.reduce<AutocompleteOption[]>(
        (acc, discipline) => {
          discipline.classes.forEach((classItem) => {
            acc.push({
              index: acc.length,
              value: classItem.id,
              label: `${discipline.code} - ${discipline.name} - T${classItem.class_number} ${classItem.professor}`,
              disabled: !discipline.isEnabled,
            } as AutocompleteOption);
          });
          return acc;
        },
        []
      );

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
  ]);

  const [classSelectors, setClassSelectors] = useState<ClassSelector[]>([
    {
      id: uuid(),
      selected: [],
    },
  ]);

  const addClassSelector = () => {
    setClassSelectors([
      ...classSelectors,
      {
        id: uuid(),
        selected: [],
      },
    ]);
  };

  const removeClassSelector = (id: string) => {
    if (classSelectors.length <= 1) {
      return;
    }

    const index = classSelectors.findIndex((value) => value.id === id);

    if (index !== -1) {
      const newClassSelectors = classSelectors.splice(index, 1);
      setClassSelectors(newClassSelectors);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = Array.from(classSelectors);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setClassSelectors(items);
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="options">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {classSelectors.map((value, index) => (
                <Draggable key={value.id} draggableId={value.id} index={index}>
                  {(provided) => <ClassesSelector provided={provided} />}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <Button onClick={addClassSelector}>Adicionar Disciplinas</Button>
    </div>
  );
}

export default DisciplinesSelector;
