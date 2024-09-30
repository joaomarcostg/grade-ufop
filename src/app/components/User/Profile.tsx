// app/profile/page.tsx
"use client";
import { getUserProfile } from "@/lib/fetch-api/fetch-user-data"; // You'll need to implement this
import UserInfo from "./UserInfo";
import CoursedDisciplines from "./CoursedDisciplines";
import SavedCombinations from "./SavedCombinations";
import { useContext, useEffect, useState } from "react";
import { AutocompleteOption } from "../InputAutocomplete";
import { fetchCourses } from "@/lib/fetch-api/fetch-courses";
import { StudentContext } from "@/app/context/StudentContext";
import { UserProfile } from "@/app/context/types";
import { ActionType } from "@/app/context/actions";

export default function Profile() {
  const {state, dispatch } = useContext(StudentContext);

  useEffect(() => {
    async function fetchProfile() {
      const userData = await getUserProfile();

      dispatch({
        type: ActionType.SET_USER_DATA,
        payload: userData,
      });
    }

    fetchProfile();
  }, [dispatch]);

  if (!state.user) {
    return <div>Error loading user profile</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Perfil</h1>
      <UserInfo />
      <CoursedDisciplines />
      {/* <SavedCombinations /> */}
    </div>
  );
}
