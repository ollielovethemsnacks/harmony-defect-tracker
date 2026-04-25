'use client';

import { useDroppable } from '@dnd-kit/core';
import { Defect, DefectStatus, SortField, SortDirection } from '@/types';
import { DefectCard } from './DefectCard';
import { SortDropdown } from './SortDropdown';

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
  currentSort: { field: SortField; direction: SortDirection };
  onDefectClick?: (defect: Defect) => void;
  onSortChange: (status: DefectStatus, field: SortField, direction: SortDirection) => void;
  activeDefectId?: string;
}

export function KanbanColumn({ status, defects, currentSort, onDefectClick, onSortChange, activeDefectId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`w-full lg:min-w-[280px] lg:max-w-[400px] lg:flex-1 rounded-lg border-2 ${columnColors[status]} ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      } p-3 lg:p-4 flex flex-col h-auto lg:h-auto mb-4 lg:mb-0 transition-all`}
    >
      {/* Responsive column header with sort controls */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
        <h2 className="font-semibold text-sm sm:text-base text-gray-700 flex items-center gap-2">
          {columnTitles[status]}
          <span className="bg-white px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm text-gray-600 border border-gray-200">
            {defects.length}
          </span>
        </h2>
        <SortDropdown
          status={status}
          currentSort={currentSort}
          onSortChange={onSortChange}
        />
      </div>
      {/* Card container with responsive spacing */}
      <div className="space-y-3 overflow-y-auto flex-1 min-h-[100px]">
        {defects.map((defect) => (
          <div
            key={defect.id}
            className={activeDefectId === defect.id ? 'opacity-30 grayscale' : ''}
          >
            <DefectCard defect={defect} onClick={onDefectClick} />
          </div>
        ))}
        {defects.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            No defects
          </div>
        )}
      </div>
    </div>
  );
}
