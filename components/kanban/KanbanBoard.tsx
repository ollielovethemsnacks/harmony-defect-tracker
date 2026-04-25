'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { Defect, DefectStatus } from '@/types';
import { KanbanBoardSkeleton } from './KanbanBoardSkeleton';
import { KanbanErrorState } from './KanbanErrorState';
import { KanbanEmptyState } from './KanbanEmptyState';

const COLUMNS: DefectStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export function KanbanBoard() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      try {
        setError(null);
        const res = await fetch('/api/defects');
        const data = await res.json();
        if (!cancelled) {
          if (data.success) {
            setDefects(data.data);
          } else {
            setError(data.message || 'Failed to load defects');
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch defects:', error);
          setError('Network error. Please check your connection and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, []);

  const fetchDefects = async () => {
    try {
      setError(null);
      const res = await fetch('/api/defects');
      const data = await res.json();
      if (data.success) {
        setDefects(data.data);
      } else {
        setError(data.message || 'Failed to refresh defects');
      }
    } catch (error) {
      console.error('Failed to fetch defects:', error);
      setError('Network error. Please try again.');
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
      setError('Failed to move defect. Please try again.');
    }
  };

  if (loading) return <KanbanBoardSkeleton />;
  if (error) return <KanbanErrorState message={error} onRetry={fetchDefects} />;
  if (defects.length === 0) return <KanbanEmptyState onRefresh={fetchDefects} />;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4 p-4 min-h-screen">
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
