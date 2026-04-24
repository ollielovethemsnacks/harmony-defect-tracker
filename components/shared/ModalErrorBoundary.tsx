'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ModalErrorBoundaryProps {
  children: ReactNode;
  /** Called when an error is caught, before showing fallback. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Optional label for the recovery button. */
  recoverLabel?: string;
  /** Optional recovery action (e.g. reset form state). */
  onRecover?: () => void;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary wrapper for CRUD modals.
 * Catches render-time errors and shows a graceful fallback
 * instead of crashing the entire page.
 */
export class ModalErrorBoundary extends Component<
  ModalErrorBoundaryProps,
  ModalErrorBoundaryState
> {
  constructor(props: ModalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    // In development, log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[ModalErrorBoundary]', error, info.componentStack);
    }
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRecover?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 text-center space-y-4"
          role="alert"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            The form encountered an unexpected error. You can try again or
            close and reopen.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-auto max-h-32">
              <summary className="cursor-pointer font-medium">
                Error details (dev only)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="flex justify-center gap-3 pt-2">
            {this.props.onRecover && (
              <button
                type="button"
                onClick={this.handleRecover}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                {this.props.recoverLabel || 'Try Again'}
              </button>
            )}
            {this.props.children && (
              <button
                type="button"
                onClick={this.handleRecover}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
