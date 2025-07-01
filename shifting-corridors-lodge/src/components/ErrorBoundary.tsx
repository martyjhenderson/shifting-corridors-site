import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTheme } from '../utils/ThemeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Error boundary component
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default error fallback component with theme support
const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
  const { currentTheme } = useTheme();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={`error-boundary-fallback ${currentTheme.components.panel}`}>
      <div className="error-content">
        <h2 className="error-title">Something went wrong</h2>
        <p className="error-message">
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Error Details (Development)</summary>
            <pre className="error-stack">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="error-actions">
          <button 
            onClick={handleRefresh}
            className={`refresh-button ${currentTheme.components.button}`}
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to provide theme context to error boundary
const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;