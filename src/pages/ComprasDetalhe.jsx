import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ModalRevisao from './compras/ModalRevisao.jsx'
import ModalNotaOferta from './compras/ModalNotaOferta.jsx'
import { formatarPreco, formatarData } from '../utils/formato.js'

const TONE_STATUS = {
  Disponível: 'success',
  'Em revisão': 'warning',
  Esgotada: 'neutral',
  Expirada: 'danger',
}

export default function ComprasDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ofertas, getProduto, getEmpresa, getUsuario, getDivisaoIdDeProduto, divisoes, usuarioLogado } = useData()
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false)
  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const podeNegociar = ['Comprador', 'Administrador'].includes(usuarioLogado.perfil)

  const versoes = ofertas.items
    .filter((o) => o.codigoBase === id)
    .sort((a, b) => a.versao - b.versao)

  if (versoes.length === 0) {
    return <EmptyState title="Oferta não encontrada" />
  }

  const atual = versoes[versoes.length - 1]
  const produto = getProduto(atual.produtoId)
  const fornecedor = getEmpresa(atual.fornecedorId)
  const divisao = divisoes.items.find((d) => d.id === getDivisaoIdDeProduto(atual.produtoId))

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/compras')}
        className="mb-4 flex items-center gap-1 text-sm text-ayamo-text-mut hover:text-ayamo-text"
      >
        <ArrowLeft size={16} />
        Voltar para Compras
      </button>

      <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ayamo-text">{atual.codigo}</h1>
            <p className="text-sm text-ayamo-text-mut">
              {produto?.nome} · {divisao?.nome} · {fornecedor?.nome}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={atual.status} tone={TONE_STATUS[atual.status] ?? 'neutral'} />
            {podeNegociar && (
              <>
                <button
                  type="button"
                  onClick={() => setModalNotaAberto(true)}
                  className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text hover:bg-ayamo-bg"
                >
                  Registrar contato com fornecedor
                </button>
                <button
                  type="button"
                  onClick={() => setModalRevisaoAberto(true)}
                  className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
                >
                  Registrar revisão
                </button>
              </>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ayamo-text-mut">Preço de custo</dt>
            <dd className="font-medium text-ayamo-text">
              {formatarPreco(atual.precoCusto.valor, atual.precoCusto.moeda, atual.precoCusto.unidade)}
            </dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Quantidade</dt>
            <dd className="font-medium text-ayamo-text">
              {atual.quantidade.toLocaleString('pt-BR')} {atual.unidade}
            </dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Data</dt>
            <dd className="font-medium text-ayamo-text">{formatarData(atual.data)}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Registrado por</dt>
            <dd className="font-medium text-ayamo-text">{getUsuario(atual.usuarioId)?.nome ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {atual.historicoNegociacao?.length > 0 && (
        <>
          <h2 className="mb-3 text-base font-semibold text-ayamo-text">Histórico de negociação com o fornecedor</h2>
          <ol className="mb-6 flex flex-col gap-3">
            {atual.historicoNegociacao.map((n, index) => (
              <li key={index} className="rounded border border-ayamo-border bg-ayamo-surface p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ayamo-text">
                    {n.tipo} ({n.autor})
                  </span>
                  <span className="text-xs text-ayamo-text-mut">{formatarData(n.data)}</span>
                </div>
                {n.observacao && <p className="text-sm text-ayamo-text-mut">{n.observacao}</p>}
              </li>
            ))}
          </ol>
        </>
      )}

      <h2 className="mb-3 text-base font-semibold text-ayamo-text">Histórico de revisões</h2>

      <ol className="flex flex-col gap-0">
        {versoes.map((v, index) => (
          <li key={v.id} className="relative flex gap-4 pb-6 pl-2">
            {index < versoes.length - 1 && (
              <span className="absolute left-[7px] top-3 h-full w-px bg-ayamo-border" aria-hidden="true" />
            )}
            <span className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-ayamo-primary bg-ayamo-surface" />
            <div className="flex-1 rounded border border-ayamo-border bg-ayamo-surface p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ayamo-text">
                  {v.versao === 0 ? 'Versão original' : `Revisão R${v.versao}`}
                </span>
                <span className="text-xs text-ayamo-text-mut">{formatarData(v.data)}</span>
              </div>
              <p className="text-sm text-ayamo-text">
                {formatarPreco(v.precoCusto.valor, v.precoCusto.moeda, v.precoCusto.unidade)} — {getUsuario(v.usuarioId)?.nome}
              </p>
              {v.observacao && <p className="mt-1 text-sm text-ayamo-text-mut">{v.observacao}</p>}
            </div>
          </li>
        ))}
      </ol>

      <ModalRevisao open={modalRevisaoAberto} onClose={() => setModalRevisaoAberto(false)} atual={atual} />
      <ModalNotaOferta open={modalNotaAberto} onClose={() => setModalNotaAberto(false)} atual={atual} />
    </div>
  )
}
