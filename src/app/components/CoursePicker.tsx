"use client";

import { Button } from "@mui/material";
import InputAutocomplete, {
  type AutocompleteOption,
} from "@/components/InputAutocomplete";
import { useContext, useState } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "../context/reducers";

type CoursePickerProps = {
  courses: AutocompleteOption[];
};

export default function CoursePicker({ courses }: CoursePickerProps) {
  const { dispatch } = useContext(StudentContext);
  const [selectedCourse, setSelectedCourse] =
    useState<AutocompleteOption>(null);

  const handleAutocompleChange = (course: AutocompleteOption) => {
    setSelectedCourse(course);
  };

  const handleCourseSelection = () => {
    dispatch({
      payload: selectedCourse?.value ?? null,
      type: ActionType["SELECT_COURSE"],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p>Por favor, informe seu curso</p>
      <InputAutocomplete
        options={courses}
        action={handleAutocompleChange}
        label="Curso"
      />
      <Button
        variant="outlined"
        disabled={!selectedCourse}
        onClick={handleCourseSelection}
      >
        Escolher
      </Button>
    </div>
  );
}
