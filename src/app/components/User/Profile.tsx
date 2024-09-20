// app/profile/page.tsx
"use client";
import { getUserProfile, UserProfile } from "@/lib/fetch-api/fetch-user-data"; // You'll need to implement this
import UserInfo from "./UserInfo";
import CoursedDisciplines from "./CoursedDisciplines";
import SavedCombinations from "./SavedCombinations";
import { useEffect, useState } from "react";
import { AutocompleteOption } from "../InputAutocomplete";
import { fetchCourses, getCourses } from "@/lib/fetch-api/fetch-courses";

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<AutocompleteOption[]>([]);

  useEffect(() => {
    async function fetchProfile() {
      const userData = await getUserProfile();
      setUserProfile(userData);

      const coursesData = await fetchCourses();
      const _courses = coursesData
        ? coursesData.map((course) => ({
            label: course.name,
            value: course.id,
          }))
        : [];
        
      setCourses(_courses);
    }

    fetchProfile();
  }, []);

  if (!userProfile) {
    return <div>Error loading user profile</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Perfil</h1>
      <UserInfo user={userProfile} courses={courses} />
      <CoursedDisciplines coursedDisciplines={userProfile.coursedDisciplines} />
      <SavedCombinations combinations={userProfile.savedCombinations} />
    </div>
  );
}
