import * as React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = parsed.error;
            isFirebaseError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight">Application Error</h1>
            
            <div className="bg-muted/50 p-4 rounded-2xl text-sm font-mono text-left overflow-auto max-h-40 border border-border/50">
              {errorMessage}
            </div>

            {isFirebaseError && (
              <p className="text-sm text-muted-foreground">
                This appears to be a database connection issue. Please check your internet connection or Firebase configuration.
              </p>
            )}

            <Button 
              onClick={this.handleReset}
              className="w-full h-12 rounded-2xl font-bold gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
