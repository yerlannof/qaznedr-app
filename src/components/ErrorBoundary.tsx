'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackError } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    trackError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Произошла ошибка при загрузке этой части страницы. Мы уже
              уведомлены о проблеме.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
              >
                Перезагрузить страницу
              </button>
              <div>
                <button
                  onClick={() =>
                    this.setState({
                      hasError: false,
                      error: undefined,
                      errorInfo: undefined,
                    })
                  }
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Детали ошибки (только в разработке)
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                    {this.state.errorInfo && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook для использования ErrorBoundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Async Error Boundary для Server Components
export function AsyncErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Ошибка загрузки
              </h3>
              <p className="text-sm text-muted-foreground">
                Не удалось загрузить данные. Попробуйте обновить страницу.
              </p>
            </div>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
