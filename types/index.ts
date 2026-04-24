export type DefectStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Defect {
  id: string;
  defectNumber: string;
  title: string;
  description: string;
  location: string;
  standardReference: string;
  status: DefectStatus;
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
  images?: string[];
}

export interface NewComment {
  text: string;
}
