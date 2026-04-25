'use client';

import { useDraggable } from '@dnd-kit/core';
import { Defect, DefectStatus } from '@/types';
import { MapPin, Image as ImageIcon } from 'lucide-react';
import { useState, useCallback } from 'react';
import { DefectDetailModal } from './DefectDetailModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface DefectCardProps {
  defect: Defect;
}

const statusColors: Record<DefectStatus, string> = {
  TODO: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
};

export function DefectCard({ defect }: DefectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: defect.id,
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsDetailModalOpen(true);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      setIsDeleteModalOpen(true);
    }
  }, []);

  const handleDefectDeleted = () => {
    // Trigger a refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('defect-deleted', { detail: { defectId: defect.id } }));
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => setIsDetailModalOpen(true)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Defect ${defect.defectNumber}: ${defect.title}. Press Enter to view details, Delete to remove.`}
        className={`
          bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move
          hover:shadow-md hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          active:scale-[0.98]
          transition-all duration-150
          ${isDragging ? 'opacity-50 rotate-2 scale-105 shadow-xl z-50' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-mono text-gray-500">{defect.defectNumber}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[defect.status]}`}
            aria-label={`Status: ${defect.status.replace('_', ' ')}`}
          >
            {defect.status.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2" title={defect.title}>
          {defect.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {defect.description || 'No description provided'}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1 truncate" title={defect.location}>
            <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{defect.location}</span>
          </div>
          {defect.images?.length > 0 && (
            <div className="flex items-center gap-1" aria-label={`${defect.images.length} images`}>
              <ImageIcon className="w-3 h-3" aria-hidden="true" />
              <span>{defect.images.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DefectDetailModal
        defect={defect}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onStatusChange={(updatedDefect) => {
          // Trigger refresh
          window.dispatchEvent(new CustomEvent('defect-updated', { detail: { defectId: updatedDefect.id } }));
        }}
        onEdit={() => {
          setIsDetailModalOpen(false);
          // Open edit modal (could be implemented)
        }}
        onDelete={() => {
          setIsDetailModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        defect={defect}
        onDefectDeleted={handleDefectDeleted}
      />
    </>
  );
}
