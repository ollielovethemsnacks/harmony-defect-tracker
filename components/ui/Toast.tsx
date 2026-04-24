'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X, Undo2, ExternalLink, RotateCcw } from 'lucide-react';
import type { ToastData, ToastType } from './ToastContext';

// ─── Variants Configuration ──────────────────────────────────────────────────

const TOAST_STYLES: Record<
  ToastType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  error: {
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
  onUndo: () => void;
}

export default function Toast({ toast, onClose, onUndo }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  // Trigger slide-in animation on mount
  useEffect(() => {
    // Small delay so CSS transition fires (mount → add class)
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Wait for slide-out animation to finish before calling dismiss
    setTimeout(onClose, 300);
  };

  return (
    <div
      role="alert"
      className={`
        toast-notification flex items-start gap-3
        w-80 max-w-[calc(100vw-2rem)]
        px-4 py-3 rounded-lg border shadow-lg
        ${style.bg} ${style.border}
        transition-all duration-300 ease-out
        ${visible ? 'toast-enter' : 'toast-exit'}
      `}
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${style.color}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Message */}
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-snug">
        {toast.message}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo button */}
        {toast.undoCallback && (
          <button
            onClick={onUndo}
            className="
              inline-flex items-center gap-1 px-2 py-1
              text-xs font-semibold rounded
              text-blue-700 dark:text-blue-400
              hover:bg-blue-100 dark:hover:bg-blue-900
              transition-colors
            "
            aria-label="Undo action"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        )}

        {/* Custom action buttons (e.g. "View", "Retry") */}
        {toast.actions?.map((action, idx) => (
          <button
            key={idx}
            onClick={() => {
              action.onClick();
              // Don't auto-dismiss for retry actions
              if (action.label !== 'Retry') handleClose();
            }}
            className={`
              inline-flex items-center gap-1 px-2 py-1
              text-xs font-semibold rounded
              transition-colors
              ${action.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
              }
            `}
            aria-label={action.label}
          >
            {action.label === 'Retry' && <RotateCcw className="w-3.5 h-3.5" />}
            {action.label === 'View' && <ExternalLink className="w-3.5 h-3.5" />}
            {action.label}
          </button>
        ))}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="
            p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors
          "
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
