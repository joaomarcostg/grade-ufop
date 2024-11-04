"use client";
import React from "react";

import { Tooltip } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { Close } from "@mui/icons-material";

import type { AutocompleteOption } from "@/components/InputAutocomplete"; // Import your Autocomplete component

type CustomChipProps = NonNullable<AutocompleteOption> & {
  handleDelete: () => void;
};
function Chip({ label, handleDelete }: CustomChipProps) {
  return (
    <Tooltip title={label}>
      <div className="w-full gap-2 flex flex-row items-center">
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm sm:text-base">
          {label}
        </span>
        <IconButton onClick={handleDelete}>
          <Close color="primary" />
        </IconButton>
      </div>
    </Tooltip>
  );
}

export default Chip;
