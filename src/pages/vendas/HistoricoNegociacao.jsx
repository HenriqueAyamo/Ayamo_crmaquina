import { useState } from 'react'
import ModalRodada from './ModalRodada.jsx'
import { formatarData, formatarPreco } from '../../utils/formato.js'

const ACOES = [
  { tipo: 'Contraproposta do cliente', label: 'Registrar contraproposta do cliente' },
  { tipo: 'Escalar para comprador', label: 'Escalar para comprador' },
  { tipo: 'Solicitar aprovação do diretor', label: 'Solicitar aprovação do diretor' },
]

const STATUS_ENCERRADOS = ['Aceita', 'Recusada', 'Expirada']

export default function HistoricoNegociacao({ proposta, itemAtual, onRegistrarRodada, onAceitarFechar, onRecusar }) {
  const [modalTipo, setModalTipo] = useState(null)

  const encerrada = STATUS_ENCERRADOS.includes(proposta.status)

  function confirmarRodada(dados) {
    onRegistrarRodada(modalTipo, dados)
    setModalTipo(null)
  }

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-ayamo-text">Histórico de negociação</h2>

      <ol className="mb-4 flex flex-col gap-3">
        {proposta.historicoNegociacao.map((r) => (
          <li key={r.rodada} className="rounded border border-ayamo-border bg-ayamo-surface p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-ayamo-text">
                Rodada {r.rodada} — {r.tipo} ({r.autor})
              </span>
              <span className="text-xs text-ayamo-text-mut">{formatarData(r.data)}</span>
            </div>
            <p className="text-sm text-ayamo-text">
              {formatarPreco(r.preco.valor, r.preco.moeda, r.preco.unidade)} · {r.quantidade.toLocaleString('pt-BR')} {r.preco.unidade}
            </p>
            {r.observacao && <p className="mt-1 text-sm text-ayamo-text-mut">{r.observacao}</p>}
          </li>
        ))}
      </ol>

      {!encerrada && (
        <div className="flex flex-wrap gap-3">
          {ACOES.map((acao) => (
            <button
              key={acao.tipo}
              type="button"
              onClick={() => setModalTipo(acao.tipo)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              {acao.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onAceitarFechar}
            className="rounded bg-ayamo-success px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Aceitar e fechar
          </button>
        </div>
      )}

      <ModalRodada
        open={modalTipo !== null}
        tipo={modalTipo}
        itemAtual={itemAtual}
        onClose={() => setModalTipo(null)}
        onConfirmar={confirmarRodada}
      />
    </div>
  )
}
