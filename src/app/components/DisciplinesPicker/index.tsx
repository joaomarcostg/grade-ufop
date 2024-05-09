"use client";
import { useState, useContext } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import InputMethod from "./InputMethod";
import FileUploader from "./FileUploader";
import ManualPicker from "./ManualPicker";
import {Button} from "@mui/material";
import { useRouter } from 'next/navigation'


export default function DisciplinesPicker() {
  const router = useRouter()
  const [method, setMethod] = useState<"loadPDF" | "manual" | null>(null);
  const { state } = useContext(StudentContext);

  return (
    <>
      <div
        className={`mt-8 w-[460px] h-[40px] flex rounded-3xl border-solid border text-sm ${
          !state.course ? "border-gray-400 text-gray-400 cursor-not-allowed" : " border-primary text-primary cursor-pointer"
        } overflow-hidden`}
      >
        <InputMethod
          disabled={!state.course}
          action={() => setMethod("loadPDF")}
          selected={method === "loadPDF"}
          label="Carregar Falta Cursar"
        />
        <InputMethod
          disabled={!state.course}
          action={() => setMethod("manual")}
          selected={method === "manual"}
          label="Selecionar Manualmente"
        />
      </div>
      {method === "loadPDF" && <FileUploader />}
      {method === "manual" && <ManualPicker />}
      {state.coursedDisciplines.length > 0 && <Button onClick={() => router.push("/montar-grade")}>Próximo</Button>}
    </>
  );
}
