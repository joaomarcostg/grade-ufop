"use client";

import { useState } from "react";
import { Button } from "@mui/material";
import InputAutocomplete, { type AutocompleteOption } from "@/components/InputAutocomplete";
import { useContext } from "react";
import { StudentContext } from "@/app/context/StudentContext";
import { ActionType } from "../context/actions";
import { setUserCourse } from "@/lib/fetch-api/fetch-user-data";

type CoursePickerProps = {
  courses: AutocompleteOption[];
};

export default function CoursePicker({ courses }: CoursePickerProps) {
  const { dispatch } = useContext(StudentContext);
  const [selectedCourse, setSelectedCourse] = useState<AutocompleteOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAutocompleChange = (course: AutocompleteOption | null) => {
    setSelectedCourse(course);
  };

  const handleCourseSelection = async () => {
    if (!selectedCourse) return;

    setIsLoading(true);
    try {
      const updatedUser = await setUserCourse(selectedCourse.id);

      if (updatedUser) {
        dispatch({
          type: ActionType.SELECT_COURSE,
          payload: selectedCourse,
        });
        console.log("Course selection saved successfully");
      } else {
        console.error("Failed to save course selection");
      }
    } catch (error) {
      console.error("Error saving course selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p>Por favor, informe seu curso</p>
      <InputAutocomplete options={courses} onChange={handleAutocompleChange} value={selectedCourse} label="Curso" style={{ width: 300 }} />
      <Button variant="outlined" disabled={!selectedCourse || isLoading} onClick={handleCourseSelection}>
        {isLoading ? "Salvando..." : "Escolher"}
      </Button>
    </div>
  );
}
