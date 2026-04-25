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
  TODO: { bg: 'bg-amber-50/30', border: 'border-amber-200/30', indicator: 'bg-amber-500', text: 'text-amber-700' },
  IN_PROGRESS: { bg: 'bg-indigo-50/30', border: 'border-indigo-200/30', indicator: 'bg-indigo-500', text: 'text-indigo-700' },
  DONE: { bg: 'bg-emerald-50/30', border: 'border-emerald-200/30', indicator: 'bg-emerald-500', text: 'text-emerald-700' },
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
          <h2 className="font-semibold text-sm text-slate-800">
            {columnTitles[status]}
          </h2>
          <span className="px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium text-slate-500 border border-slate-200/50">
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
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">No defects</span>
          </div>
        )}
      </div>
    </div>
  );
}
