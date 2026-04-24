'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { Defect, DefectStatus } from '@/types';

const COLUMNS: DefectStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export function KanbanBoard() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      const res = await fetch('/api/defects');
      const data = await res.json();
      if (data.success) setDefects(data.data);
    } catch (error) {
      console.error('Failed to fetch defects:', error);
    } finally {
      setLoading(false);
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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 h-screen">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            defects={defects.filter((d) => d.status === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
