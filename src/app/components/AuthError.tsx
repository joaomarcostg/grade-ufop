"use client";
import { useSearchParams } from "next/navigation";
import { Container, Typography, Box, Button } from "@mui/material";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  let errorMessage =
    "Um erro desconhecido ocorreu. Por favor, tente novamente.";
  if (error === "AccessDenied") {
    errorMessage = "Accesso negado. Por favor use um email @ufop.edu.br.";
  } else if (error === "OAuthAccountNotLinked") {
    errorMessage =
      "Teve algum erro ao conectar sua conta. Por favor tente se conectar novamente.";
  }

  console.error("Authentication error:", error);

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
          <Typography component="h1" variant="h5" gutterBottom>
            Erro de autenticação
          </Typography>
          <Typography align="center" component={"p"}>
            {errorMessage}
          </Typography>
          <Typography align="center" component={"p"} color="error">
            Detalhes do erro: {error}
          </Typography>
          <Button component={Link} href="/auth/login" variant="contained">
            Voltar para o login
          </Button>
        </Box>
      </Container>
  );
}
