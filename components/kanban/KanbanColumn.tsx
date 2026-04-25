'use client';

import { useDroppable } from '@dnd-kit/core';
import { Defect, DefectStatus } from '@/types';
import { DefectCard } from './DefectCard';

const columnTitles: Record<DefectStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const columnColors: Record<DefectStatus, string> = {
  TODO: 'bg-amber-50 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 border-blue-200',
  DONE: 'bg-green-50 border-green-200',
};

interface KanbanColumnProps {
  status: DefectStatus;
  defects: Defect[];
  onDefectClick?: (defect: Defect) => void;
}

export function KanbanColumn({ status, defects, onDefectClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[300px] max-w-[400px] rounded-lg border-2 ${columnColors[status]} p-4 flex flex-col h-full`}
    >
      <h2 className="font-semibold text-gray-700 mb-4 flex items-center justify-between flex-shrink-0">
        {columnTitles[status]}
        <span className="bg-white px-2 py-1 rounded-full text-sm">{defects.length}</span>
      </h2>
      <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
        {defects.map((defect) => (
          <DefectCard key={defect.id} defect={defect} onClick={onDefectClick} />
        ))}
      </div>
    </div>
  );
}
