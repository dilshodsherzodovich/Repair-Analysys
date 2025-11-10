"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Snackbar, SnackbarProps } from "@/ui/snackbar";

interface SnackbarContextType {
  showSnackbar: (snackbar: Omit<SnackbarProps, "id" | "onClose">) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarProps[]>([]);

  const removeSnackbar = useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
  }, []);

  const showSnackbar = useCallback(
    (snackbar: Omit<SnackbarProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newSnackbar: SnackbarProps = {
        ...snackbar,
        id,
        onClose: removeSnackbar,
      };
      setSnackbars((prev) => [...prev, newSnackbar]);
    },
    [removeSnackbar]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showSnackbar({ type: "success", title, message });
    },
    [showSnackbar]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showSnackbar({ type: "error", title, message });
    },
    [showSnackbar]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showSnackbar({ type: "warning", title, message });
    },
    [showSnackbar]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showSnackbar({ type: "info", title, message });
    },
    [showSnackbar]
  );

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      {snackbars.map((snackbar) => (
        <Snackbar key={snackbar.id} {...snackbar} />
      ))}
    </SnackbarContext.Provider>
  );
}
