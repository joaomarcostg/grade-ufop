"use client";
import { HelpOutline } from "@mui/icons-material";
import FileUploader from "./FileUploader";
import ManualPicker from "./ManualPicker";
import { Tooltip } from "@mui/material";

export default function DisciplinesPicker() {
  return (
    <div className="w-full mt-8 flex flex-col items-center gap-8 mb-8">
      <div className="flex flex-col gap-4">
        <span className="flex items-center font-bold">
          Carregar .pdf (Falta Cursar)
          <Tooltip
            title={
              "Baixe o arquivo faltaCursar pelo portal MinhaUFOP e o carregue aqui. Dessa forma, as disciplinas já cursadas serão detectadas automaticamente."
            }
          >
            <HelpOutline className="cursor-help ml-2"/>
          </Tooltip>
        </span>

        <FileUploader />
      </div>
      <ManualPicker />
    </div>
  );
}
