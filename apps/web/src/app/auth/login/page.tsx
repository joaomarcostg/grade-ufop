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
          gap: 2,
        }}
      >
        <Typography component="h1" variant="h5">
          Seja bem-vindo ao GradeUFOP
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          align="center"
          sx={{ maxWidth: "80%" }}
        >
          Para acessar o sistema, faça login com seu email institucional da UFOP (@aluno.ufop.edu.br)
        </Typography>
        <Box sx={{ mt: 1 }}>
          <GoogleLoginButton />
        </Box>
      </Box>
    </Container>
  );
}