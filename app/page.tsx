import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PasscodeGate } from '@/components/PasscodeGate';

export default function Home() {
  return (
    <PasscodeGate>
      <main className="min-h-screen bg-slate-50">
        {/* Minimalist header */}
        <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                  6 Harmony Street
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Defect Tracker — Calamvale, QLD
                </p>
              </div>
              <div className="hidden sm:block">
                <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                  Coral Homes Build
                </span>
              </div>
            </div>
          </div>
        </header>
        <KanbanBoard />
      </main>
    </PasscodeGate>
  );
}
