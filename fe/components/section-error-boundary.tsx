"use client";

import { Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; fallbackMessage?: string; }
interface State { hasError: boolean; }

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <Card><CardContent className="p-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-accent-500" />
          </div>
          <p className="font-semibold text-sm">{this.props.fallbackMessage || "Gagal memuat bagian ini"}</p>
          <Button size="sm" variant="outline" className="mt-3 rounded-xl" onClick={() => this.setState({ hasError: false })}>Coba Lagi</Button>
        </CardContent></Card>
      );
    }
    return this.props.children;
  }
}
