"use client";
import React from "react";
import { Alert, Snackbar } from "@mui/material";
import useToast from "../hooks/useToast";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Snackbar key={toast.id} open autoHideDuration={toast.duration}>
          <Alert
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
      <main className="pt-16 pb-8 px-4">{children}</main>
    </>
  );
};

export default Layout;
