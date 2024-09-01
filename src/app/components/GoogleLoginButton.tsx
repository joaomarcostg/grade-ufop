"use client";
import { signIn } from "next-auth/react";
import { Button } from "@mui/material";

export default function GoogleLoginButton() {
  return (
    <>
      <Button onClick={() => signIn("google")} fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Sign in with Google
      </Button>
    </>
  );
}
