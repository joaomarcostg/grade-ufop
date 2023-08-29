"use client";

import type { Theme } from "@emotion/react";
import type { SxProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

export type AutocompleteOption = {
  index?: number;
  label: string | null;
  value: string;
  disabled?: boolean;
  [key: string]: any;
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
    <Autocomplete
      sx={{
        ...style,
        "& + .MuiAutocomplete-popper .MuiAutocomplete-option": {
          borderBottom: "1px solid #DDD",
          padding: "8px 16px",
        },
      }}
      disablePortal
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
          <>
            <li {...props} key={option.value}>
              {option.label}
            </li>
          </>
        );
      }}
    />
  );
}

export default InputAutocomplete;
