import { useState } from 'react'
import { ArrowUpRight, CheckCircle2, MessageSquareReply, ShieldCheck, XCircle } from 'lucide-react'
import ModalRodada from './ModalRodada.jsx'
import Botao from '../../components/Botao.jsx'
import { formatarData, formatarPreco } from '../../utils/formato.js'

const ACOES_RODADA = [
  {
    tipo: 'Contraproposta do cliente',
    label: 'Registrar contraproposta',
    icone: MessageSquareReply,
    perfis: ['Vendedor', 'Comprador'],
  },
  { tipo: 'Escalar para comprador', label: 'Escalar para comprador', icone: ArrowUpRight, perfis: ['Vendedor'] },
  {
    tipo: 'Solicitar aprovação do diretor',
    label: 'Aprovação do diretor',
    icone: ShieldCheck,
    perfis: ['Vendedor', 'Comprador'],
  },
]

const STATUS_ENCERRADOS = ['Aceita', 'Recusada', 'Expirada']
const AGUARDANDO_FINANCEIRO = 'Aguardando aprovação financeira'

const COR_AUTOR = {
  Cliente: 'bg-ayamo-accent/20 text-ayamo-warning',
  Vendedor: 'bg-ayamo-primary/15 text-ayamo-primary',
  Comprador: 'bg-ayamo-teal/15 text-ayamo-teal',
  Financeiro: 'bg-ayamo-success/15 text-ayamo-success',
}

export default function HistoricoNegociacao({
  proposta,
  itemAtual,
  perfil,
  onRegistrarRodada,
  onAceitarFechar,
  onRecusar,
  onAprovarCredito,
  onRecusarCredito,
}) {
  const [modalTipo, setModalTipo] = useState(null)

  const encerrada = STATUS_ENCERRADOS.includes(proposta.status)
  const aguardandoFinanceiro = proposta.status === AGUARDANDO_FINANCEIRO
  const acoesVisiveis = encerrada || aguardandoFinanceiro ? [] : ACOES_RODADA.filter((acao) => acao.perfis.includes(perfil))
  const podeFechar = !aguardandoFinanceiro && !encerrada && perfil === 'Vendedor'
  const decideCredito = aguardandoFinanceiro && perfil === 'Financeiro'

  function confirmarRodada(dados) {
    onRegistrarRodada(modalTipo, dados)
    setModalTipo(null)
  }

  const temAcoes = acoesVisiveis.length > 0 || podeFechar || decideCredito

  return (
    <div className="rounded-lg border border-ayamo-border bg-ayamo-surface">
      <div className="border-b border-ayamo-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ayamo-text">
          Negociação
          <span className="ml-2 font-normal text-ayamo-text-mut">
            {proposta.historicoNegociacao.length} rodada{proposta.historicoNegociacao.length === 1 ? '' : 's'}
          </span>
        </h2>
      </div>

      {/* Linha do tempo com a rodada mais recente primeiro — é a que decide o próximo passo. */}
      <ol className="flex flex-col px-5 py-4">
        {[...proposta.historicoNegociacao].reverse().map((r, indice) => (
          <li key={r.rodada} className="relative flex gap-4 pb-5 last:pb-0">
            {indice < proposta.historicoNegociacao.length - 1 && (
              <span className="absolute left-[5px] top-4 h-full w-px bg-ayamo-border" aria-hidden="true" />
            )}
            <span
              className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                indice === 0 ? 'bg-ayamo-primary ring-4 ring-ayamo-primary/15' : 'bg-ayamo-border'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    COR_AUTOR[r.autor] ?? 'bg-ayamo-text-mut/10 text-ayamo-text-mut'
                  }`}
                >
                  {r.autor}
                </span>
                <span className="text-sm font-medium text-ayamo-text">{r.tipo}</span>
                <span className="ml-auto text-xs text-ayamo-text-mut">{formatarData(r.data)}</span>
              </div>
              <p className="mt-1 text-sm tabular-nums text-ayamo-text">
                {formatarPreco(r.preco.valor, r.preco.moeda, r.preco.unidade)}
                <span className="text-ayamo-text-mut">
                  {' '}
                  · {r.quantidade.toLocaleString('pt-BR')} {r.preco.unidade}
                </span>
              </p>
              {r.observacao && <p className="mt-1 text-sm text-ayamo-text-mut">{r.observacao}</p>}
            </div>
          </li>
        ))}
      </ol>

      {aguardandoFinanceiro && perfil !== 'Financeiro' && (
        <div className="border-t border-ayamo-border bg-ayamo-warning/5 px-5 py-3.5 text-sm text-ayamo-warning">
          Aguardando o Financeiro aprovar o crédito do cliente para fechar.
        </div>
      )}

      {encerrada && (
        <div className="border-t border-ayamo-border bg-ayamo-bg px-5 py-3.5 text-sm text-ayamo-text-mut">
          Proposta {proposta.status.toLowerCase()} — não há mais ações de negociação.
        </div>
      )}

      {temAcoes && (
        // Decisão à esquerda, negociação no meio, recusa isolada à direita.
        // Antes os cinco botões vinham na mesma fila e com o mesmo peso visual.
        <div className="flex flex-wrap items-center gap-2 border-t border-ayamo-border bg-ayamo-bg/60 px-5 py-4">
          {podeFechar && (
            <Botao variante="primario" icone={CheckCircle2} onClick={onAceitarFechar}>
              Aceitar e fechar
            </Botao>
          )}

          {decideCredito && (
            <Botao variante="primario" icone={CheckCircle2} onClick={onAprovarCredito}>
              Aprovar crédito e fechar
            </Botao>
          )}

          {acoesVisiveis.map((acao) => (
            <Botao key={acao.tipo} variante="secundario" icone={acao.icone} onClick={() => setModalTipo(acao.tipo)}>
              {acao.label}
            </Botao>
          ))}

          {(podeFechar || decideCredito) && (
            <div className="ml-auto">
              <Botao variante="perigo" icone={XCircle} onClick={decideCredito ? onRecusarCredito : onRecusar}>
                {decideCredito ? 'Recusar crédito' : 'Recusar proposta'}
              </Botao>
            </div>
          )}
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
