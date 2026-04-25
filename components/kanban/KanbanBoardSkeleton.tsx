'use client';

/**
 * KanbanBoardSkeleton - Loading state for the Kanban board
 * Matches the structure of the actual board for perceived performance
 */
export function KanbanBoardSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 min-h-screen">
      {/* Three column skeletons */}
      {[1, 2, 3].map((col) => (
        <div
          key={col}
          className="flex-1 min-w-[300px] rounded-lg border-2 border-gray-200 bg-gray-50 p-4 animate-pulse"
        >
          {/* Column header skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-24 bg-gray-300 rounded" />
            <div className="h-6 w-8 bg-gray-300 rounded-full" />
          </div>

          {/* Card skeletons */}
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-5 w-full bg-gray-200 rounded mb-1" />
                <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
