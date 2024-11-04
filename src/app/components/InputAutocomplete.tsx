import type { Theme } from "@emotion/react";
import type { SxProps } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { KeyboardEvent } from "react";

export type AutocompleteOption = {
  index?: number;
  label: string | null;
  value: string;
  disabled?: boolean;
  [key: string]: any;
};

type InputAutocompleteProps = {
  onChange: (value: AutocompleteOption | null) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  options: AutocompleteOption[];
  label: string;
  style?: SxProps<Theme>;
  value: AutocompleteOption | null;
};

function InputAutocomplete({
  onChange,
  onKeyDown = () => {},
  options,
  label,
  style,
  value,
}: InputAutocompleteProps) {
  return (
    <Autocomplete
      sx={{
        ...style,
      }}
      classes={{
        input: "sm:!text-base !text-sm",
        option: "sm:!text-base !text-sm border-b border-gray-200 py-2 px-4",
      }}
      noOptionsText="Nenhuma opção encontrada"
      options={options}
      disablePortal
      value={value}
      onChange={(_, selected: AutocompleteOption | null) => {
        onChange(selected);
      }}
      onKeyDown={onKeyDown}
      isOptionEqualToValue={(option, value) => option?.value === value?.value}
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
  );
}

export default InputAutocomplete;
