'use client';

import { useDraggable } from '@dnd-kit/core';
import { Defect, DefectStatus } from '@/types';

interface DefectCardProps {
  defect: Defect;
  onClick?: (defect: Defect) => void;
}

const statusColors: Record<DefectStatus, string> = {
  TODO: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
};

export function DefectCard({ defect, onClick }: DefectCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: defect.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const handleClick = () => {
    if (onClick) {
      onClick(defect);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">{defect.defectNumber}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[defect.status]}`}>
          {defect.status.replace('_', ' ')}
        </span>
      </div>
      <h3 className="font-medium text-gray-900 mb-1">{defect.title}</h3>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{defect.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>📍 {defect.location}</span>
        {defect.images?.length > 0 && <span>📷 {defect.images.length}</span>}
      </div>
    </div>
  );
}
