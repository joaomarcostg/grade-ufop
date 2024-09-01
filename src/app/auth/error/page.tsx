import { useRouter } from 'next/router';
import { Container, Typography, Box, Button } from "@mui/material";
import Link from 'next/link';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  let errorMessage = "An unknown error occurred during authentication.";
  if (error === 'AccessDenied') {
    errorMessage = "Access denied. Please use an @ufop.edu.br email address.";
  } else if (error === 'OAuthAccountNotLinked') {
    errorMessage = "There was an issue linking your account. Please try signing in again.";
  }

  console.error("Authentication error:", error);

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Authentication Error
        </Typography>
        <Typography align="center" paragraph>
          {errorMessage}
        </Typography>
        <Typography align="center" paragraph color="error">
          Error details: {error}
        </Typography>
        <Button component={Link} href="/auth/login" variant="contained">
          Back to Login
        </Button>
      </Box>
    </Container>
  );
}