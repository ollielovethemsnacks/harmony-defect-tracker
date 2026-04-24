import type { Defect, NewDefectFormData } from '@/types';
import type { ApiEnvelope } from '@/lib/validation/schemas';

// ---------------------------------------------------------------------------
// Typed API Client — 6 Harmony Street Defect Tracker
// All functions throw on error so callers can handle failures uniformly.
// ---------------------------------------------------------------------------

/** Base path for defect API endpoints. */
const BASE_URL = '/api/defects';

/**
 * Perform a fetch and handle the standardized API envelope.
 * Throws an `Error` when `success` is false or the response is not ok.
 */
async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const envelope: ApiEnvelope<T> = await response.json();

  if (!response.ok || !envelope.success) {
    const message =
      envelope.error ??
      envelope.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  // envelope.data is guaranteed when success === true, but guard for safety
  if (envelope.data === undefined) {
    throw new Error('Server returned success with no data');
  }

  return envelope.data as T;
}

// ---------------------------------------------------------------------------
// GET /api/defects  — List active defects
// ---------------------------------------------------------------------------

/**
 * Fetch all active (non-deleted) defects.
 * @param includeDeleted — When true, soft-deleted defects are also returned.
 */
export async function getDefects(includeDeleted = false): Promise<Defect[]> {
  const params = new URLSearchParams();
  if (includeDeleted) params.set('includeDeleted', 'true');

  const query = params.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;

  return fetchJson<Defect[]>(url, { method: 'GET' });
}

// ---------------------------------------------------------------------------
// GET /api/defects/[id]  — Get single defect
// ---------------------------------------------------------------------------

/**
 * Fetch a single defect by its UUID.
 * @param id — The defect's UUID.
 */
export async function getDefect(id: string): Promise<Defect> {
  return fetchJson<Defect>(`${BASE_URL}/${id}`, { method: 'GET' });
}

// ---------------------------------------------------------------------------
// POST /api/defects  — Create defect
// ---------------------------------------------------------------------------

/**
 * Create a new defect.
 * @param data — Defect form data (title, description, location, etc.).
 */
export async function createDefect(data: NewDefectFormData): Promise<Defect> {
  return fetchJson<Defect>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/defects/[id]  — Update defect
// ---------------------------------------------------------------------------

/**
 * Partially update an existing defect.
 * @param id — The defect's UUID.
 * @param data — Fields to update (partial).
 */
export async function updateDefect(
  id: string,
  data: Partial<NewDefectFormData>,
): Promise<Defect> {
  return fetchJson<Defect>(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/defects/[id]  — Soft delete defect
// ---------------------------------------------------------------------------

/**
 * Soft-delete a defect (sets deletedAt).
 * @param id — The defect's UUID.
 * @returns Confirmation object with id, defectNumber, deletedAt, deletedBy.
 */
export async function deleteDefect(id: string): Promise<{
  id: string;
  defectNumber: string;
  deletedAt: string;
  deletedBy: string;
}> {
  return fetchJson<{
    id: string;
    defectNumber: string;
    deletedAt: string;
    deletedBy: string;
  }>(`${BASE_URL}/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// PATCH /api/defects/[id]/restore  — Restore soft-deleted defect
// ---------------------------------------------------------------------------

/**
 * Restore a soft-deleted defect (clears deletedAt and deletedBy).
 * @param id — The defect's UUID.
 */
export async function restoreDefect(id: string): Promise<Defect> {
  return fetchJson<Defect>(`${BASE_URL}/${id}/restore`, {
    method: 'PATCH',
  });
}
