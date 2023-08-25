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
      <div className="w-[300px] gap-2 flex flex-row items-center p-2 bg-gray-100 rounded">
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {label}
        </span>
        <IconButton onClick={handleDelete}>
          <Close />
        </IconButton>
      </div>
    </Tooltip>
  );
}

export default Chip;
