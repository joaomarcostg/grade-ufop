"use client"
import { Box, CircularProgress, Typography } from "@mui/material";

const FullPageLoader = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      position: "fixed",
      top: 0,
      left: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      zIndex: 9999,
    }}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" style={{ marginTop: "16px" }}>
      Carregando dados do usuário...
    </Typography>
  </Box>
);

export default FullPageLoader;