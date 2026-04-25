// Status + Severity Metadata Constants
// 6 Harmony Street Defect Tracker — Foundation F-03

import type { DefectStatus, DefectSeverity } from '@/types';

// ─── Status Constants ───────────────────────────────────────────────────────

export const DEFECT_STATUSES: DefectStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export const DEFECT_SEVERITIES: DefectSeverity[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];

// ─── Status Metadata ────────────────────────────────────────────────────────

export interface StatusMetadata {
  label: string;
  description: string;
  badgeClasses: string;
  icon: string;
}

export interface SeverityMetadata {
  label: string;
  description: string;
  badgeClasses: string;
  icon: string;
}

export const statusMetadata: Record<DefectStatus, StatusMetadata> = {
  TODO: {
    label: 'To Do',
    description: 'Defect identified, awaiting action',
    badgeClasses: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: 'Circle',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Work is actively underway',
    badgeClasses: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: 'Loader2',
  },
  DONE: {
    label: 'Done',
    description: 'Defect has been resolved',
    badgeClasses: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: 'CheckCircle2',
  },
};

// ─── Severity Metadata ──────────────────────────────────────────────────────

export const severityMetadata: Record<DefectSeverity, SeverityMetadata> = {
  CRITICAL: {
    label: 'Critical',
    description: 'Structural or safety issue — immediate action required',
    badgeClasses: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: 'OctagonAlert',
  },
  HIGH: {
    label: 'High',
    description: 'Major functional defect — needs prompt attention',
    badgeClasses: 'bg-orange-100 text-orange-900 border-orange-300',
    icon: 'AlertTriangle',
  },
  MEDIUM: {
    label: 'Medium',
    description: 'Minor or cosmetic defect — standard priority',
    badgeClasses: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: 'AlertCircle',
  },
  LOW: {
    label: 'Low',
    description: 'Observation — low impact, address when convenient',
    badgeClasses: 'bg-slate-200 text-slate-800 border-slate-300',
    icon: 'Info',
  },
};

// ─── Valid Status Transitions ───────────────────────────────────────────────

// Each status maps to an array of valid next statuses.
// A status cannot transition to itself.
const VALID_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  TODO: ['IN_PROGRESS', 'DONE'],
  IN_PROGRESS: ['TODO', 'DONE'],
  DONE: ['IN_PROGRESS', 'TODO'],
};

// Transitions that require user confirmation before executing.
const REQUIRES_CONFIRMATION: Set<string> = new Set([
  'TODO->DONE',
  'IN_PROGRESS->TODO',
  'DONE->IN_PROGRESS',
  'DONE->TODO',
]);

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Returns the Tailwind badge classes for a given defect status.
 * Includes background, text, and border classes.
 */
export function getStatusColor(status: DefectStatus): string {
  return statusMetadata[status].badgeClasses;
}

/**
 * Returns the Lucide icon name for a given defect status.
 */
export function getStatusIcon(status: DefectStatus): string {
  return statusMetadata[status].icon;
}

/**
 * Returns the Tailwind badge classes for a given defect severity.
 * Includes background, text, and border classes.
 */
export function getSeverityColor(severity: DefectSeverity): string {
  return severityMetadata[severity].badgeClasses;
}

/**
 * Returns the Lucide icon name for a given defect severity.
 */
export function getSeverityIcon(severity: DefectSeverity): string {
  return severityMetadata[severity].icon;
}

/**
 * Checks whether a status transition is valid.
 * Returns true if the target status is in the allowed transitions list.
 */
export function isValidStatusTransition(
  from: DefectStatus,
  to: DefectStatus,
): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Checks whether a status transition requires user confirmation.
 * Skips-from-To-Done and any transition out of Done require confirmation.
 */
export function requiresStatusConfirmation(
  from: DefectStatus,
  to: DefectStatus,
): boolean {
  return REQUIRES_CONFIRMATION.has(`${from}->${to}`);
}
