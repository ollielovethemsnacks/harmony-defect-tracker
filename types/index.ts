export type DefectStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Defect {
  id: string;
  defectNumber: string;
  title: string;
  description: string | null;
  location: string | null;
  standardReference: string | null;
  status: DefectStatus;
  severity: DefectSeverity;
  notes: string | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  deletedAt: string | null;
  deletedBy: string | null;
  sortOrder?: number;
}

export type SortField = 'defectNumber' | 'createdAt' | 'updatedAt' | 'severity' | 'title' | 'sortOrder';
export type SortDirection = 'asc' | 'desc';

export interface ColumnSortPreference {
  columnStatus: DefectStatus;
  sortField: SortField;
  sortDirection: SortDirection;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

export interface Comment {
  id: string;
  defectId: string;
  text: string;
  createdAt: string;
}

export interface NewDefect {
  defectNumber: string;
  title: string;
  description?: string | null;
  location?: string | null;
  standardReference?: string | null;
  status?: DefectStatus;
  severity?: DefectSeverity;
  notes?: string | null;
  images?: string[];
}

// Alias for compatibility
export type NewDefectFormData = NewDefect;

export interface NewComment {
  text: string;
}
