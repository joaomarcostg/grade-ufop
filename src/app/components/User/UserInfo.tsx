// app/profile/components/UserInfo.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { setUserCourse, UserProfile } from "@/lib/fetch-api/fetch-user-data"; // You'll need to implement this
import CoursePicker from "../CoursePicker";
import { AutocompleteOption } from "../InputAutocomplete";

interface UserInfoProps {
  user: UserProfile;
  courses: AutocompleteOption[];
}

const UserInfo: React.FC<UserInfoProps> = ({ user, courses }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [course, setCourse] = useState<AutocompleteOption | null>(
    user.course
      ? {
          label: user.course.name,
          value: user.course.id,
        }
      : null
  );

  const handleCourseUpdate = async () => {
    if (!course) return;
    try {
      await setUserCourse(course.value);
      user.course = { id: course.value, name: course.label ?? '' };
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <Image src={user.image} alt={user.name} width={100} height={100} className="rounded-full mr-4" />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="flex flex-col w-fit">
        <h3 className="text-lg font-semibold mb-2">Curso</h3>
        {isEditing ? (
          <div className="flex items-center gap-4">
            <CoursePicker courses={courses} selectedCourse={course} handleCourseChange={setCourse} />
            <Button onClick={handleCourseUpdate}>Salvar</Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="font-normal">{user.course?.name ?? ""}</p>
            <Button onClick={() => setIsEditing(true)} startIcon={<EditIcon />}>
              Editar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
