'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Toast from './Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;       // ms, default 5000
  undoCallback?: () => void;
  actions?: ToastAction[]; // Custom action buttons (e.g. "View", "Retry")
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  undoCallback?: () => void;
  actions?: ToastAction[];
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 3;

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ message, type = 'success', duration = DEFAULT_DURATION, undoCallback, actions }: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const newToast: ToastData = {
        id,
        message,
        type,
        duration,
        undoCallback,
        actions,
      };

      setToasts((prev) => {
        const next = [...prev, newToast];
        // Keep only the most recent MAX_TOASTS toasts
        return next.slice(-MAX_TOASTS);
      });

      // Auto-dismiss timer
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast],
  ) as ToastContextValue['showToast'];

  const handleUndo = useCallback(
    (toast: ToastData) => {
      toast.undoCallback?.();
      dismissToast(toast.id);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast container — fixed, bottom-right, z-stacked */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onClose={() => dismissToast(toast.id)}
              onUndo={() => handleUndo(toast)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
