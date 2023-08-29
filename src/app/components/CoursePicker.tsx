"use client";

import { Button } from "@mui/material";
import InputAutocomplete, {
  type AutocompleteOption,
} from "@/components/InputAutocomplete";
import { useContext, useEffect, useState } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "../context/actions";

type CoursePickerProps = {
  courses: AutocompleteOption[];
};

export default function CoursePicker({ courses }: CoursePickerProps) {
  const { state, dispatch } = useContext(StudentContext);
  const [selectedCourse, setSelectedCourse] =
    useState<AutocompleteOption>(null);

  const handleAutocompleChange = (course: AutocompleteOption) => {
    setSelectedCourse(course);
  };

  const handleCourseSelection = () => {
    dispatch({
      type: ActionType["SELECT_COURSE"],
      payload: selectedCourse,
    });
  };

  useEffect(() => {
    setSelectedCourse(state.course);
  }, [state.course]);

  return (
    <div className="flex flex-col gap-4">
      <p>Por favor, informe seu curso</p>
      <InputAutocomplete
        initialValue={state.course}
        options={courses}
        action={handleAutocompleChange}
        label="Curso"
        style={{ width: 300 }}
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
