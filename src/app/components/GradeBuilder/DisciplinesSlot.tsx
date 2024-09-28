"use client";
import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  KeyboardEvent,
} from "react";
import { type DraggableProvided } from "@hello-pangea/dnd";
import IconButton from "@mui/material/IconButton";
import {
  DragIndicator,
  Add,
  PlaylistAdd,
  Delete,
  Edit,
} from "@mui/icons-material";
import Autocomplete, {
  type AutocompleteOption,
} from "@/components/InputAutocomplete";
import { StudentContext } from "@/app/context/StudentContext";
import Chip from "./Chip";
import { ActionType } from "@/app/context/actions";
import {
  Button,
  Divider,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

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
    useState<AutocompleteOption | null>(null);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [addAllClasses, setAddAllClasses] = useState(false);

  const groupedOptions = useMemo(() => {
    const grouped: { [key: string]: AutocompleteOption[] } = {};
    options.forEach((option) => {
      if (!grouped[option.disciplineId]) {
        grouped[option.disciplineId] = [];
      }
      grouped[option.disciplineId].push(option);
    });
    return grouped;
  }, [options]);

  useEffect(() => {
    const disciplineClassIdsFromOtherSlots = Object.entries(
      state.selectedDisciplines
    )
      .filter(([otherSlotId]) => otherSlotId !== slotId)
      .flatMap(([, disciplineClassIds]) => disciplineClassIds);

    const diff = state.availableOptions.filter(
      (option) =>
        !disciplineClassIdsFromOtherSlots.includes(option?.disciplineId)
    );

    setOptions(diff);
  }, [state.availableOptions, state.selectedDisciplines, slotId]);

  const handleAdd = () => {
    if (selectedDiscipline) {
      if (addAllClasses) {
        const allClassesForDiscipline =
          groupedOptions[selectedDiscipline.disciplineId];
        allClassesForDiscipline.forEach(addDiscipline);
      } else {
        addDiscipline(selectedDiscipline);
      }
      setSelectedDiscipline(null);
    }
  };

  const addDiscipline = (discipline: AutocompleteOption) => {
    dispatch({
      type: ActionType.ADD_TO_DISCIPLINES_SLOT,
      payload: {
        slotId,
        value: discipline,
      },
    });

    dispatch({
      type: ActionType.ADD_TO_SELECTED_DISCIPLINES,
      payload: {
        slotId,
        disciplineId: discipline.disciplineId,
      },
    });
  };

  const handleRemove = (chip: NonNullable<AutocompleteOption>) => {
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

  const handleSelection = (value: AutocompleteOption | null) => {
    setSelectedDiscipline(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && selectedDiscipline) {
      event.preventDefault();
      handleAdd();
    }
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className="relative flex flex-row gap-4 items-center"
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 -left-8"
        itemRef={slotId}
        {...provided.dragHandleProps}
      >
        <DragIndicator />
      </div>
      <div
        className={`relative min-w-full max-w-[800px] flex flex-col gap-4 p-4 ${
          isFocused ? "border-primary" : "border-gray-100"
        } border-2 rounded-lg ${!isFocused && "group py-6"} `}
      >
        <div className="group-hover:flex hidden absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 bg-white border-gray-100  border-2 rounded-[50%]">
          <IconButton size="small" onClick={changeFocus}>
            <Edit fontSize="small" color="primary" />
          </IconButton>
        </div>
        {isFocused && (
          <>
            <div className="mt-2 flex w-full flex-row gap-4 justify-start items-center">
              <Autocomplete
                options={options}
                onChange={handleSelection}
                onKeyDown={handleKeyDown}
                label="Disciplina"
                value={selectedDiscipline}
                style={{
                  width: "100%",
                  maxWidth: 400,
                }}
              />
              <div className="flex-1 flex items-center justify-between">
                <Button
                  variant="text"
                  onClick={handleAdd}
                  endIcon={addAllClasses ? <PlaylistAdd /> : <Add />}
                  disabled={!selectedDiscipline}
                >
                  Adicionar
                </Button>
                <Tooltip title="Adicionar todas as turmas desta disciplina">
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={addAllClasses}
                        onChange={(e) => setAddAllClasses(e.target.checked)}
                      />
                    }
                    label="Todas as turmas"
                  />
                </Tooltip>
              </div>
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
