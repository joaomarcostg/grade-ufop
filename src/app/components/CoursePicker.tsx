import React from "react";
import InputAutocomplete, { AutocompleteOption } from "@/components/InputAutocomplete";

interface CoursePickerProps {
  courses: AutocompleteOption[];
  handleCourseChange: (course: AutocompleteOption | null) => void;
  selectedCourse: AutocompleteOption | null;
}

export default function CoursePicker({ courses, handleCourseChange, selectedCourse }: CoursePickerProps) {
  return (
    <>
      <div className="flex flex-col items-center space-y-6">
        <InputAutocomplete options={courses} onChange={handleCourseChange} value={selectedCourse} label="Curso" style={{ width: 300 }} />
      </div>
    </>
  );
}
