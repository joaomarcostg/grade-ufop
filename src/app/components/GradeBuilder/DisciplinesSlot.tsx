"use client";
import React, { useState, useContext, useEffect } from "react";
import { type DraggableProvided } from "@hello-pangea/dnd";
import IconButton from "@mui/material/IconButton";
import { DragIndicator, Add, Delete, Edit } from "@mui/icons-material";
import Autocomplete, {
  type AutocompleteOption,
} from "@/components/InputAutocomplete"; // Import your Autocomplete component
import { StudentContext } from "@/app/context/StudentContext";
import Chip from "./Chip";
import { ActionType } from "@/app/context/actions";
import { Button, Divider } from "@mui/material";

type DisciplinesSlotProps = {
  slotId: string;
  provided: DraggableProvided;
  isFocused: boolean;
  changeFocus: () => void;
  removeAction: () => void;
};

function DisciplinesSlot({
  slotId,
  provided,
  isFocused,
  changeFocus,
  removeAction,
}: DisciplinesSlotProps) {
  const { state, dispatch } = useContext(StudentContext);

  const [selectedDiscipline, setSelectedDiscipline] =
    useState<AutocompleteOption>(null);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  useEffect(() => {
    // Collect all disciplineClassId values from all slots except the current one
    const disciplineClassIdsFromOtherSlots = Object.entries(
      state.selectedDisciplines
    )
      .filter(([otherSlotId]) => otherSlotId !== slotId)
      .flatMap(([, disciplineClassIds]) => disciplineClassIds);

    // Filter available options by removing disciplines that are selected in other slots
    const diff = state.availableOptions.filter(
      (option) =>
        !disciplineClassIdsFromOtherSlots.includes(option?.disciplineId)
    );

    setOptions(diff);
  }, [state.availableOptions, state.selectedDisciplines, slotId]);

  const handleAdd = () => {
    if (selectedDiscipline) {
      // Add chip and remove the selected discipline from availableDisciplines
      dispatch({
        type: ActionType.ADD_TO_DISCIPLINES_SLOT,
        payload: {
          slotId,
          value: selectedDiscipline,
        },
      });

      dispatch({
        type: ActionType.ADD_TO_SELECTED_DISCIPLINES,
        payload: {
          slotId,
          disciplineId: selectedDiscipline.disciplineId,
        },
      });

      setSelectedDiscipline(null);
    }
  };

  const handleRemove = (chip: NonNullable<AutocompleteOption>) => {
    // Remove chip and add the removed chip back to availableDisciplines
    dispatch({
      type: ActionType.REMOVE_FROM_DISCIPLINES_SLOT,
      payload: {
        slotId,
        value: chip,
      },
    });

    dispatch({
      type: ActionType.REMOVE_FROM_SELECTED_DISCIPLINES,
      payload: {
        slotId,
        disciplineId: chip.disciplineId,
      },
    });
  };

  const handleSelection = (value: AutocompleteOption) => {
    setSelectedDiscipline(value);
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className="relative flex flex-row gap-4 items-center mb-8"
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 -left-8"
        itemRef={slotId}
        {...provided.dragHandleProps}
      >
        <DragIndicator />
      </div>
      <div
        className={`relative min-w-full max-w-[800px] flex flex-col gap-4 px-4 py-2 border-gray-100 border-2 rounded-lg ${
          !isFocused && "group py-6"
        } `}
      >
        <div className="group-hover:flex hidden absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 bg-white border-gray-100  border-2 rounded-[50%]">
          <IconButton size="small" onClick={changeFocus}>
            <Edit fontSize="small" color="primary" />
          </IconButton>
        </div>
        {isFocused && (
          <>
            <div className="flex w-full flex-row gap-4 justify-start items-center">
              <Autocomplete
                options={options}
                action={handleSelection}
                label="Disciplina"
                style={{
                  flex: 1,
                  maxWidth: 400,
                }}
              />
              <Button variant="text" onClick={handleAdd} endIcon={<Add />}>
                Adicionar
              </Button>
            </div>
            <Divider />
          </>
        )}

        {state.disciplineSlots[slotId].length > 0 ? (
          <div className="flex-1 flex flex-col">
            {state.disciplineSlots[slotId].map((chip, index) =>
              chip ? (
                <Chip
                  key={index}
                  {...chip}
                  handleDelete={() => handleRemove(chip)}
                />
              ) : (
                <></>
              )
            )}
          </div>
        ) : (
          <span>Nenhuma disciplina selecionada</span>
        )}
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-12">
        <IconButton onClick={removeAction}>
          <Delete />
        </IconButton>
      </div>
    </div>
  );
}

export default DisciplinesSlot;
