import { Component, ReactNode } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <Alert color="red" title="エラーが発生しました">
          <Stack gap="sm">
            <Text size="sm">{this.state.error.message}</Text>
            <Button variant="light" onClick={this.retry}>
              再試行
            </Button>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}
