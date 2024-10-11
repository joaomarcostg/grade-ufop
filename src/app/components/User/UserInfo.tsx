// app/profile/components/UserInfo.tsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { setUserCourse } from "@/lib/fetch-api/fetch-userData";
import CoursePicker from "../CoursePicker";
import { useStudent, StudentActionType } from "@/app/context/student";
import { useToast } from "@/app/context/ToastContext";
import { Logout, SaveOutlined, Warning } from "@mui/icons-material";
import { signOut } from "next-auth/react";

const LogoutDialog = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleLogout = () => {
    signOut();
    handleClose();
  };

  return (
    <>
      <Tooltip title="Sair">
        <IconButton onClick={handleOpen} aria-label="Sair" color="primary">
          <Logout />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle
          id="logout-dialog-title"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Warning color="warning" />
          Confirmar Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Tem certeza que deseja sair? Você precisará fazer login novamente
            para acessar sua conta.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px",
          }}
        >
          <Button onClick={handleClose} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={handleLogout}
            color="primary"
            variant="contained"
            autoFocus
          >
            Sair
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
function UserInfo() {
  const { addToast } = useToast();
  const {
    state: { user, course, courses },
    dispatch,
  } = useStudent();

  const [selectedCourse, setCourse] = useState(course);
  const [isEditing, setIsEditing] = useState(false);

  const handleCourseUpdate = async () => {
    if (!selectedCourse) return;
    try {
      await setUserCourse(selectedCourse.value);
      dispatch({
        type: StudentActionType.SELECT_COURSE,
        payload: selectedCourse,
      });

      setIsEditing(false);
    } catch (error) {
      addToast({
        message: "Erro ao atualizar curso. Por favor, tente novamente.",
        severity: "error",
      });
      console.error("Failed to update course:", error);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Image
            src={user.image}
            alt={user.name}
            width={100}
            height={100}
            className="rounded-full mr-4"
          />
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span>{user.name}</span>
              <LogoutDialog />
            </h2>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col w-fit">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-4">
            <span>Curso</span>
            {isEditing ? (
              <Button onClick={handleCourseUpdate} startIcon={<SaveOutlined />}>
                Salvar
              </Button>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                startIcon={<EditIcon />}
              >
                Editar
              </Button>
            )}
          </h3>
          {isEditing ? (
            <div className="flex items-center gap-4">
              <CoursePicker
                courses={courses}
                selectedCourse={selectedCourse}
                handleCourseChange={setCourse}
              />
            </div>
          ) : (
            <p className="font-normal">{course?.label ?? ""}</p>
          )}
        </div>
      </div>
    </>
  );
}

export default UserInfo;
