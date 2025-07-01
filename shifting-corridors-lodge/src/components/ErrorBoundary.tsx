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

  const handleReportError = () => {
    // In a real app, this would send error reports to a service
    console.log('Error reported:', error);
    alert('Error report sent. Thank you for helping us improve!');
  };

  const getErrorType = (error?: Error): string => {
    if (!error) return 'unknown';
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      return 'parsing';
    }
    if (error.name === 'ChunkLoadError') {
      return 'chunk-load';
    }
    return 'application';
  };

  const getErrorMessage = (errorType: string): string => {
    switch (errorType) {
      case 'network':
        return 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.';
      case 'parsing':
        return 'We encountered an issue processing the content. This is usually temporary.';
      case 'chunk-load':
        return 'Failed to load part of the application. This often happens after updates.';
      default:
        return 'We encountered an unexpected error. Please try refreshing the page.';
    }
  };

  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(errorType);

  return (
    <div className={`error-boundary-fallback ${currentTheme.components.panel}`}>
      <div className="error-content">
        <h2 className="error-title">Oops! Something went wrong</h2>
        <p className="error-message">{errorMessage}</p>
        
        {errorType === 'network' && (
          <div className="error-suggestions">
            <h3>Try these steps:</h3>
            <ul>
              <li>Check your internet connection</li>
              <li>Disable any ad blockers temporarily</li>
              <li>Try refreshing the page</li>
              <li>Wait a moment and try again</li>
            </ul>
          </div>
        )}

        {errorType === 'chunk-load' && (
          <div className="error-suggestions">
            <h3>This usually fixes the issue:</h3>
            <ul>
              <li>Refresh the page (the app may have been updated)</li>
              <li>Clear your browser cache</li>
              <li>Try opening the site in a new tab</li>
            </ul>
          </div>
        )}
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Error Details (Development)</summary>
            <pre className="error-stack">
              <strong>Error Type:</strong> {errorType}
              <br />
              <strong>Message:</strong> {error.message}
              {error.stack && (
                <>
                  <br />
                  <br />
                  <strong>Stack Trace:</strong>
                  <br />
                  {error.stack}
                </>
              )}
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
          
          {process.env.NODE_ENV === 'production' && (
            <button 
              onClick={handleReportError}
              className={`report-button ${currentTheme.components.button}`}
              style={{ marginLeft: '10px' }}
            >
              Report Issue
            </button>
          )}
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