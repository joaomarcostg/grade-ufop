// app/profile/components/UserInfo.tsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { setUserCourse } from "@/lib/fetch-api/fetch-user-data";
import CoursePicker from "../CoursePicker";
import { useStudent, StudentActionType } from "@/app/context/student";

function UserInfo() {
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
      console.error("Failed to update course:", error);
    }
  };

  if (!user) return null;

  return (
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
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="flex flex-col w-fit">
        <h3 className="text-lg font-semibold mb-2">Curso</h3>
        {isEditing ? (
          <div className="flex items-center gap-4">
            <CoursePicker
              courses={courses}
              selectedCourse={selectedCourse}
              handleCourseChange={setCourse}
            />
            <Button onClick={handleCourseUpdate}>Salvar</Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="font-normal">{course?.label ?? ""}</p>
            <Button onClick={() => setIsEditing(true)} startIcon={<EditIcon />}>
              Editar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserInfo;
