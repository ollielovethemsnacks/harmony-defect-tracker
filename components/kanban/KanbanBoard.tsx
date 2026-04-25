'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { DefectDetailModal } from './DefectDetailModal';
import { CreateDefectModal } from './CreateDefectModal';
import { EditDefectModal } from './EditDefectModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Defect, DefectStatus } from '@/types';

const COLUMNS: DefectStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export function KanbanBoard() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      try {
        const res = await fetch('/api/defects');
        const data = await res.json();
        if (!cancelled && data.success) setDefects(data.data);
      } catch (error) {
        if (!cancelled) console.error('Failed to fetch defects:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    
    // Listen for defect-restored events to refresh the board
    const handleDefectRestored = () => {
      fetchDefects();
    };
    window.addEventListener('defect-restored', handleDefectRestored);
    
    return () => { 
      cancelled = true; 
      window.removeEventListener('defect-restored', handleDefectRestored);
    };
  }, []);

  const fetchDefects = async () => {
    try {
      const res = await fetch('/api/defects');
      const data = await res.json();
      if (data.success) setDefects(data.data);
    } catch (error) {
      console.error('Failed to fetch defects:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as DefectStatus;
    const defectId = active.id as string;

    try {
      await fetch(`/api/defects/${defectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDefects();
    } catch (error) {
      console.error('Failed to update defect:', error);
    }
  };

  // Modal handlers
  const handleDefectClick = (defect: Defect) => {
    setSelectedDefect(defect);
    setIsDetailModalOpen(true);
  };

  const handleCreateDefect = (defect: Defect) => {
    setDefects((prev) => [...prev, defect]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateDefect = (updatedDefect: Defect) => {
    setDefects((prev) =>
      prev.map((d) => (d.id === updatedDefect.id ? updatedDefect : d))
    );
    setSelectedDefect(updatedDefect);
  };

  const handleDeleteDefect = (defectId: string) => {
    setDefects((prev) => prev.filter((d) => d.id !== defectId));
    setIsDeleteModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedDefect(null);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <div className="p-4">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Defect
        </button>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-4 h-screen">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              defects={defects.filter((d) => d.status === status)}
              onDefectClick={handleDefectClick}
            />
          ))}
        </div>
      </DndContext>

      {/* Modals */}
      <CreateDefectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDefect}
      />

      <DefectDetailModal
        defect={selectedDefect}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDefect(null);
        }}
        onStatusChange={handleUpdateDefect}
        onEdit={() => {
          setIsDetailModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onDelete={() => {
          setIsDetailModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
      />

      {selectedDefect && (
        <>
          <EditDefectModal
            defect={selectedDefect}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={handleUpdateDefect}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            defect={{
              id: selectedDefect.id,
              defectNumber: selectedDefect.defectNumber,
              title: selectedDefect.title,
              location: selectedDefect.location,
            }}
            onDefectDeleted={handleDeleteDefect}
          />
        </>
      )}
    </>
  );
}
