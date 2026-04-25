'use client';

import { useDroppable } from '@dnd-kit/core';
import { Defect, DefectStatus } from '@/types';
import { DefectCard } from './DefectCard';
import { Circle, Loader2, CheckCircle2 } from 'lucide-react';

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

const columnIconColors: Record<DefectStatus, string> = {
  TODO: 'text-amber-600',
  IN_PROGRESS: 'text-blue-600',
  DONE: 'text-green-600',
};

const columnIcons: Record<DefectStatus, typeof Circle> = {
  TODO: Circle,
  IN_PROGRESS: Loader2,
  DONE: CheckCircle2,
};

interface KanbanColumnProps {
  status: DefectStatus;
  defects: Defect[];
}

export function KanbanColumn({ status, defects }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const Icon = columnIcons[status];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[300px] rounded-lg border-2 p-4 transition-all duration-200
        ${columnColors[status]}
        ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 scale-[1.02]' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${columnIconColors[status]} ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} aria-hidden="true" />
          <h2 className="font-semibold text-gray-700">
            {columnTitles[status]}
          </h2>
        </div>
        <span className="bg-white px-2.5 py-1 rounded-full text-sm font-medium text-gray-600 shadow-sm">
          {defects.length}
        </span>
      </div>

      {/* Defect Cards */}
      <div className="space-y-3 min-h-[100px]">
        {defects.length === 0 ? (
          <ColumnEmptyState status={status} isOver={isOver} />
        ) : (
          defects.map((defect) => (
            <DefectCard key={defect.id} defect={defect} />
          ))
        )}
      </div>
    </div>
  );
}

interface ColumnEmptyStateProps {
  status: DefectStatus;
  isOver: boolean;
}

function ColumnEmptyState({ status, isOver }: ColumnEmptyStateProps) {
  const messages: Record<DefectStatus, string> = {
    TODO: 'No defects to do',
    IN_PROGRESS: 'No defects in progress',
    DONE: 'No completed defects',
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed
        transition-all duration-200
        ${isOver
          ? 'border-blue-400 bg-blue-50/50 scale-105'
          : 'border-gray-300 bg-gray-50/50'
        }
      `}
    >
      <div className="text-gray-400 mb-2">
        {isOver ? (
          <span className="text-blue-500 font-medium">Drop here</span>
        ) : (
          <span className="text-sm">{messages[status]}</span>
        )}
      </div>
    </div>
  );
}
