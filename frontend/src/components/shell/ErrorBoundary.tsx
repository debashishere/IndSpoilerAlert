import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="card error-boundary-fallback"
          style={{
            padding: '40px',
            textAlign: 'center',
            margin: '20px auto',
            maxWidth: '600px',
          }}
        >
          <h3 style={{ color: 'hsl(var(--error))', fontSize: '1.25rem', marginBottom: '12px' }}>
            Something went wrong in this view
          </h3>
          <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '20px', fontSize: '0.9rem' }}>
            {this.state.error.message}
          </p>
          <button
            className="btn btn-primary"
            onClick={this.handleReset}
            style={{ padding: '10px 20px', fontSize: '0.9rem', borderRadius: '8px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
