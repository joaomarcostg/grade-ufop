"use client";

import type { Theme } from "@emotion/react";
import type { SxProps } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

export type AutocompleteOption = {
  index?: number;
  label: string | null;
  value: string;
  disabled?: boolean;
} | null;

type InputAutocompleteProps = {
  action?: (value: AutocompleteOption) => void;
  options: Array<any>;
  label: string;
  initialValue?: AutocompleteOption;
  style?: SxProps<Theme>;
};

function InputAutocomplete({
  action,
  options,
  label,
  initialValue,
  style,
}: InputAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(initialValue?.label ?? "");
  }, [initialValue]);

  return (
    <div className="flex">
      <Autocomplete
        id="combo-box-demo"
        sx={style}
        options={options}
        value={initialValue}
        onChange={(_, selected: AutocompleteOption) => {
          action && action(selected);
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        isOptionEqualToValue={(
          option: NonNullable<AutocompleteOption>,
          value: AutocompleteOption
        ) => option?.value === value?.value}
        filterSelectedOptions
        renderInput={(params) => <TextField {...params} label={label} />}
        renderOption={(props, option) => {
          return (
            <li {...props} key={option.value}>
              {option.label}
            </li>
          );
        }}
      />
    </div>
  );
}

export default InputAutocomplete;
