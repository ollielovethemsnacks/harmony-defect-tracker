'use client';

import { useState, useEffect } from 'react';

const CORRECT_PASSCODE = '44649';

interface PasscodeGateProps {
  children: React.ReactNode;
}

export function PasscodeGate({ children }: PasscodeGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check localStorage after hydration to avoid SSR mismatch
    const auth = localStorage.getItem('harmony-auth') === 'true';
    setIsAuthenticated(auth);
    setIsHydrated(true);
  }, []);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passcode === CORRECT_PASSCODE) {
      localStorage.setItem('harmony-auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Incorrect passcode. Please try again.');
      setPasscode('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('harmony-auth');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Show loading state during hydration to avoid SSR mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">
              6 Harmony Street
            </h1>
            <p className="text-sm text-slate-500">
              Defect Tracker
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="passcode"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-2"
              >
                Passcode
              </label>
              <input
                type="password"
                id="passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.2em] text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                placeholder="•••••"
                maxLength={5}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <p className="text-xs text-rose-600 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={passcode.length !== 5}
              className="w-full py-3 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Unlock
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400">
              Private application — authorized access only
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated - show the app with logout option
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="p-2.5 bg-white border border-slate-200/60 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          aria-label="Lock application"
          title="Lock"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>
      {children}
    </>
  );
}
