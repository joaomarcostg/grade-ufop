"use client";
import React, { createContext, useState, useCallback, useContext } from 'react';

interface ToastData {
  message: string;
  duration?: number;
  severity?: "info" | "success" | "warning" | "error";
}

interface Toast extends ToastData {
  id: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toastData: ToastData) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toastData: ToastData) => {
    const id = new Date().getTime();
    setToasts((prevToasts) => [...prevToasts, { id, ...toastData }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};