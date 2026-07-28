import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Truck } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ModalRevisao from './compras/ModalRevisao.jsx'
import ModalNotaOferta from './compras/ModalNotaOferta.jsx'
import ModalAlterarStatus from './compras/ModalAlterarStatus.jsx'
import NovaPropostaModal from './vendas/NovaPropostaModal.jsx'
import ModalEnviarOferta from './compras/ModalEnviarOferta.jsx'
import SecaoRecolhivel from '../components/SecaoRecolhivel.jsx'
import SecaoInspecoes from '../components/SecaoInspecoes.jsx'
import PopoverContato from '../components/PopoverContato.jsx'
import { formatarPreco, formatarData } from '../utils/formato.js'
import { TONE_STATUS_PRODUCAO } from '../data/statusProducao.js'

const TONE_STATUS = {
  Disponível: 'success',
  'Em revisão': 'warning',
  Esgotada: 'neutral',
  Expirada: 'danger',
}

export default function ComprasDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ofertas, empresas, getProduto, getEmpresa, getUsuario, getDivisaoIdDeProduto, divisoes, usuarioLogado, notificarLogistica } =
    useData()
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false)
  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const [modalStatusAberto, setModalStatusAberto] = useState(false)
  const [modalVendaAberto, setModalVendaAberto] = useState(false)
  const [modalEnviarAberto, setModalEnviarAberto] = useState(false)
  const podeNegociar = ['Comprador', 'Administrador'].includes(usuarioLogado.perfil)
  const podeVender = ['Vendedor', 'Administrador'].includes(usuarioLogado.perfil)
  const clientes = empresas.items.filter((e) => e.tipo === 'Cliente' && e.situacao === 'Ativo')

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
              {produto?.nome} · {divisao?.nome} ·{' '}
              <PopoverContato empresaId={atual.fornecedorId}>{fornecedor?.nome}</PopoverContato>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              label={atual.tipoRegistro ?? 'Position'}
              tone={(atual.tipoRegistro ?? 'Position') === 'Position' ? 'info' : 'accent'}
            />
            <StatusBadge label={atual.status} tone={TONE_STATUS[atual.status] ?? 'neutral'} />
            {atual.statusProducao && (
              <StatusBadge label={atual.statusProducao} tone={TONE_STATUS_PRODUCAO[atual.statusProducao] ?? 'neutral'} />
            )}
            {podeVender && atual.status === 'Disponível' && atual.quantidade > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setModalEnviarAberto(true)}
                  className="rounded border border-ayamo-primary px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
                >
                  Enviar oferta
                </button>
                <button
                  type="button"
                  onClick={() => setModalVendaAberto(true)}
                  className="rounded bg-ayamo-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  Gerar venda
                </button>
              </>
            )}
            {podeNegociar && (
              <>
                {(atual.tipoRegistro ?? 'Position') === 'Position' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/compras/${atual.codigoBase}/po`)}
                    className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
                  >
                    Gerar PO
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalNotaAberto(true)}
                  className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text hover:bg-ayamo-bg"
                >
                  Registrar contato com fornecedor
                </button>
                <button
                  type="button"
                  onClick={() => setModalStatusAberto(true)}
                  className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text hover:bg-ayamo-bg"
                >
                  Alterar status
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
              {atual.quantidade == null ? 'A definir' : `${atual.quantidade.toLocaleString('pt-BR')} ${atual.unidade}`}
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

      {atual.incoterm === 'FOB' && (atual.tipoRegistro ?? 'Position') === 'Position' && (
        <div className="mb-6 flex items-center justify-between rounded border border-ayamo-warning/25 bg-ayamo-warning/10 p-4">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-ayamo-warning" />
            <p className="text-sm text-ayamo-text">
              Incoterm <strong>FOB</strong> — o frete é por conta da Ayamo. A Logística precisa providenciar o embarque.
              {atual.logisticaAcionada && (
                <span className="ml-1 text-ayamo-text-mut">Notificada em {formatarData(atual.logisticaAcionadaEm)}.</span>
              )}
            </p>
          </div>
          {podeNegociar && !atual.logisticaAcionada && (
            <button
              type="button"
              onClick={() => notificarLogistica(atual)}
              className="flex-shrink-0 rounded border border-ayamo-warning px-3 py-1.5 text-xs font-medium text-ayamo-warning hover:bg-ayamo-warning/10"
            >
              Notificar Logística
            </button>
          )}
        </div>
      )}

      {atual.historicoNegociacao?.length > 0 && (
        <SecaoRecolhivel titulo="Histórico de negociação com o fornecedor" aberturaInicial={false}>
          <ol className="flex flex-col gap-3">
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
        </SecaoRecolhivel>
      )}

      <SecaoRecolhivel titulo="Histórico de revisões" aberturaInicial={false}>
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
      </SecaoRecolhivel>

      <SecaoInspecoes contexto="Compra" refCodigo={atual.codigoBase} />

      <ModalRevisao open={modalRevisaoAberto} onClose={() => setModalRevisaoAberto(false)} atual={atual} />
      <ModalNotaOferta open={modalNotaAberto} onClose={() => setModalNotaAberto(false)} atual={atual} />
      <ModalAlterarStatus open={modalStatusAberto} onClose={() => setModalStatusAberto(false)} atual={atual} />
      <NovaPropostaModal
        open={modalVendaAberto}
        onClose={() => setModalVendaAberto(false)}
        clientes={clientes}
        ofertaFixa={atual}
        onCriada={(numeros) => {
          if (numeros.length === 1) navigate(`/vendas/${numeros[0]}`)
          else navigate('/vendas')
        }}
      />
      <ModalEnviarOferta
        open={modalEnviarAberto}
        onClose={() => setModalEnviarAberto(false)}
        oferta={atual}
        produto={produto}
        fornecedor={fornecedor}
        clientes={clientes}
      />
    </div>
  )
}
