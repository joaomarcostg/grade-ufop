import type { Theme } from "@emotion/react";
import type { SxProps } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

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
  style?: SxProps<Theme>;
};

function InputAutocomplete({ action, options, label, style }: InputAutocompleteProps) {

  return (
    <Autocomplete
      sx={{
        ...style,
        "& + .MuiAutocomplete-popper .MuiAutocomplete-option": {
          borderBottom: "1px solid #DDD",
          padding: "8px 16px",
        },
      }}
      options={options}
      disablePortal
      onChange={(_, selected: AutocompleteOption) => {
        action && action(selected);
      }}
      isOptionEqualToValue={(option: NonNullable<AutocompleteOption>, value: AutocompleteOption) => option?.value === value?.value}
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
