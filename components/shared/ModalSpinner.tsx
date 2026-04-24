'use client';

interface ModalSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
};

/**
 * Consistent spinner for use across all CRUD modals.
 * Uses Tailwind animate-spin with a clean half-circle design.
 */
export function ModalSpinner({ size = 'md', label, className = '' }: ModalSpinnerProps) {
  const sizeClass = SIZE_MAP[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status">
      <svg
        className={`animate-spin ${sizeClass} shrink-0`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden={label ? false : true}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <span className="text-sm">{label}</span>}
      {!label && <span className="sr-only">Loading…</span>}
    </span>
  );
}
