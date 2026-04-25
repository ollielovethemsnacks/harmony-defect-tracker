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

export function DefectCard({ defect, onClick, isOverlay }: DefectCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: defect.id,
    disabled: isOverlay, // Disable dragging on the overlay copy
  });

  // Visual states for drag interactions
  const dragStateClasses = isOverlay
    ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50 cursor-grabbing rotate-2 scale-105'
    : isDragging
    ? 'opacity-40 grayscale shadow-inner'
    : 'hover:shadow-md';

  const cursorClass = isOverlay ? 'cursor-grabbing' : 'cursor-auto';

  const handleClick = () => {
    if (onClick) {
      onClick(defect);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all relative w-full overflow-hidden touch-manipulation ${dragStateClasses} ${cursorClass}`}
      style={isOverlay ? { width: '320px' } : undefined}
    >
      {/* Drag handle - only this area initiates drag */}
      {/* Hidden on mobile since drag-and-drop isn't supported on touch devices */}
      <div
        {...listeners}
        className={`hidden sm:flex absolute top-2 right-2 p-2 sm:p-1.5 rounded text-gray-400 hover:text-gray-600 z-10 min-w-[44px] min-h-[44px] items-center justify-center sm:min-w-0 sm:min-h-0 ${
          isOverlay 
            ? 'cursor-grabbing bg-blue-50' 
            : 'cursor-grab hover:bg-gray-100 active:cursor-grabbing'
        }`}
        title="Drag to move"
      >
        {/* Responsive icon sizing: larger on mobile for touch */}
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

      {/* Card content - clicking here opens the modal */}
      {/* Responsive padding and font sizes */}
      <div
        onClick={handleClick}
        className="p-3 sm:p-4 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2 pr-10 sm:pr-8">
          <span className="text-[10px] sm:text-xs font-mono text-gray-500">{defect.defectNumber}</span>
          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${statusColors[defect.status]}`}>
            {defect.status.replace('_', ' ')}
          </span>
        </div>
        {/* Responsive title: slightly smaller on mobile */}
        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1 leading-tight">{defect.title}</h3>
        {/* Description with responsive line clamp */}
        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{defect.description}</p>
        {/* Footer with location and image count */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
          <span className="truncate max-w-[70%]">📍 {defect.location}</span>
          {(defect.images?.length || 0) > 0 && <span>📷 {defect.images?.length || 0}</span>}
        </div>
      </div>
    </div>
  );
}
