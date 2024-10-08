// app/profile/page.tsx
"use client";
import UserInfo from "./UserInfo";
import CoursedDisciplines from "./CoursedDisciplines";
import { useStudent } from "@/app/context/student";

export default function Profile() {
  const { state } = useStudent();

  if (!state.user) {
    return <div>Error loading user profile</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Perfil</h1>
      <UserInfo />
      <CoursedDisciplines />
    </div>
  );
}
