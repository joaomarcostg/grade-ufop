"use client";
import CoursePicker from "@/components/CoursePicker";
import DisciplinesPicker from "@/components/DisciplinesPicker";
import { Container, Typography, Box, Button, Step, StepLabel, Stepper } from "@mui/material";
import { AutocompleteOption } from "./InputAutocomplete";
import { Session } from "next-auth/core/types";
import { useContext, useEffect, useState } from "react";
import { StudentContext } from "../context/StudentContext";
import { useRouter } from "next/navigation";
import { ActionType } from "../context/actions";
import { setUserCourse } from "@/lib/fetch-api/fetch-user-data";
import { capitalize } from "@/app/utils/converters";

interface HomeProps {
  session: Session;
  courses: AutocompleteOption[];
}

export default function HomeContent({ session, courses }: HomeProps) {
  const router = useRouter();

  const {
    state: { course, coursedDisciplines, setupCompleted },
    dispatch,
  } = useContext(StudentContext);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedCourse, setSelectedCourse] = useState<AutocompleteOption | null>(course);

  const steps: string[] = ["Bem-vindo", "Selecione seu curso", "Selecione suas disciplinas", "Confirmação"];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCourseSelection = async () => {
    if (!selectedCourse) return;

    try {
      const updatedUser = await setUserCourse(selectedCourse.value);

      if (!updatedUser) {
        throw new Error("Failed to save course selection");
      }

      dispatch({
        type: ActionType.SELECT_COURSE,
        payload: selectedCourse,
      });
      handleNext();
    } catch (error) {
      console.error("Error saving course selection:", error);
    }
  };

  const handleSaveAndBuildGrid = () => {
    console.log("Curso selecionado:", course);
    console.log("Disciplinas selecionadas:", coursedDisciplines);

    dispatch({
      type: ActionType.SET_SETUP_COMPLETED,
      payload: true,
    });

    router.push("/montar-grade");
  };

  useEffect(() => {
    if (setupCompleted) {
      router.push("/montar-grade");
    }
  }, [setupCompleted, router]);

  if (setupCompleted) {
    return <></>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Bem-vindo ao GradeUFOP, {capitalize(session.user?.name)}!
            </Typography>
            <Typography variant="body1" paragraph>
              Estamos animados para ajudá-lo a organizar sua jornada acadêmica. Vamos começar selecionando seu curso e as disciplinas que
              você já concluiu.
            </Typography>
            <Button variant="contained" onClick={handleNext}>
              Começar
            </Button>
          </>
        )}

        {activeStep === 1 && (
          <>
            <CoursePicker courses={courses} selectedCourse={selectedCourse} handleCourseChange={setSelectedCourse} />
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

        {activeStep === 2 && (
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

        {activeStep === 3 && (
          <>
            <Typography variant="h5" gutterBottom>
              Confirme suas seleções
            </Typography>
            <Typography variant="body1" paragraph>
              Curso: {course?.label}
            </Typography>
            <Typography variant="body1" paragraph>
              Disciplinas selecionadas: {coursedDisciplines.length}
            </Typography>
            <div className="w-full flex justify-between items-center">
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Voltar
              </Button>
              <Button variant="contained" onClick={handleSaveAndBuildGrid}>
                Salvar e Continuar
              </Button>
            </div>
          </>
        )}
      </Box>
    </Container>
  );
}
