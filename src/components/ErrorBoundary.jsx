import React from "react";
import { RotateCcw, AlertCircle } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-white">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl glass-panel border border-zinc-800 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-brand-red">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black">Une erreur inattendue est survenue</h2>
            <p className="text-xs text-zinc-400">
              L'affichage a rencontré un incident passager. Cliquez ci-dessous pour recharger la page.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs shadow-glow-red flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recharger l'application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
