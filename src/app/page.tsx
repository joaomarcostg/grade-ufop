import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import HomeContent from "./components/HomeContent";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return <HomeContent session={session} />;
}
