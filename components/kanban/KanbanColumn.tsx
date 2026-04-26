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

const columnColors: Record<DefectStatus, { bg: string; border: string; indicator: string; text: string; headerBg: string; headerBorder: string }> = {
  TODO: { bg: 'bg-[#fffbeb]', border: 'border-amber-200', indicator: 'bg-amber-500', text: 'text-amber-900', headerBg: 'bg-white', headerBorder: 'border-t-amber-500' },
  IN_PROGRESS: { bg: 'bg-[#eff6ff]', border: 'border-blue-200', indicator: 'bg-blue-500', text: 'text-blue-900', headerBg: 'bg-white', headerBorder: 'border-t-blue-500' },
  DONE: { bg: 'bg-[#ecfdf5]', border: 'border-emerald-200', indicator: 'bg-emerald-500', text: 'text-emerald-900', headerBg: 'bg-white', headerBorder: 'border-t-emerald-500' },
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
      {/* Column header - high contrast */}
      <div className={`flex items-center justify-between mb-4 flex-shrink-0 p-3 bg-white rounded-xl border border-slate-200 shadow-sm`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`} />
          <h2 className="font-semibold text-sm text-slate-900">
            {columnTitles[status]}
          </h2>
          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-800">
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
