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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              6 Harmony Street
            </h1>
            <p className="text-gray-600">Defect Tracker</p>
          </div>

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              🔒 This application is private. Please enter the passcode to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="passcode" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Passcode
              </label>
              <input
                type="password"
                id="passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="•••••"
                maxLength={5}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={passcode.length !== 5}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Unlock
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Secured Application</p>
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
          className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors opacity-80 hover:opacity-100"
        >
          🔒 Lock
        </button>
      </div>
      {children}
    </>
  );
}
