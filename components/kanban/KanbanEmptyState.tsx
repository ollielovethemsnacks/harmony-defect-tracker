'use client';

import { ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { CreateDefectModal } from './CreateDefectModal';

interface KanbanEmptyStateProps {
  onRefresh: () => void;
}

/**
 * KanbanEmptyState - Empty state when no defects exist
 */
export function KanbanEmptyState({ onRefresh }: KanbanEmptyStateProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDefectCreated = () => {
    setIsCreateModalOpen(false);
    onRefresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-blue-600" aria-hidden="true" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Defects Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Get started by creating your first defect. This will help you track issues throughout the construction process.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create First Defect
          </button>
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <CreateDefectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleDefectCreated}
      />
    </div>
  );
}
