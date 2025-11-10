"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type SnackbarType = "success" | "error" | "warning" | "info";

export interface SnackbarProps {
  id: string;
  type: SnackbarType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColors = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
};

export function Snackbar({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    // Show snackbar
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto hide snackbar
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }
      `}
    >
      <div
        className={`
          border rounded-lg shadow-lg p-4
          ${colors[type]}
        `}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColors[type]}`}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{title}</h4>
            {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
