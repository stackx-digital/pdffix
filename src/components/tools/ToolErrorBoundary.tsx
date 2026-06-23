"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  toolName?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? "" };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === "development") {
      console.error("ToolErrorBoundary caught:", error);
    }
  }

  reset() {
    this.setState({ hasError: false, message: "" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 p-8 rounded-2xl border-2 border-dashed border-red-200 bg-red-50">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-gray-900">
              {this.props.toolName ? `${this.props.toolName} could not be loaded` : "Tool could not be loaded"}
            </h3>
            <p className="text-sm text-gray-500">
              Please reload the page or try a different PDF file.
            </p>
            {process.env.NODE_ENV === "development" && this.state.message && (
              <p className="text-xs text-red-400 font-mono mt-2 max-w-sm break-all">{this.state.message}</p>
            )}
          </div>
          <button
            onClick={() => this.reset()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
