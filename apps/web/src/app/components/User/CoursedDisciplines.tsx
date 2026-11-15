// app/profile/components/CoursedDisciplines.tsx
"use client";
import React, { useState } from "react";
import { Button } from "@mui/material";
import { SaveOutlined, Edit } from "@mui/icons-material";
import { updateCoursedDisciplines } from "@/lib/fetch-api/fetch-userData"; // You'll need to implement this
import ManualPicker from "../DisciplinesPicker/ManualPicker";
import { useStudent } from "@/app/context/student";
import { useToast } from "@/app/context/ToastContext";

function CoursedDisciplines() {
  const [isEditing, setIsEditing] = useState(false);

  const { addToast } = useToast();
  const {
    state: { coursedDisciplines },
  } = useStudent();

  const handleSave = async () => {
    try {
      const completedDisciplines = Array.from(coursedDisciplines.values()).map(
        (d) => d.id
      );
      await updateCoursedDisciplines(completedDisciplines);
      setIsEditing(false);
    } catch (error) {
      addToast({
        message: "Erro ao buscar disciplinas",
        severity: "error",
      });
      console.error("Failed to update coursed disciplines:", error);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-4">
        <span>Disciplinas cursadas</span>
        {isEditing ? (
          <Button startIcon={<SaveOutlined />} onClick={handleSave}>
            Salvar
          </Button>
        ) : (
          <Button startIcon={<Edit />} onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </h3>
      <div className="flex items-center gap-4">
        <ManualPicker disabled={!isEditing} />
      </div>
    </div>
  );
}

export default CoursedDisciplines;
