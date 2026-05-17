import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FORGE] Error capturado por ErrorBoundary:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6"
          style={{ background: '#0D0D0F' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={28} style={{ color: '#EF4444' }} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl text-white mb-2">Algo salió mal</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Ocurrió un error inesperado. Intenta recargar la aplicación.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-3 text-xs text-red-400 text-left bg-black/30 rounded-lg p-3 max-w-sm overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A', border: '1px solid rgba(255,107,26,0.3)' }}
            >
              <RefreshCw size={15} />
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
            >
              Recargar app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
