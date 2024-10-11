"use client";
import CoursePicker from "@/components/CoursePicker";
import DisciplinesPicker from "@/components/DisciplinesPicker";
import {
  Container,
  Typography,
  Box,
  Button,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
} from "@mui/material";
import { HelpOutline } from "@mui/icons-material";
import { AutocompleteOption } from "./InputAutocomplete";
import { Session } from "next-auth/core/types";
import { useEffect, useState } from "react";
import { useStudent, StudentActionType } from "@/app/context/student";
import { useRouter } from "next/navigation";
import {
  setUserCourse,
  updateCoursedDisciplines,
} from "@/lib/fetch-api/fetch-userData";
import { capitalize } from "@/app/utils/converters";
import { useToast } from "../context/ToastContext";

interface HomeProps {
  session: Session;
}

export default function HomeContent({ session }: HomeProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const {
    state: { course, courses, coursedDisciplines, setup },
    dispatch,
  } = useStudent();

  const [selectedCourse, setSelectedCourse] =
    useState<AutocompleteOption | null>(course);

  const steps: string[] = [
    "Bem-vindo",
    "Selecione seu curso",
    "Selecione suas disciplinas",
    "Confirmação",
  ];

  const handleNext = () => {
    dispatch({
      type: StudentActionType.SET_SETUP_STEP,
      payload: setup.step + 1,
    });
  };

  const handleBack = () => {
    dispatch({
      type: StudentActionType.SET_SETUP_STEP,
      payload: setup.step - 1,
    });
  };

  const handleCourseSelection = async () => {
    if (!selectedCourse) return;

    try {
      const updatedUser = await setUserCourse(selectedCourse.value);

      if (!updatedUser) {
        throw new Error("Failed to save course selection");
      }

      dispatch({
        type: StudentActionType.SELECT_COURSE,
        payload: selectedCourse,
      });
      handleNext();
    } catch (error) {
      addToast({
        message: "Erro ao salvar seleção de curso. Por favor, tente novamente.",
        severity: "error",
      });
      console.error("Error saving course selection:", error);
    }
  };

  const handleSave = async () => {
    try {
      dispatch({
        type: StudentActionType.SET_SETUP_COMPLETED,
        payload: true,
      });

      const completedDisciplines = Array.from(coursedDisciplines.values()).map(
        (d) => d.id
      );
      await updateCoursedDisciplines(completedDisciplines);

      router.push("/montar-grade");
    } catch (error) {
      addToast({
        message: "Erro ao salvar dados do usuário. Por favor, tente novamente.",
        severity: "error",
      });
      console.error(error);
    }
  };

  useEffect(() => {
    if (setup.completed) {
      router.push("/montar-grade");
    }
  }, [setup.completed, router]);

  if (setup.completed) {
    return <></>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Stepper activeStep={setup.step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {setup.step === 0 && (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Bem-vindo ao GradeUFOP, {capitalize(session.user?.name)}!
            </Typography>
            <Typography variant="body1" component={"p"} mb={2}>
              Estamos animados para ajudá-lo a organizar sua jornada acadêmica.
              Vamos começar selecionando seu curso e as disciplinas que você já
              concluiu.
            </Typography>
            <Button variant="contained" onClick={handleNext}>
              Começar
            </Button>
          </>
        )}

        {setup.step === 1 && (
          <>
            <Typography variant="h5" gutterBottom marginBottom={4}>
              Selecione o curso que você está cursando
            </Typography>
            <CoursePicker
              courses={courses}
              selectedCourse={selectedCourse}
              handleCourseChange={setSelectedCourse}
            />
            <div className="w-full flex justify-between items-center">
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Voltar
              </Button>
              <Button variant="contained" onClick={handleCourseSelection}>
                Próximo
              </Button>
            </div>
          </>
        )}

        {setup.step === 2 && (
          <>
            <Typography variant="h5" gutterBottom>
              Selecione as disciplinas que você já cursou
            </Typography>
            <DisciplinesPicker />
            <div className="w-full flex justify-between items-center">
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Voltar
              </Button>
              <Button variant="contained" onClick={handleNext}>
                Próximo
              </Button>
            </div>
          </>
        )}

        {setup.step === 3 && (
          <>
            <Typography variant="h5" gutterBottom mb={4}>
              Confirme suas seleções
              <Tooltip title="Você pode alterar suas seleções posteriormente na página de Perfil">
                <HelpOutline fontSize="small" className="ml-2 cursor-help" />
              </Tooltip>
            </Typography>
            <Typography variant="body1" component={"p"} mb={2}>
              <span className="font-bold">Curso:</span> {course?.label}
            </Typography>
            <Typography variant="body1" component={"p"} mb={2}>
              <span className="font-bold">Disciplinas selecionadas:</span>{" "}
              {coursedDisciplines.size}
            </Typography>
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
              {Array.from(coursedDisciplines.values()).map((discipline) => (
                <Typography key={discipline.id} variant="body2">
                  {discipline.code} - {discipline.name}
                </Typography>
              ))}
            </div>
            <div className="w-full mt-8 flex justify-between items-center">
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Voltar
              </Button>
              <Button variant="contained" onClick={handleSave}>
                Salvar e Continuar
              </Button>
            </div>
          </>
        )}
      </Box>
    </Container>
  );
}
