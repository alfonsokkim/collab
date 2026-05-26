import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || 'An unexpected error occurred';

    return (
      <div className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center bg-white px-6 dark:bg-[var(--bg)]"
        style={{ animation: 'landing-up 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10">
          <AlertTriangle size={26} className="text-red-500" strokeWidth={1.75} />
        </div>

        <h1 className="mb-3 text-center font-[var(--heading)] text-[32px] font-extrabold leading-tight tracking-[-1px] text-black sm:text-[40px] dark:text-white">
          Something went wrong.
        </h1>

        <p className="mb-2 max-w-[420px] text-center text-[17px] leading-[1.7] text-black/40 dark:text-white/40">
          An unexpected error crashed this page. Your data is safe.
        </p>

        <p className="mb-8 max-w-[420px] rounded-xl border border-[var(--border)] bg-[var(--bg-light)] px-4 py-2.5 text-center font-mono text-[12px] text-[var(--text-light)]">
          {message}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-black/12 bg-black/5 px-6 py-[11px] text-[14px] font-semibold text-black/70 transition hover:-translate-y-px hover:bg-black/8 hover:text-black dark:border-white/12 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <RefreshCw size={15} strokeWidth={2} />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-black/12 bg-white px-6 py-[11px] text-[14px] font-semibold text-black transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] dark:border-white/15 dark:bg-white dark:text-black"
          >
            <Home size={15} strokeWidth={2} />
            Go home
          </a>
        </div>
      </div>
    );
  }
}
