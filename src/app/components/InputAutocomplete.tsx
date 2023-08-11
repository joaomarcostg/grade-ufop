"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useState } from "react";

export type AutocompleteOption = {
  label: string | null;
  value: string;
} | null;

type InputAutocompleteProps = {
  options: Array<any>;
  label: string;
  action?: (value: AutocompleteOption | null) => void;
};

function InputAutocomplete({ options, label, action }: InputAutocompleteProps) {
  const [value, setValue] = useState<AutocompleteOption>(null);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="flex">
      <Autocomplete
        id="combo-box-demo"
        sx={{ width: 300 }}
        options={options}
        value={value}
        onChange={(event: any, selected: AutocompleteOption) => {
          setValue(selected);
          action && action(selected);
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
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
