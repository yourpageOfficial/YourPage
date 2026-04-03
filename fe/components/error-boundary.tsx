"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <p className="text-4xl mb-4">😵</p>
          <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Halaman ini mengalami error. Coba refresh.</p>
          <Button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>Refresh</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
