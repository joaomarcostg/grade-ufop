import AuthError from "@/app/components/AuthError";
import { Suspense } from "react";

export default function AuthErrorPage() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthError />
    </Suspense>
  );
}
