"use client";
import { useState, useCallback } from "react";

interface ToastData {
  message: string;
  duration?: number;
  severity?: "info" | "success" | "warning" | "error";
}

interface Toast extends ToastData {
  id: number;
}

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toastData: ToastData) => {
    const id = new Date().getTime();
    setToasts((prevToasts) => [...prevToasts, { id, ...toastData }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
  };
};

export default useToast;
