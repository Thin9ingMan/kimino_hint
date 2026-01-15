import { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Code } from '@mantine/core';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enhanced Error Boundary with better error information
 * and retry functionality
 */
export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <Alert color="red" title="エラーが発生しました" mt="md">
          <Stack gap="sm">
            <Text size="sm">
              アプリケーションでエラーが発生しました。ページを再読み込みするか、もう一度お試しください。
            </Text>
            
            {import.meta.env.DEV && (
              <Code block>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </Code>
            )}
            
            <Stack gap="xs">
              <Button onClick={this.handleRetry} fullWidth>
                再試行
              </Button>
              <Button
                variant="default"
                onClick={() => window.location.href = '/home'}
                fullWidth
              >
                ホームへ戻る
              </Button>
            </Stack>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}
