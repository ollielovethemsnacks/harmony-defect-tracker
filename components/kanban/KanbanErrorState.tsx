'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface KanbanErrorStateProps {
  message: string;
  onRetry: () => void;
}

/**
 * KanbanErrorState - Error state for when defect loading fails
 */
export function KanbanErrorState({ message, onRetry }: KanbanErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-red-900 mb-2">
          Failed to Load Defects
        </h2>
        <p className="text-red-700 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>
      </div>
    </div>
  );
}
