// app/profile/page.tsx
"use";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Profile from "../components/User/Profile";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return <Profile />;
}
