'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { Defect, DefectStatus } from '@/types';
import { DefectNotes } from './DefectNotes';
import { ImageLightbox } from '../ImageLightbox';
import { StatusSelector } from './StatusSelector';
import { StatusConfirmationDialog } from './StatusConfirmationDialog';
import { useToast } from '@/components/ui/ToastContext';
import { statusMetadata, requiresStatusConfirmation } from '@/lib/status';

interface DefectDetailModalProps {
  defect: Defect | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (updatedDefect: Defect) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DefectDetailModal({ defect, isOpen, onClose, onStatusChange, onEdit, onDelete }: DefectDetailModalProps) {
  const { showToast } = useToast();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [pendingStatus, setPendingStatus] = useState<DefectStatus | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management: move focus to close button when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Restore focus to previously focused element when modal closes
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (lightboxOpen) {
        setLightboxOpen(false);
      } else {
        onClose();
      }
    }
  }, [onClose, lightboxOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // ─── Status Change Handlers ──────────────────────────────────────────

  const handleStatusSelect = useCallback(
    (newStatus: DefectStatus) => {
      if (!defect || newStatus === defect.status) return;

      if (requiresStatusConfirmation(defect.status, newStatus)) {
        setPendingStatus(newStatus);
        setShowConfirmation(true);
      } else {
        executeStatusChange(newStatus);
      }
    },
    [defect],
  );

  const executeStatusChange = useCallback(
    async (newStatus: DefectStatus) => {
      if (!defect) return;

      const previousStatus = defect.status;
      setIsStatusUpdating(true);
      setShowConfirmation(false);

      // Optimistic update — notify parent immediately
      const optimisticDefect = { ...defect, status: newStatus };
      onStatusChange?.(optimisticDefect);
      setStatusAnnouncement(`Status changed to ${statusMetadata[newStatus].label}`);

      try {
        const response = await fetch(`/api/defects/${defect.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to update status');
        }

        // Server confirmed — reconcile with server data
        if (result.data) {
          onStatusChange?.(result.data);
        }

        showToast({
          message: `Status updated to ${statusMetadata[newStatus].label}`,
          type: 'success',
          duration: 4000,
        });
      } catch (error) {
        // Rollback to previous status
        onStatusChange?.({ ...defect, status: previousStatus });

        const errorMessage = error instanceof Error ? error.message : 'Network error';
        showToast({
          message: `Failed to update status: ${errorMessage}`,
          type: 'error',
          duration: 8000,
          actions: [
            {
              label: 'Retry',
              variant: 'primary' as const,
              onClick: () => executeStatusChange(newStatus),
            },
          ],
        });
      } finally {
        setIsStatusUpdating(false);
        setPendingStatus(null);
      }
    },
    [defect, onStatusChange, showToast],
  );

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (defect?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % defect.images.length);
    }
  };

  const prevImage = () => {
    if (defect?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + defect.images.length) % defect.images.length);
    }
  };

  if (!isOpen || !defect) return null;

  return (
    <>
      {/* Screen reader announcements for status changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusAnnouncement}
      </div>

      <div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="presentation"
      >
        <div
          ref={modalRef}
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl sm:my-8 mx-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="defect-modal-title"
          aria-describedby="defect-modal-desc"
        >
          {/* Header — sticky so close is always reachable on mobile */}
          <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-sm font-mono text-gray-500">{defect.defectNumber}</span>
              <h2
                id="defect-modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1 truncate"
              >
                {defect.title}
              </h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
              {/* Status Selector */}
              <StatusSelector
                currentStatus={defect.status}
                onChange={handleStatusSelect}
                isLoading={isStatusUpdating}
                disabled={isStatusUpdating}
              />
              {/* Edit button — min 44px tap target */}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Edit defect"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {/* Delete button — min 44px tap target */}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  aria-label="Delete defect"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {/* Close button — min 44px tap target, auto-focused */}
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Close defect details"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content — id used for aria-describedby */}
          <div id="defect-modal-desc" className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Status & Location */}
            <div className="flex flex-wrap gap-2 sm:gap-3" role="list" aria-label="Defect metadata">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium status-badge ${statusMetadata[defect.status].badgeClasses}`}
                role="listitem"
              >
                {statusMetadata[defect.status].label}
              </span>
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm" role="listitem">
                📍 {defect.location}
              </span>
              {defect.standardReference && (
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm" role="listitem">
                  📋 {defect.standardReference}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{defect.description}</p>
            </div>

            {/* Images */}
            {defect.images && defect.images.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Images ({defect.images.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {defect.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                    >
                      <button
                        className="w-full h-full p-0 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={() => openLightbox(idx)}
                        aria-label={`View defect image ${idx + 1} of ${defect.images!.length}`}
                      >
                        <img
                          src={img}
                          alt={`Defect image ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <DefectNotes defect={defect} />

            {/* Dates */}
            <div className="text-sm text-gray-500 border-t pt-4">
              <p>Created: {new Date(defect.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(defect.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={defect.images || []}
        currentIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
      />

      {/* Status Confirmation Dialog */}
      {pendingStatus && (
        <StatusConfirmationDialog
          isOpen={showConfirmation}
          fromStatus={defect.status}
          toStatus={pendingStatus}
          onConfirm={() => executeStatusChange(pendingStatus)}
          onCancel={() => {
            setShowConfirmation(false);
            setPendingStatus(null);
          }}
          isLoading={isStatusUpdating}
        />
      )}
    </>
  );
}
