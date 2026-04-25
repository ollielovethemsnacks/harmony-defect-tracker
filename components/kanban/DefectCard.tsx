'use client';

import { useDraggable } from '@dnd-kit/core';
import { Defect, DefectStatus } from '@/types';

interface DefectCardProps {
  defect: Defect;
  onClick?: (defect: Defect) => void;
  isOverlay?: boolean;
}

const statusColors: Record<DefectStatus, string> = {
  TODO: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
};

// Pure visual component - no drag logic at all
// Used by DragOverlay to render the floating card
function DefectCardVisual({ defect, onClick, isOverlay }: DefectCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(defect);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all relative overflow-hidden touch-manipulation ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50 cursor-grabbing rotate-2 scale-105'
          : 'hover:shadow-md'
      } ${isOverlay ? 'cursor-grabbing' : 'cursor-auto'}`}
      style={isOverlay ? { width: '320px' } : undefined}
    >
      {/* Drag handle - only on non-overlay cards, hidden on mobile */}
      {!isOverlay && (
        <div
          className="hidden sm:flex absolute top-2 right-2 p-2 sm:p-1.5 rounded text-gray-400 hover:text-gray-600 z-10 min-w-[44px] min-h-[44px] items-center justify-center sm:min-w-0 sm:min-h-0 cursor-grab hover:bg-gray-100 active:cursor-grabbing"
          title="Drag to move"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 sm:w-4 sm:h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      )}

      {/* Card content */}
      <div onClick={handleClick} className="p-3 sm:p-4 cursor-pointer">
        <div className="flex items-start justify-between mb-2 pr-10 sm:pr-8">
          <span className="text-[10px] sm:text-xs font-mono text-gray-500">{defect.defectNumber}</span>
          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusColors[defect.status]}`}>
            {defect.status.replace('_', ' ')}
          </span>
        </div>
        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1 leading-tight">{defect.title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{defect.description}</p>
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
          <span className="truncate max-w-[70%]">📍 {defect.location}</span>
          {(defect.images?.length || 0) > 0 && <span>📷 {defect.images?.length || 0}</span>}
        </div>
      </div>
    </div>
  );
}

// Draggable wrapper component - only used for actual cards in columns
function DraggableDefectCard({ defect, onClick }: { defect: Defect; onClick?: (defect: Defect) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: defect.id,
  });

  const handleClick = () => {
    if (onClick && !isDragging) {
      onClick(defect);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all relative overflow-hidden touch-manipulation ${
        isDragging ? 'opacity-40 grayscale shadow-inner' : 'hover:shadow-md'
      } cursor-auto`}
    >
      {/* Drag handle - has the listeners for drag initiation */}
      <div
        {...listeners}
        className="hidden sm:flex absolute top-2 right-2 p-2 sm:p-1.5 rounded text-gray-400 hover:text-gray-600 z-10 min-w-[44px] min-h-[44px] items-center justify-center sm:min-w-0 sm:min-h-0 cursor-grab hover:bg-gray-100 active:cursor-grabbing"
        title="Drag to move"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 sm:w-4 sm:h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      {/* Card content */}
      <div onClick={handleClick} className="p-3 sm:p-4 cursor-pointer">
        <div className="flex items-start justify-between mb-2 pr-10 sm:pr-8">
          <span className="text-[10px] sm:text-xs font-mono text-gray-500">{defect.defectNumber}</span>
          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusColors[defect.status]}`}>
            {defect.status.replace('_', ' ')}
          </span>
        </div>
        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1 leading-tight">{defect.title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{defect.description}</p>
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
          <span className="truncate max-w-[70%]">📍 {defect.location}</span>
          {(defect.images?.length || 0) > 0 && <span>📷 {defect.images?.length || 0}</span>}
        </div>
      </div>
    </div>
  );
}

// Main export - delegates to appropriate implementation
export function DefectCard({ defect, onClick, isOverlay }: DefectCardProps) {
  // CRITICAL: When isOverlay is true, render pure visual component
  // When false, render draggable wrapper with useDraggable hook
  // This ensures DragOverlay can position the overlay correctly without interference
  if (isOverlay) {
    return <DefectCardVisual defect={defect} onClick={onClick} isOverlay={true} />;
  }

  return <DraggableDefectCard defect={defect} onClick={onClick} />;
}
