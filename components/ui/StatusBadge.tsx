'use client';

import React from 'react';
import { Circle, Loader2, CheckCircle2 } from 'lucide-react';
import { statusMetadata } from '@/lib/status';
import type { DefectStatus } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  /** The defect status to display */
  status: DefectStatus;
  /** Size variant — defaults to 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the status icon — defaults to true */
  showIcon?: boolean;
  /** Show loading spinner instead of status icon */
  isLoading?: boolean;
  /** Additional className to append */
  className?: string;
}

// ─── Icon Map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Circle,
  Loader2,
  CheckCircle2,
};

// ─── Size Classes ────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const ICON_SIZE_CLASSES: Record<string, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * StatusBadge — Reusable badge displaying a defect status with icon and color.
 *
 * Reads badge classes and icon name from `statusMetadata` in `@/lib/status`.
 * Supports three size variants and an optional loading state that replaces
 * the status icon with an animated spinner.
 */
export default function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  isLoading = false,
  className = '',
}: StatusBadgeProps) {
  const meta = statusMetadata[status];
  const sizeClasses = SIZE_CLASSES[size];
  const iconSizeClasses = ICON_SIZE_CLASSES[size];

  const IconComponent = showIcon && !isLoading
    ? ICON_MAP[meta.icon]
    : null;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${meta.badgeClasses}
        ${sizeClasses}
        ${className}
      `}
    >
      {/* Icon or loading spinner */}
      {isLoading ? (
        <Loader2 className={`${iconSizeClasses} animate-spin`} />
      ) : IconComponent ? (
        <IconComponent className={iconSizeClasses} />
      ) : null}

      {/* Label */}
      {meta.label}
    </span>
  );
}
