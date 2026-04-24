'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { ModalSpinner } from '@/components/shared/ModalSpinner';
import { ModalErrorBoundary } from '@/components/shared/ModalErrorBoundary';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defect: {
    id: string;
    defectNumber: string;
    title: string;
    location?: string;
  };
  onDefectDeleted?: (defectId: string) => void;
}

const CONFIRM_WORD = 'DELETE';

// ─── Component ───────────────────────────────────────────────────────────────

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  defect,
  onDefectDeleted,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const isConfirmed = useMemo(
    () => confirmText === CONFIRM_WORD,
    [confirmText],
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setIsDeleting(false);
      document.body.style.overflow = 'hidden';
      // Focus the input when modal opens
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    },
    [onClose, isDeleting],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle the actual deletion
  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/defects/${defect.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete defect');
      }

      // Notify parent that defect was deleted (remove from board)
      onDefectDeleted?.(defect.id);

      // Show toast with 10-second undo window
      showToast({
        message: `"${defect.title}" moved to archive`,
        type: 'warning',
        duration: 10000,
        undoCallback: async () => {
          try {
            const restoreResponse = await fetch(
              `/api/defects/${defect.id}/restore`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
              },
            );

            const restoreResult = await restoreResponse.json();

            if (!restoreResult.success) {
              throw new Error(restoreResult.error || 'Failed to restore defect');
            }

            showToast({
              message: `"${defect.title}" restored`,
              type: 'success',
              duration: 3000,
            });

            // Trigger a board refresh by dispatching a custom event
            window.dispatchEvent(
              new CustomEvent('defect-restored', {
                detail: { defectId: defect.id },
              }),
            );
          } catch (restoreError) {
            showToast({
              message:
                restoreError instanceof Error
                  ? restoreError.message
                  : 'Failed to restore defect',
              type: 'error',
              duration: 5000,
            });
          }
        },
      });

      // Close modal after showing toast
      onClose();
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : 'Failed to delete defect',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isConfirmed, isDeleting, defect, onDefectDeleted, showToast]);

  // Handle confirm text input
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmText(e.target.value);
    },
    [],
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isDeleting) {
        onClose();
      }
    },
    [isDeleting, onClose],
  );

  // Error boundary recovery
  const handleModalError = useCallback(
    (error: Error) => {
      console.error('[DeleteConfirmationModal] Error boundary caught:', error);
    },
    [],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 transition-opacity"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <ModalErrorBoundary onError={handleModalError}>
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 border-b border-red-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2
                id="delete-modal-title"
                className="text-lg font-bold text-red-900"
              >
                Delete Defect?
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Defect info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-500">
                You are about to delete:
              </p>
              <p className="text-sm font-mono font-semibold text-gray-900">
                {defect.defectNumber}
              </p>
              <p className="text-base font-medium text-gray-900">
                {defect.title}
              </p>
              {defect.location && (
                <p className="text-sm text-gray-600">
                  📍 {defect.location}
                </p>
              )}
            </div>

            {/* Consequences */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">This will:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Remove it from the kanban board</li>
                <li>Preserve it in archive for 30 days</li>
                <li>Be restorable during that period</li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <label
                htmlFor="delete-confirm-input"
                className="block text-sm font-medium text-gray-700"
              >
                Type{' '}
                <span className="font-mono font-bold text-red-600">
                  &quot;{CONFIRM_WORD}&quot;
                </span>{' '}
                to confirm:
              </label>
              <input
                ref={inputRef}
                id="delete-confirm-input"
                type="text"
                value={confirmText}
                onChange={handleInputChange}
                disabled={isDeleting}
                placeholder="DELETE"
                autoComplete="off"
                spellCheck={false}
                tabIndex={1}
                className={`
                  w-full px-3 py-2 border rounded-lg font-mono text-sm
                  transition-all duration-200 focus:outline-none focus:ring-2
                  ${
                    confirmText.length > 0 && !isConfirmed
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                  }
                  ${isConfirmed ? 'border-green-400 focus:ring-green-500' : ''}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-describedby="delete-confirm-hint"
              />
              {confirmText.length > 0 && !isConfirmed && (
                <p
                  id="delete-confirm-hint"
                  className="text-xs text-red-500 transition-opacity duration-150"
                  role="alert"
                >
                  Must be exactly &quot;{CONFIRM_WORD}&quot;
                </p>
              )}
              {isConfirmed && (
                <p
                  className="text-xs text-green-600 transition-opacity duration-150"
                  role="status"
                >
                  ✓ Confirmed
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              tabIndex={2}
              className="
                px-4 py-2 text-sm font-medium text-gray-700 bg-white
                border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              tabIndex={3}
              className={`
                px-4 py-2 text-sm font-medium text-white rounded-lg
                inline-flex items-center gap-2 min-w-[130px] justify-center
                transition-all duration-200
                ${
                  isConfirmed && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 shadow-sm'
                    : 'bg-red-300 cursor-not-allowed'
                }
                disabled:cursor-not-allowed
              `}
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <ModalSpinner size="sm" label="Deleting..." />
              ) : (
                <>
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                  Delete Defect
                </>
              )}
            </button>
          </div>
        </div>
      </ModalErrorBoundary>
    </div>
  );
}
