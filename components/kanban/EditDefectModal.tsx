'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { ImageUpload } from '@/components/ImageUpload';
import { ModalSpinner } from '@/components/shared/ModalSpinner';
import { ImageSkeleton } from '@/components/shared/ImageSkeleton';
import { ModalErrorBoundary } from '@/components/shared/ModalErrorBoundary';
import {
  UpdateDefectSchema,
  NotesEntrySchema,
  STANDARD_REF_REGEX,
  type DefectSeverity,
  type NotesEntry,
} from '@/lib/validation/schemas';
import type { Defect } from '@/types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface EditDefectModalProps {
  defect: Defect;
  isOpen: boolean;
  onClose: () => void;
  /** After successful server PATCH, caller passes the persisted defect back */
  onUpdate: (defect: Defect) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS: { value: DefectSeverity; label: string; emoji: string }[] = [
  { value: 'CRITICAL', label: 'Critical — Structural/Safety', emoji: '🔴' },
  { value: 'HIGH', label: 'High — Major Functional', emoji: '🟠' },
  { value: 'MEDIUM', label: 'Medium — Minor/Cosmetic', emoji: '🟡' },
  { value: 'LOW', label: 'Low — Observation', emoji: '🔵' },
];

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 2000;
const MAX_LOCATION = 200;
const MAX_STANDARD_REF = 200;
const MAX_NOTE_TEXT = 2000;
const MAX_IMAGES = 5;

// ─── Helper: Parse notes JSON ────────────────────────────────────────────────

function parseNotesHistory(raw: string | null): NotesEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy plain-text note — treat as a single entry
  }
  return [
    {
      timestamp: new Date().toISOString(),
      author: 'system',
      text: raw,
    },
  ];
}

// ─── Character Counter with smooth animation ─────────────────────────────────

interface CharCounterProps {
  current: number;
  max: number;
  className?: string;
}

