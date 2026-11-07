import { Component, type ReactNode } from "react";

/** Keeps one broken widget (e.g. the map) from taking down the whole app. */
export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[HurricaneGuard] widget failed:", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
