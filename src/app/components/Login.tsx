"use client";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

type ComponentProps = {
  session: Session | null;
};

export default function Component({ session }: ComponentProps) {
  if (session) {
    return (
      <>
        Signed in as {session?.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn("google")}>Sign in</button>
    </>
  );
}
