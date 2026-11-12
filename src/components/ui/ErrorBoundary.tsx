import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ParkGrid UI error boundary caught:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleBackToDashboard = () => {
    this.setState({ hasError: false, message: "" });
    window.location.assign("/app");
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 px-6 py-12 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-navy-800/70 p-6 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-rose-300">
            Application Error
          </p>
          <h1 className="mt-2 text-lg font-semibold text-white">
            Something went wrong while rendering this view
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {this.state.message}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={this.handleReload}>
              Reload page
            </Button>
            <Button variant="secondary" onClick={this.handleBackToDashboard}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
