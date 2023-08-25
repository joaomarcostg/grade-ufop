"use client";
import React, { useState, useContext } from "react";
import { type DraggableProvided } from "@hello-pangea/dnd";
import { Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { DragIndicator, Add } from "@mui/icons-material";

import Autocomplete, {
  type AutocompleteOption,
} from "@/components/InputAutocomplete"; // Import your Autocomplete component
import { StudentContext } from "@/app/context/StudentContext";
import Chip from "./Chip";
import { ActionType } from "@/app/context/reducers";

type ClassesSelectorProps = {
  provided: DraggableProvided;
};

function ClassesSelector({ provided }: ClassesSelectorProps) {
  const { state, dispatch } = useContext(StudentContext);

  const [selectedDiscipline, setSelectedDiscipline] =
    useState<AutocompleteOption>(null);
  const [chips, setChips] = useState<NonNullable<AutocompleteOption>[]>([]);

  const handleAdd = () => {
    if (selectedDiscipline) {
      setChips([...chips, selectedDiscipline]);

      // Remove the selected discipline from availableDisciplines
      dispatch({
        type: ActionType["REMOVE_FROM_AVAILABLE_OPTIONS"],
        payload: selectedDiscipline,
      });

      setSelectedDiscipline(null);
    }
  };

  const handleRemove = (chip: AutocompleteOption) => {
    const items = Array.from(chips);
    const index = items.findIndex((item) => item.value === chip?.value);
    if (index === -1) {
      return;
    }
    items.splice(index, 1);
    setChips(items);

    // Add the removed chip back to availableDisciplines
    dispatch({
      type: ActionType["ADD_TO_AVAILABLE_OPTIONS"],
      payload: chip,
    });
  };

  const handleSelection = (value: AutocompleteOption) => {
    setSelectedDiscipline(value);
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className="flex flex-row gap-4 items-center p-4 border-gray-500 border-2 rounded-lg mb-8 w-[800px]"
    >
      <div itemRef="" {...provided.dragHandleProps}>
        <DragIndicator />
      </div>
      <div className="flex-1 flex flex-row items-center flex-wrap gap-4">
        {chips.map((chip, index) => (
          <Chip key={index} {...chip} handleDelete={() => handleRemove(chip)} />
        ))}

        <Autocomplete
          initialValue={selectedDiscipline}
          options={state.availableOptions}
          action={handleSelection}
          label="Disciplina"
          style={{
            width: 300,
          }}
        />
        <IconButton onClick={handleAdd}>
          <Add />
        </IconButton>
      </div>
    </div>
  );
}

export default ClassesSelector;
