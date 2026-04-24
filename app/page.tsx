import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            6 Harmony Street Defect Tracker
          </h1>
          <p className="text-sm text-gray-600">
            Calamvale, QLD • Coral Homes Build
          </p>
        </div>
      </header>
      <KanbanBoard />
    </main>
  );
}
