'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { ImageUpload } from '@/components/ImageUpload';
import { ModalSpinner } from '@/components/shared/ModalSpinner';
import { ImageSkeleton } from '@/components/shared/ImageSkeleton';
import { ModalErrorBoundary } from '@/components/shared/ModalErrorBoundary';
import {
  CreateDefectSchema,
  STANDARD_REF_REGEX,
  type DefectSeverity,
  type DefectStatus,
  type CreateDefectInput,
} from '@/lib/validation/schemas';
import type { Defect } from '@/types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /* After successful server POST, caller passes the persisted defect back */
  onCreate: (defect: Defect) => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SEVERITY: DefectSeverity = 'MEDIUM';
const DEFAULT_STATUS: DefectStatus = 'TODO';
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
const MAX_NOTES = 5000;
const MAX_IMAGES = 5;

// ─── Auto-generate next defect number (preview only) ─────────────────────────

function generateNextDefectNumber(): string {
  const year = new Date().getFullYear();
  const placeholder = 'XXXX';
  return `DF-${year}-${placeholder}`;
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
      className={`text-[10px] transition-colors ${
        atLimit
          ? 'text-rose-500 font-medium'
          : nearLimit
            ? 'text-amber-500'
            : 'text-slate-400'
      } ${className}`}
      aria-label={`${current} of ${max} characters`}
    >
      {current}/{max}
    </p>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateDefectModal({ isOpen, onClose, onCreate }: CreateDefectModalProps) {
  const { showToast } = useToast();

  // Auto-focus ref — first input field
  const titleRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [standardReference, setStandardReference] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>(DEFAULT_SEVERITY);
  const [status] = useState<DefectStatus>(DEFAULT_STATUS);
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

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
      return () => {
        cancelAnimationFrame(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // ─── Reset form ──────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setLocation('');
    setStandardReference('');
    setSeverity(DEFAULT_SEVERITY);
    setImages([]);
    setNotes('');
    setFieldErrors({});
    setTouched({});
  }, []);

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
        sev: DefectSeverity,
        st: DefectStatus,
        imgs: string[],
        n: string,
      ) => {
        const payload: Record<string, unknown> = {
          title: t,
          description: d,
          location: l,
          standardReference: sr,
          severity: sev,
          status: st,
          images: imgs.length > 0 ? imgs : undefined,
          notes: n || undefined,
        };
        return payload;
      },
    [],
  );

  // ─── Blur validation (mark touched, validate single field) ───────────────

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const payload = buildPayload(
        title,
        description,
        location,
        standardReference,
        severity,
        status,
        images,
        notes,
      );

      const result = CreateDefectSchema.safeParse(payload);
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
    [title, description, location, standardReference, severity, status, images, notes, buildPayload],
  );

  // ─── Standard reference inline validation hint ───────────────────────────

  const standardRefValid =
    standardReference === '' || STANDARD_REF_REGEX.test(standardReference);

  // ─── Error boundary recovery ─────────────────────────────────────────────

  const handleModalError = useCallback(
    (error: Error) => {
      console.error('[CreateDefectModal] Error boundary caught:', error);
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
      location: true,
      severity: true,
    });

    // Build payload for Zod validation
    const payload = buildPayload(
      title,
      description,
      location,
      standardReference,
      severity,
      status,
      images,
      notes,
    );

    const result = CreateDefectSchema.safeParse(payload);

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
      const response = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data as CreateDefectInput),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const msg =
          json.message || json.error || 'Failed to create defect';
        showToast({ message: msg, type: 'error' });
        // If server returned field-level errors, merge them
        if (json.details) {
          setFieldErrors((prev) => ({ ...prev, ...json.details }));
        }
        return;
      }

      // Success — notify caller, show toast, close
      showToast({ message: `Defect ${json.data.defectNumber} created!`, type: 'success' });
      onCreate(json.data as Defect);
      handleClose();
    } catch {
      showToast({ message: 'Network error — could not create defect', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Don't render when closed ────────────────────────────────────────────

  if (!isOpen) return null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-defect-title"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200/60">
        <ModalErrorBoundary
          onError={handleModalError}
          onRecover={handleRecover}
          recoverLabel="Reset Form"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2
              id="create-defect-title"
              className="text-lg font-semibold text-slate-900"
            >
              Create New Defect
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
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
            <div className="px-6 py-6 space-y-6">
              {/* Defect Number — auto-generated preview */}
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/60">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Defect Number
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-slate-700">
                    {generateNextDefectNumber()}
                  </span>
                  <span className="text-slate-400 text-xs">
                    (auto-generated)
                  </span>
                </div>
              </div>

              {/* ── Title ───────────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="defect-title"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleRef}
                  id="defect-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleBlur('title')}
                  placeholder="Brief description of the defect"
                  maxLength={MAX_TITLE}
                  disabled={loading}
                  tabIndex={1}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400
                    transition-all duration-150
                    ${
                      fieldErrors.title && touched.title
                        ? 'border-rose-300 ring-2 ring-rose-100'
                        : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between mt-1.5">
                  {fieldErrors.title && touched.title ? (
                    <p
                      className="text-xs text-rose-500"
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
                  htmlFor="defect-description"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="defect-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="Detailed description of the defect..."
                  rows={4}
                  maxLength={MAX_DESCRIPTION}
                  disabled={loading}
                  tabIndex={2}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl resize-none text-slate-900 placeholder-slate-400
                    transition-all duration-150
                    ${
                      fieldErrors.description && touched.description
                        ? 'border-rose-300 ring-2 ring-rose-100'
                        : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between mt-1.5">
                  {fieldErrors.description && touched.description ? (
                    <p
                      className="text-xs text-rose-500"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Location */}
                <div>
                  <label
                    htmlFor="defect-location"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                  >
                    Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="defect-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => handleBlur('location')}
                    placeholder="e.g., Building A, Floor 2"
                    maxLength={MAX_LOCATION}
                    disabled={loading}
                    tabIndex={3}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400
                      transition-all duration-150
                      ${
                        fieldErrors.location && touched.location
                          ? 'border-rose-300 ring-2 ring-rose-100'
                          : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  <div className="flex justify-between mt-1.5">
                    {fieldErrors.location && touched.location ? (
                      <p className="text-xs text-rose-500" role="alert">
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
                    htmlFor="defect-standard-ref"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                  >
                    Standard Reference{' '}
                    <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    id="defect-standard-ref"
                    type="text"
                    value={standardReference}
                    onChange={(e) => setStandardReference(e.target.value)}
                    onBlur={() => handleBlur('standardReference')}
                    placeholder="e.g., AS 3500; 4.18.1"
                    maxLength={MAX_STANDARD_REF}
                    disabled={loading}
                    tabIndex={4}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400
                      transition-all duration-150
                      ${
                        fieldErrors.standardReference && touched.standardReference
                          ? 'border-rose-300 ring-2 ring-rose-100'
                          : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  <div className="flex justify-between mt-1.5">
                    {fieldErrors.standardReference && touched.standardReference ? (
                      <p className="text-xs text-rose-500" role="alert">
                        {fieldErrors.standardReference}
                      </p>
                    ) : standardReference ? (
                      <p className={`text-xs ${standardRefValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {standardRefValid ? '✓ Valid format' : '⚠ Format: AS XXXX.X; X.X.X'}
                      </p>
                    ) : (
                      <span />
                    )}
                    <CharCounter current={standardReference.length} max={MAX_STANDARD_REF} />
                  </div>
                </div>
              </div>

              {/* ── Severity + Status (side by side) ────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Severity */}
                <div>
                  <label
                    htmlFor="defect-severity"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                  >
                    Severity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="defect-severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                    onBlur={() => handleBlur('severity')}
                    disabled={loading}
                    tabIndex={5}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-900
                      transition-all duration-150
                      ${
                        fieldErrors.severity && touched.severity
                          ? 'border-rose-300 ring-2 ring-rose-100'
                          : 'border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {SEVERITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.severity && touched.severity && (
                    <p className="text-xs text-rose-500 mt-1.5" role="alert">
                      {fieldErrors.severity}
                    </p>
                  )}
                </div>

                {/* Status — defaults to TODO, hidden from user for create */}
                <div>
                  <label
                    htmlFor="defect-status"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="defect-status"
                    value={status}
                    disabled
                    tabIndex={-1}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed"
                  >
                    <option value="TODO">To Do</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">
                    New defects start as To Do
                  </p>
                </div>
              </div>

              {/* ── Images ──────────────────────────────────────────── */}
              <div className="border-t border-slate-100 pt-6">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                  Images{' '}
                  <span className="text-slate-400 font-normal normal-case">
                    (max {MAX_IMAGES})
                  </span>
                </label>
                {loading && <ImageSkeleton count={2} className="mb-3" />}
                <ImageUpload
                  onUpload={setImages}
                  existingImages={images}
                  maxFiles={MAX_IMAGES}
                />
              </div>

              {/* ── Notes ───────────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="defect-notes"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Notes{' '}
                  <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  id="defect-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about the defect..."
                  rows={3}
                  maxLength={MAX_NOTES}
                  disabled={loading}
                  tabIndex={6}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl resize-none text-slate-900 placeholder-slate-400
                    transition-all duration-150 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <CharCounter current={notes.length} max={MAX_NOTES} className="mt-1.5 text-right" />
              </div>
            </div>

            {/* ── Footer / Actions ──────────────────────────────────── */}
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                tabIndex={7}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                tabIndex={8}
                className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? (
                  <ModalSpinner size="sm" label="Creating..." />
                ) : (
                  'Create Defect'
                )}
              </button>
            </div>
          </form>
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
