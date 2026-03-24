import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Task 2.3 — Error Boundary
 * Captura crashes de JavaScript no React e exibe tela amigável
 * em vez de tela branca.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Em produção, enviar para Sentry (task 2.4)
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#050f1a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Algo deu errado
          </h1>
          <p className="text-gray-400 mb-8">
            Ocorreu um erro inesperado. Tente recarregar a página — se o
            problema persistir, entre em contato com o suporte.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#00ff88] text-[#050f1a] rounded-xl font-bold text-sm hover:bg-[#00dd77] transition-colors"
            >
              Recarregar página
            </button>
            <Link
              to="/"
              onClick={this.handleRetry}
              className="px-6 py-3 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors border border-white/10"
            >
              Voltar ao início
            </Link>
          </div>

          {/* Dev mode: show error details */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-8 text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                Detalhes do erro (dev)
              </summary>
              <pre className="mt-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3 overflow-auto max-h-48">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
