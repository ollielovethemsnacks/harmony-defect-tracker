'use client';

import { useDraggable } from '@dnd-kit/core';
import { Defect, DefectStatus } from '@/types';
import { MapPin, Image as ImageIcon, GripVertical } from 'lucide-react';

interface DefectCardProps {
  defect: Defect;
  onClick?: (defect: Defect) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
}

const statusColors: Record<DefectStatus, { bg: string; text: string; dot: string }> = {
  TODO: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  IN_PROGRESS: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  DONE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

// Pure visual component - no drag logic at all
// Used by DragOverlay to render the floating card
function DefectCardVisual({ defect, onClick, isOverlay }: DefectCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(defect);
    }
  };

  const statusStyle = statusColors[defect.status];

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 transition-all relative overflow-hidden touch-manipulation ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-slate-400/50 cursor-grabbing rotate-1 scale-[1.02]'
          : 'shadow-sm hover:shadow-md hover:border-slate-300'
      } ${isOverlay ? 'cursor-grabbing' : 'cursor-auto'}`}
      style={isOverlay ? { width: '320px' } : undefined}
    >
      {/* Drag handle - only on non-overlay cards, hidden on mobile */}
      {!isOverlay && (
        <div
          className="hidden sm:flex absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-600 z-10 items-center justify-center cursor-grab hover:bg-slate-100 active:cursor-grabbing transition-colors"
          title="Drag to move"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Card content */}
      <div onClick={handleClick} className="p-4 cursor-pointer">
        {/* Header: Defect number and status */}
        <div className="flex items-center gap-2 mb-2 pr-8">
          <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
            {defect.defectNumber}
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
            {defect.status.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm text-slate-900 mb-1.5 leading-snug line-clamp-2">
          {defect.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
          {defect.description}
        </p>

        {/* Footer: Location and image count */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{defect.location}</span>
          </div>
          {(defect.images?.length || 0) > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <ImageIcon className="w-3 h-3" />
              <span>{defect.images?.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Draggable wrapper component - only used for actual cards in columns
function DraggableDefectCard({ defect, onClick, isDragging }: { defect: Defect; onClick?: (defect: Defect) => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: defect.id,
  });

  const handleClick = () => {
    if (onClick && !isDragging) {
      onClick(defect);
    }
  };

  const statusStyle = statusColors[defect.status];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`bg-white rounded-xl border transition-all relative overflow-hidden touch-manipulation ${
        isDragging
          ? 'opacity-40 grayscale border-slate-200'
          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      } cursor-auto`}
    >
      {/* Drag handle - has the listeners for drag initiation */}
      <div
        {...listeners}
        className="hidden sm:flex absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-600 z-10 items-center justify-center cursor-grab hover:bg-slate-100 active:cursor-grabbing transition-colors"
        title="Drag to move"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Card content */}
      <div onClick={handleClick} className="p-4 cursor-pointer">
        {/* Header: Defect number and status */}
        <div className="flex items-center gap-2 mb-2 pr-8">
          <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
            {defect.defectNumber}
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
            {defect.status.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm text-slate-900 mb-1.5 leading-snug line-clamp-2">
          {defect.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
          {defect.description}
        </p>

        {/* Footer: Location and image count */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{defect.location}</span>
          </div>
          {(defect.images?.length || 0) > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <ImageIcon className="w-3 h-3" />
              <span>{defect.images?.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main export - delegates to appropriate implementation
export function DefectCard({ defect, onClick, isOverlay, isDragging }: DefectCardProps) {
  // CRITICAL: When isOverlay is true, render pure visual component
  // When false, render draggable wrapper with useDraggable hook
  // This ensures DragOverlay can position the overlay correctly without interference
  if (isOverlay) {
    return <DefectCardVisual defect={defect} onClick={onClick} isOverlay={true} />;
  }

  return <DraggableDefectCard defect={defect} onClick={onClick} isDragging={isDragging} />;
}