function CharCounter({ current, max, className = '' }: CharCounterProps) {
  const pct = (current / max) * 100;
  const nearLimit = pct > 80;
  const atLimit = pct >= 100;

  return (
    <p
      className={`text-xs transition-all duration-200 ${
        atLimit
          ? 'text-red-500 font-medium'
          : nearLimit
            ? 'text-amber-500'
            : 'text-gray-400'
      } ${className}`}
      aria-label={`${current} of ${max} characters`}
    >
      {current}/{max}
    </p>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditDefectModal({ defect, isOpen, onClose, onUpdate }: EditDefectModalProps) {
  const { showToast } = useToast();

  // Auto-focus ref — first input field
  const titleRef = useRef<HTMLInputElement>(null);

  // ─── Form state (initialised from defect) ────────────────────────────────
  // Initialize state from defect when modal opens (using lazy initialization pattern)
  const [title, setTitle] = useState(() => defect.title);
  const [description, setDescription] = useState(() => defect.description ?? '');
  const [location, setLocation] = useState(() => defect.location ?? '');
  const [standardReference, setStandardReference] = useState(() =>
    defect.standardReference || '',
  );
  const [severity, setSeverity] = useState<DefectSeverity | null>(() => defect.severity ?? null);

  const [existingImages, setExistingImages] = useState<string[]>(() =>
    defect.images || [],
  );
  const [notesHistory, setNotesHistory] = useState<NotesEntry[]>(() =>
    parseNotesHistory(defect.notes ?? null),
  );
  const [newNoteText, setNewNoteText] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ─── Auto-focus first field when modal opens ────────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      // Focus title input after modal paints
      const timer = requestAnimationFrame(() => {
        titleRef.current?.focus();
      });
      return () => cancelAnimationFrame(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ─── Reset form to original defect values ────────────────────────────────

  const resetForm = useCallback(() => {
    setTitle(defect.title);
    setDescription(defect.description ?? '');
    setLocation(defect.location ?? '');
    setStandardReference(defect.standardReference || '');
    setSeverity(defect.severity ?? null);
    setExistingImages(defect.images || []);
    setNotesHistory(parseNotesHistory(defect.notes ?? null));
    setNewNoteText('');
    setFieldErrors({});
    setTouched({});
  }, [defect]);

  // ─── Close handler (reset + close) ───────────────────────────────────────

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ─── Escape key handler ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || loading) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, loading, handleClose]);

  // ─── Memoized validation payload builder ────────────────────────────────

  const buildPayload = useMemo(
    () =>
      (
        t: string,
        d: string,
        l: string,
        sr: string,
        sev: DefectSeverity | null,
        imgs: string[],
      ) => {
        const payload: Record<string, unknown> = {
          title: t,
          description: d,
          location: l,
          standardReference: sr,
          severity: sev ?? undefined,
          images: imgs.length > 0 ? imgs : undefined,
        };
        return payload;
      },
    [],
  );

  // ─── Blur validation ────────────────────────────────────────────────────

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const payload = buildPayload(
        title,
        description,
        location,
        standardReference,
        severity,
        existingImages,
      );

      const result = UpdateDefectSchema.safeParse(payload);
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const err of result.error.issues) {
          const key = err.path[0]?.toString();
          if (key) errors[key] = err.message;
        }
        setFieldErrors((prev) => ({ ...prev, ...errors }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [title, description, location, standardReference, severity, existingImages, buildPayload],
  );

  // ─── Standard reference inline validation hint ───────────────────────────

  const standardRefValid =
    standardReference === '' || STANDARD_REF_REGEX.test(standardReference);

  // ─── Handle image removal ────────────────────────────────────────────────

  const handleImageRemoved = useCallback((removedUrl: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== removedUrl));
  }, []);

  // ─── Error boundary recovery ─────────────────────────────────────────────

  const handleModalError = useCallback(
    (error: Error) => {
      console.error('[EditDefectModal] Error boundary caught:', error);
      showToast({ message: 'Form error — please try again', type: 'error' });
    },
    [showToast],
  );

  const handleRecover = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all required fields as touched for error display
    setTouched({
      title: true,
      description: true,
      severity: true,
    });

    // Build partial payload — only fields that changed
    const partial: Record<string, unknown> = {};
    if (title !== defect.title) partial.title = title;
    if (description !== defect.description) partial.description = description;
    if (location !== defect.location) partial.location = location;
    if (standardReference !== (defect.standardReference || ''))
      partial.standardReference = standardReference;
    if (severity !== defect.severity) partial.severity = severity;

    // Append new note if entered
    if (newNoteText.trim()) {
      const newEntry: NotesEntry = {
        timestamp: new Date().toISOString(),
        author: 'user',
        text: newNoteText.trim(),
      };
      const entryResult = NotesEntrySchema.safeParse(newEntry);
      if (entryResult.success) {
        const updatedHistory = [...notesHistory, newEntry];
        partial.notes = JSON.stringify(updatedHistory);
      }
    }

    // Images changed? (only add; removals are already reflected in existingImages)
    if (existingImages.length !== (defect.images || []).length) {
      partial.images = existingImages;
    }

    // Validate the partial payload against UpdateDefectSchema
    const result = UpdateDefectSchema.safeParse(partial);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const err of result.error.issues) {
        const key = err.path[0]?.toString();
        if (key) errors[key] = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    // Zod passed — send to server
    setLoading(true);
    try {
      const response = await fetch(`/api/defects/${defect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const msg =
          json.message || json.error || 'Failed to update defect';
        showToast({ message: msg, type: 'error' });
        if (json.details) {
          setFieldErrors((prev) => ({ ...prev, ...json.details }));
        }
        return;
      }

      // Success
      showToast({
        message: `Defect ${defect.defectNumber} updated!`,
        type: 'success',
      });
      onUpdate(json.data as Defect);
      handleClose();
    } catch {
      showToast({ message: 'Network error — could not update defect', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Don't render when closed ────────────────────────────────────────────

  if (!isOpen) return null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-defect-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <ModalErrorBoundary
          onError={handleModalError}
          onRecover={handleRecover}
          recoverLabel="Reset Form"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="edit-defect-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Edit Defect
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* ── Form Body ───────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto flex-1"
            noValidate
          >
            <div className="px-6 py-5 space-y-5">
              {/* Defect Number — read-only badge */}
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800">
                <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Defect Number
                </label>
                <span className="text-sm font-mono font-semibold text-blue-800 dark:text-blue-200">
                  {defect.defectNumber}
                </span>
                <span className="text-blue-400 dark:text-blue-500 ml-2 text-xs">
                  (read-only)
                </span>
              </div>

              {/* ── Title ───────────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="edit-defect-title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleRef}
                  id="edit-defect-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleBlur('title')}
                  placeholder="Brief description of the defect"
                  maxLength={MAX_TITLE}
                  disabled={loading}
                  tabIndex={1}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    transition-colors duration-150
                    ${
                      fieldErrors.title && touched.title
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between mt-1">
                  {fieldErrors.title && touched.title ? (
                    <p
                      className="text-xs text-red-500 transition-opacity duration-150"
                      role="alert"
                    >
                      {fieldErrors.title}
                    </p>
                  ) : (
                    <span />
                  )}
                  <CharCounter current={title.length} max={MAX_TITLE} />
                </div>
              </div>

              {/* ── Description ─────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="edit-defect-description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="edit-defect-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="Detailed description of the defect..."
                  rows={3}
                  maxLength={MAX_DESCRIPTION}
                  disabled={loading}
                  tabIndex={2}
                  className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    transition-colors duration-150
                    ${
                      fieldErrors.description && touched.description
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between mt-1">
                  {fieldErrors.description && touched.description ? (
                    <p
                      className="text-xs text-red-500 transition-opacity duration-150"
                      role="alert"
                    >
                      {fieldErrors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <CharCounter current={description.length} max={MAX_DESCRIPTION} />
                </div>
              </div>

              {/* ── Location + Standard Ref (side by side) ──────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label
                    htmlFor="edit-defect-location"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Location
                  </label>
                  <input
                    id="edit-defect-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => handleBlur('location')}
                    placeholder="e.g., Building A, Floor 2"
                    maxLength={MAX_LOCATION}
                    disabled={loading}
                    tabIndex={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      transition-colors duration-150
                      ${
                        fieldErrors.location && touched.location
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  <div className="flex justify-between mt-1">
                    {fieldErrors.location && touched.location ? (
                      <p
                        className="text-xs text-red-500 transition-opacity duration-150"
                        role="alert"
                      >
                        {fieldErrors.location}
                      </p>
                    ) : (
                      <span />
                    )}
                    <CharCounter current={location.length} max={MAX_LOCATION} />
                  </div>
                </div>

                {/* Standard Reference */}
                <div>
                  <label
                    htmlFor="edit-defect-standard-ref"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Standard Reference{' '}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="edit-defect-standard-ref"
                    type="text"
                    value={standardReference}
                    onChange={(e) => setStandardReference(e.target.value)}
                    onBlur={() => handleBlur('standardReference')}
                    placeholder="e.g., AS 3500; 4.18.1"
                    maxLength={MAX_STANDARD_REF}
                    disabled={loading}
                    tabIndex={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      transition-colors duration-150
                      ${
                        fieldErrors.standardReference && touched.standardReference
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                  <div className="flex justify-between mt-1">
                    {fieldErrors.standardReference && touched.standardReference ? (
                      <p
                        className="text-xs text-red-500 transition-opacity duration-150"
                        role="alert"
                      >
                        {fieldErrors.standardReference}
                      </p>
                    ) : standardReference ? (
                      <p
                        className={`text-xs transition-colors duration-200 ${
                          standardRefValid
                            ? 'text-green-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {standardRefValid
                          ? '✓ Valid format'
                          : '⚠ Format: AS XXXX.X; X.X.X'}
                      </p>
                    ) : (
                      <span />
                    )}
                    <CharCounter current={standardReference.length} max={MAX_STANDARD_REF} />
                  </div>
                </div>
              </div>

              {/* ── Severity ────────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="edit-defect-severity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-defect-severity"
                  value={severity ?? ''}
                  onChange={(e) => setSeverity(e.target.value as DefectSeverity || null)}
                  onBlur={() => handleBlur('severity')}
                  disabled={loading}
                  tabIndex={5}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    transition-colors duration-150
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${
                      fieldErrors.severity && touched.severity
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.severity && touched.severity && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {fieldErrors.severity}
                  </p>
                )}
              </div>

              {/* ── Images ──────────────────────────────────────────── */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Images{' '}
                  <span className="text-gray-400 font-normal">
                    ({existingImages.length} / {MAX_IMAGES})
                  </span>
                </label>
                {loading && <ImageSkeleton count={2} className="mb-3" />}
                <ImageUpload
                  onUpload={setExistingImages}
                  existingImages={existingImages}
                  maxFiles={MAX_IMAGES}
                />
              </div>

              {/* ── Notes History (append-only) ─────────────────────── */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Notes History{' '}
                  <span className="text-gray-400 font-normal">(append-only)</span>
                </label>

                {/* History list */}
                {notesHistory.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {notesHistory.map((entry, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {entry.author}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4 italic">
                    No notes yet.
                  </p>
                )}

                {/* Add new note */}
                <div>
                  <label
                    htmlFor="edit-defect-new-note"
                    className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                  >
                    Add a note
                  </label>
                  <textarea
                    id="edit-defect-new-note"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Type a new note..."
                    rows={2}
                    maxLength={MAX_NOTE_TEXT}
                    disabled={loading}
                    tabIndex={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <CharCounter current={newNoteText.length} max={MAX_NOTE_TEXT} className="mt-1 text-right" />
                </div>
              </div>
            </div>

            {/* ── Footer / Actions ──────────────────────────────────── */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                tabIndex={7}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                tabIndex={8}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? (
                  <ModalSpinner size="sm" label="Saving..." />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
