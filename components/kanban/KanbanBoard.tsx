'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { DefectDetailModal } from './DefectDetailModal';
import { CreateDefectModal } from './CreateDefectModal';
import { EditDefectModal } from './EditDefectModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Defect, DefectStatus, SortField, SortDirection } from '@/types';
import { DefectCard } from './DefectCard';

const COLUMNS: DefectStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

// Default sort preferences for each column
const defaultSortPreferences: Record<DefectStatus, { field: SortField; direction: SortDirection }> = {
  TODO: { field: 'defectNumber', direction: 'asc' },
  IN_PROGRESS: { field: 'defectNumber', direction: 'asc' },
  DONE: { field: 'defectNumber', direction: 'asc' },
};

const columnTitles: Record<DefectStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const columnColors: Record<DefectStatus, { bg: string; text: string; border: string }> = {
  TODO: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  DONE: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
};

export function KanbanBoard() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortPreferences, setSortPreferences] = useState<Record<DefectStatus, { field: SortField; direction: SortDirection }>>(defaultSortPreferences);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragDefect, setActiveDragDefect] = useState<Defect | null>(null);
  
  // Mobile tab state
  const [activeMobileTab, setActiveMobileTab] = useState<DefectStatus>('TODO');
  
  // Modal states
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load sort preferences from localStorage and API on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // First try to load from localStorage for immediate display
        const savedPrefs = localStorage.getItem('kanbanSortPreferences');
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          setSortPreferences((prev) => ({ ...prev, ...parsed }));
        }

        // Then fetch from API to get server-side preferences
        const res = await fetch('/api/column-preferences');
        const data = await res.json();
        if (data.success && data.data) {
          const apiPrefs: Record<DefectStatus, { field: SortField; direction: SortDirection }> = {
            TODO: { field: 'defectNumber', direction: 'asc' },
            IN_PROGRESS: { field: 'defectNumber', direction: 'asc' },
            DONE: { field: 'defectNumber', direction: 'asc' },
          };
          
          for (const [status, pref] of Object.entries(data.data)) {
            if (pref && typeof pref === 'object' && 'sortField' in pref && 'sortDirection' in pref) {
              apiPrefs[status as DefectStatus] = {
                field: pref.sortField as SortField,
                direction: pref.sortDirection as SortDirection,
              };
            }
          }
          
          setSortPreferences(apiPrefs);
          localStorage.setItem('kanbanSortPreferences', JSON.stringify(apiPrefs));
        }
      } catch (error) {
        console.error('Failed to load sort preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Fetch defects
  const fetchDefects = useCallback(async () => {
    try {
      const res = await fetch('/api/defects');
      const data = await res.json();
      if (data.success) setDefects(data.data);
    } catch (error) {
      console.error('Failed to fetch defects:', error);
    }
  }, []);

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
  }, [fetchDefects]);

  // Sort defects for each column based on its sort preference
  const getSortedDefects = useCallback((status: DefectStatus) => {
    const columnDefects = defects.filter((d) => d.status === status);
    const { field, direction } = sortPreferences[status];

    return [...columnDefects].sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'defectNumber':
          comparison = a.defectNumber.localeCompare(b.defectNumber);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'severity': {
          const severityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
          const aSev = severityOrder[a.severity || 'MEDIUM'];
          const bSev = severityOrder[b.severity || 'MEDIUM'];
          comparison = aSev - bSev;
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'sortOrder':
          comparison = (a.sortOrder || 0) - (b.sortOrder || 0);
          break;
        default:
          comparison = a.defectNumber.localeCompare(b.defectNumber);
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }, [defects, sortPreferences]);

  // Handle sort change
  const handleSortChange = useCallback(async (status: DefectStatus, field: SortField, direction: SortDirection) => {
    const newPreferences = { ...sortPreferences, [status]: { field, direction } };
    setSortPreferences(newPreferences);
    
    // Save to localStorage for immediate persistence
    localStorage.setItem('kanbanSortPreferences', JSON.stringify(newPreferences));
    
    // Save to API for server-side persistence
    try {
      await fetch('/api/column-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnStatus: status,
          sortField: field,
          sortDirection: direction,
        }),
      });
    } catch (error) {
      console.error('Failed to save sort preference:', error);
    }
  }, [sortPreferences]);

  const handleDragStart = (event: DragStartEvent) => {
    const defectId = event.active.id as string;
    const defect = defects.find((d) => d.id === defectId);
    setActiveDragId(defectId);
    setActiveDragDefect(defect || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragDefect(null);
    
    if (!over) return;

    const newStatus = over.id as DefectStatus;
    const defectId = active.id as string;

    // Find the defect being moved
    const defect = defects.find((d) => d.id === defectId);
    if (!defect || defect.status === newStatus) return;

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
      {/* Mobile Tab Navigation - Only visible on small screens */}
      <div className="lg:hidden px-4 mb-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {COLUMNS.map((status) => {
            const count = defects.filter((d) => d.status === status).length;
            const colors = columnColors[status];
            const isActive = activeMobileTab === status;
            return (
              <button
                key={status}
                onClick={() => setActiveMobileTab(status)}
                className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.text} shadow-sm`
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="block truncate">{columnTitles[status]}</span>
                <span className={`text-[10px] ${isActive ? colors.text : 'text-gray-500'}`}>
                  {count} items
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop: Show all columns side by side */}
        <div className="hidden lg:flex lg:flex-row gap-4 p-4 min-h-screen">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              defects={getSortedDefects(status)}
              currentSort={sortPreferences[status]}
              onDefectClick={handleDefectClick}
              onSortChange={handleSortChange}
              activeDefectId={activeDragId || undefined}
            />
          ))}
        </div>

        {/* Mobile: Show only active tab */}
        <div className="lg:hidden p-4">
          <KanbanColumn
            status={activeMobileTab}
            defects={getSortedDefects(activeMobileTab)}
            currentSort={sortPreferences[activeMobileTab]}
            onDefectClick={handleDefectClick}
            onSortChange={handleSortChange}
            activeDefectId={activeDragId || undefined}
          />
        </div>

        {/* DragOverlay - renders the floating dragged item */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeDragDefect ? (
            <div className="w-[320px] lg:w-[360px] transform rotate-2 scale-105">
              <DefectCard 
                defect={activeDragDefect} 
                isOverlay 
              />
            </div>
          ) : null}
        </DragOverlay>
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
              location: selectedDefect.location ?? '',
            }}
            onDefectDeleted={handleDeleteDefect}
          />
        </>
      )}
    </>
  );
}