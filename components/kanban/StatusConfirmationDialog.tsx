'use client';

import { useEffect, useRef, useState } from 'react';
import type { DefectStatus } from '@/types';
import { statusMetadata, requiresStatusConfirmation } from '@/lib/status';
import {
  Circle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  X,
} from 'lucide-react';

// ─── Confirmation Messages ──────────────────────────────────────────────────

const CONFIRMATION_MESSAGES: Record<string, string> = {
  'TODO->DONE':
    'This will mark the defect as resolved without moving through "In Progress".',
  'IN_PROGRESS->TODO':
    'This will move the defect back to "To Do".',
  'DONE->IN_PROGRESS':
    'This will reopen the defect for additional work.',
  'DONE->TODO':
    'This will reopen the defect and reset it to "To Do".',
};

// ─── Icon Map ───────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<DefectStatus, React.ComponentType<{ className?: string }>> = {
  TODO: Circle,
  IN_PROGRESS: Loader2,
  DONE: CheckCircle2,
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface StatusConfirmationDialogProps {
  isOpen: boolean;
  fromStatus: DefectStatus;
  toStatus: DefectStatus;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Confirmation modal overlay for status transitions that require user confirmation.
 *
 * Features:
 * - Displays from/to status with colored badges and icons
 * - Shows contextual warning for unusual transitions
 * - Focus trap (Tab cycles within dialog)
 * - Escape key cancels
 * - Click outside cancels
 * - Smooth enter/exit CSS animations (respects prefers-reduced-motion)
 * - Screen reader announcements
 * - Mobile responsive with touch-friendly tap targets
 */
export function StatusConfirmationDialog({
  isOpen,
  fromStatus,
  toStatus,
  onConfirm,
  onCancel,
  isLoading = false,
}: StatusConfirmationDialogProps) {
  const [visible, setVisible] = useState(isOpen);
  const [animating, setAnimating] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Check if user prefers reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Animation lifecycle ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before dialog opened
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Use setTimeout to defer state updates outside of synchronous effect body
      const visibilityTimeout = setTimeout(() => {
        setVisible(true);
      }, 0);

      // If user prefers reduced motion, skip animation and focus immediately
      if (prefersReducedMotion) {
        const animTimeout = setTimeout(() => {
          setAnimating(true);
          cancelBtnRef.current?.focus();
        }, 0);
        return () => {
          clearTimeout(visibilityTimeout);
          clearTimeout(animTimeout);
        };
      } else {
        // Trigger enter animation on next frame
        const rafId = requestAnimationFrame(() => {
          setAnimating(true);
        });

        // Focus the cancel button after animation starts
        const focusTimer = setTimeout(() => {
          cancelBtnRef.current?.focus();
        }, 50);

        return () => {
          clearTimeout(visibilityTimeout);
          cancelAnimationFrame(rafId);
          clearTimeout(focusTimer);
        };
      }
    } else if (visible) {
      // Trigger exit animation (deferred to avoid setState in effect body)
      const animTimeout = setTimeout(() => {
        setAnimating(false);
      }, 0);

      // After exit animation completes, hide
      const timer = setTimeout(() => {
        setVisible(false);
      }, prefersReducedMotion ? 10 : 200);

      return () => {
        clearTimeout(animTimeout);
        clearTimeout(timer);
      };
    }
  }, [isOpen, visible, prefersReducedMotion]);

  // ── Restore focus on unmount ────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, []);

  // ── Restore focus when dialog closes ────────────────────────────────────

  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // ── Escape key handler ──────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  // ── Focus trap ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleTabKey);
    return () => dialog.removeEventListener('keydown', handleTabKey);
  }, [visible]);

  // ── Derived values ──────────────────────────────────────────────────────

  const fromMeta = statusMetadata[fromStatus];
  const toMeta = statusMetadata[toStatus];
  const needsConfirmation = requiresStatusConfirmation(fromStatus, toStatus);
  const warningMessage = CONFIRMATION_MESSAGES[`${fromStatus}->${toStatus}`];

  const FromIcon = STATUS_ICONS[fromStatus];
  const ToIcon = STATUS_ICONS[toStatus];

  // ── Render ──────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-confirm-title"
      aria-describedby="status-confirm-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Dialog Card */}
      <div
        ref={dialogRef}
        className={`
          relative bg-white rounded-lg shadow-xl w-full max-w-md
          mx-auto my-auto
          transition-all duration-200
          ${
            animating
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }
        `}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b">
          <h2
            id="status-confirm-title"
            className="text-base sm:text-lg font-semibold text-gray-900"
          >
            Change Defect Status?
          </h2>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
            aria-label="Cancel status change"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4" id="status-confirm-desc">
          {/* Transition Display */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            aria-label={`Status transition from ${fromMeta.label} to ${toMeta.label}`}
          >
            {/* From Status */}
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${fromMeta.badgeClasses}`}
                aria-label={`Current status: ${fromMeta.label}`}
              >
                <FromIcon className="w-4 h-4" aria-hidden="true" />
                {fromMeta.label}
              </span>
              <span className="text-xs text-gray-500">{fromMeta.description}</span>
            </div>

            {/* Arrow */}
            <ArrowRight
              className="w-5 h-5 text-gray-400 flex-shrink-0 rotate-90 sm:rotate-0"
              aria-hidden="true"
            />

            {/* To Status */}
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${toMeta.badgeClasses}`}
                aria-label={`New status: ${toMeta.label}`}
              >
                <ToIcon className="w-4 h-4" aria-hidden="true" />
                {toMeta.label}
              </span>
              <span className="text-xs text-gray-500">{toMeta.description}</span>
            </div>
          </div>

          {/* Warning Message */}
          {needsConfirmation && warningMessage && (
            <div
              className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
              role="alert"
            >
              <AlertTriangle
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm text-amber-700">{warningMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-5 pt-1">
          <button
            type="button"
            ref={cancelBtnRef}
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isLoading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
