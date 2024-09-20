import { redirect } from "next/navigation";
import { Container, Typography, Box } from "@mui/material";
import { auth } from "@/lib/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Seja bem-vindo ao GradeUFOP
        </Typography>
        <Box sx={{ mt: 3 }}>
          <GoogleLoginButton />
        </Box>
      </Box>
    </Container>
  );
}
