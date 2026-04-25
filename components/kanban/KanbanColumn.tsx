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

const columnColors: Record<DefectStatus, { bg: string; border: string; indicator: string; text: string }> = {
  TODO: { bg: 'bg-amber-50', border: 'border-amber-200', indicator: 'bg-amber-500', text: 'text-amber-800' },
  IN_PROGRESS: { bg: 'bg-blue-50', border: 'border-blue-200', indicator: 'bg-blue-500', text: 'text-blue-800' },
  DONE: { bg: 'bg-emerald-50', border: 'border-emerald-200', indicator: 'bg-emerald-500', text: 'text-emerald-800' },
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
  const colors = columnColors[status];

  return (
    <div
      ref={setNodeRef}
      className={`w-full lg:min-w-[300px] lg:max-w-[380px] lg:flex-1 rounded-2xl border ${colors.bg} ${colors.border} ${
        isOver ? 'ring-2 ring-slate-400 ring-offset-2' : ''
      } p-4 flex flex-col h-auto lg:h-auto mb-4 lg:mb-0 transition-all`}
    >
      {/* Column header - minimalist */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${colors.indicator}`} />
          <h2 className="font-semibold text-sm text-slate-900">
            {columnTitles[status]}
          </h2>
          <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-300">
            {defects.length}
          </span>
        </div>
        <SortDropdown
          status={status}
          currentSort={currentSort}
          onSortChange={onSortChange}
        />
      </div>

      {/* Card container */}
      <div className="space-y-3 overflow-y-auto flex-1 min-h-[100px]">
        {defects.map((defect) => (
          <DefectCard
            key={defect.id}
            defect={defect}
            onClick={onDefectClick}
            isDragging={defect.id === activeDefectId}
          />
        ))}
        {defects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-300 rounded-xl bg-white">
            <svg className="w-8 h-8 mb-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium">No defects</span>
          </div>
        )}
      </div>
    </div>
  );
}
