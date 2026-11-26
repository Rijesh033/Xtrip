import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('XTRIP ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--xt-bg)] text-[var(--xt-text)] p-6">
          <div className="max-w-md w-full rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-6 space-y-4">
            <div className="flex items-center gap-3 text-[var(--xt-danger)]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="font-display text-xl font-semibold text-[var(--xt-text)]">
                Something went wrong
              </h2>
            </div>
            <p className="text-sm text-[var(--xt-text-muted)] leading-relaxed">
              We hit an unexpected issue loading this view. Your trip data remains safely saved.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="w-full min-h-[44px] rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload XTRIP
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
