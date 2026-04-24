export type DefectStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Defect {
  id: string;
  defectNumber: string;
  title: string;
  description: string;
  location: string;
  standardReference: string;
  status: DefectStatus;
  severity?: DefectSeverity;
  notes?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
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
  description: string;
  location: string;
  standardReference: string;
  status: DefectStatus;
  severity?: DefectSeverity;
  notes?: string;
  images?: string[];
}

// Alias for compatibility
export type NewDefectFormData = NewDefect;

export interface NewComment {
  text: string;
}
