import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center space-y-4">
            <div className="inline-flex p-4 bg-rose-50 text-rose-600 rounded-2xl">
              <span className="font-extrabold text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Something went wrong</h2>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
              An unexpected rendering error occurred inside the application. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer shadow hover:shadow-md"
            >
              Refresh the page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
