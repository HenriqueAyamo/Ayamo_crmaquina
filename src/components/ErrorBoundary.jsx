import { Component } from 'react'

const CHAVE_RECARREGOU = 'ayamo_crm_v1_recarregouPorErroChunk'

function ehErroDeChunk(erro) {
  const msg = String(erro?.message ?? '')
  return /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(msg)
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro) {
    // Chunks ficam desatualizados depois de um novo build enquanto a aba antiga segue aberta —
    // tenta recarregar automaticamente uma única vez antes de mostrar a tela de erro.
    if (ehErroDeChunk(erro) && !sessionStorage.getItem(CHAVE_RECARREGOU)) {
      sessionStorage.setItem(CHAVE_RECARREGOU, '1')
      window.location.reload()
    }
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-ayamo-bg p-6 text-center">
          <p className="text-base font-semibold text-ayamo-text">Algo deu errado ao carregar esta tela.</p>
          <p className="max-w-sm text-sm text-ayamo-text-mut">
            Isso costuma acontecer quando o sistema foi atualizado enquanto esta aba estava aberta. Recarregue a
            página para continuar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
