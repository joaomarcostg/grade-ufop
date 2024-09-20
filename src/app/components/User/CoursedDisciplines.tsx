// app/profile/components/CoursedDisciplines.tsx
"use client";

import React, { useState } from "react";
import { Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel } from "@mui/material";
import { updateCoursedDisciplines } from "@/lib/fetch-api/fetch-user-data"; // You'll need to implement this
import EditIcon from "@mui/icons-material/Edit";

interface CoursedDisciplinesProps {
  coursedDisciplines: Array<{ id: string; name: string }>;
}

const CoursedDisciplines: React.FC<CoursedDisciplinesProps> = ({ coursedDisciplines }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(coursedDisciplines.map((d) => d.id));

  const handleToggle = (disciplineId: string) => {
    setSelected((prev) => (prev.includes(disciplineId) ? prev.filter((id) => id !== disciplineId) : [...prev, disciplineId]));
  };

  const handleSave = async () => {
    try {
      await updateCoursedDisciplines(selected);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update coursed disciplines:", error);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Disciplinas cursadas</h3>
      <div className="flex items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {coursedDisciplines.length > 0 ? (
            coursedDisciplines.map((discipline) => <Chip key={discipline.id} label={discipline.name} />)
          ) : (
            <>Nenhuma disciplina cursada ainda.</>
          )}
        </div>
        <Button onClick={() => setOpen(true)} startIcon={<EditIcon />}>
          Editar
        </Button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Editar Disciplinas Cursadas</DialogTitle>
        <DialogContent>
          {coursedDisciplines.map((discipline) => (
            <FormControlLabel
              key={discipline.id}
              control={<Checkbox checked={selected.includes(discipline.id)} onChange={() => handleToggle(discipline.id)} />}
              label={discipline.name}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CoursedDisciplines;
