"use client";
import React from "react";
import { Alert, Snackbar } from "@mui/material";
import { useToast } from "../context/ToastContext";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.duration ?? 3000}
          onClose={() => removeToast(toast.id)}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
      <main className="mt-14 py-4 px-2 sm:py-8 sm:px-4 sm:mt-16 ">
        {children}
      </main>
    </>
  );
};

export default Layout;
