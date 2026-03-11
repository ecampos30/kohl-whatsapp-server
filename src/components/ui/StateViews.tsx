import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Inbox, Loader2 } from 'lucide-react';

/* ─── Loading skeleton ─────────────────────────────────────────────────── */

interface SkeletonProps {
  rows?: number;
  cards?: number;
}

export function LoadingSkeleton({ rows = 4, cards }: SkeletonProps) {
  if (cards) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 bg-gray-200 rounded w-full" />
              <div className="h-2.5 bg-gray-100 rounded w-5/6" />
              <div className="h-2.5 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2.5 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2 ml-11">
            <div className="h-2.5 bg-gray-200 rounded w-full" />
            <div className="h-2.5 bg-gray-100 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Spinner ──────────────────────────────────────────────────────────── */

export function LoadingSpinner({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────── */

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        {icon ?? <Inbox className="h-6 w-6 text-gray-400" />}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ─── Inline error with retry ──────────────────────────────────────────── */

interface InlineErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function InlineError({ title = 'Algo deu errado', message, onRetry }: InlineErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

/* ─── Save feedback toast ──────────────────────────────────────────────── */

interface SaveToastProps {
  visible: boolean;
  message?: string;
  error?: boolean;
}

export function SaveToast({ visible, message = 'Alteracoes salvas', error = false }: SaveToastProps) {
  if (!visible) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
      error
        ? 'bg-red-600 text-white'
        : 'bg-gray-900 text-white'
    }`}>
      {error
        ? <AlertTriangle className="h-4 w-4 shrink-0" />
        : <span className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-xs shrink-0">✓</span>
      }
      {message}
    </div>
  );
}

/* ─── Section-level Error Boundary ────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[SectionErrorBoundary]', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
          <div className="h-1 bg-red-500" />
          <InlineError
            title={`Erro ao carregar${this.props.sectionName ? ` "${this.props.sectionName}"` : ''}`}
            message="Esta secao encontrou um problema inesperado. Tente novamente ou recarregue a pagina."
            onRetry={this.handleRetry}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
