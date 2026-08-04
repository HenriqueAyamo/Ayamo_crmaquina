import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText, History, MessageCircle, MessageSquarePlus, Pencil, Send, ShoppingBag, SlidersHorizontal, Trash2, Truck } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Botao from '../components/Botao.jsx'
import MenuAcoes from '../components/MenuAcoes.jsx'
import CabecalhoDetalhe from '../components/CabecalhoDetalhe.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ModalRevisao from './compras/ModalRevisao.jsx'
import ModalEditarOferta from './compras/ModalEditarOferta.jsx'
import ModalNotaOferta from './compras/ModalNotaOferta.jsx'
import ModalAlterarStatus from './compras/ModalAlterarStatus.jsx'
import NovaPropostaModal from './vendas/NovaPropostaModal.jsx'
import ModalEnviarOferta from './compras/ModalEnviarOferta.jsx'
import ModalEnviarWhatsApp from '../components/ModalEnviarWhatsApp.jsx'
import SecaoRecolhivel from '../components/SecaoRecolhivel.jsx'
import SecaoInspecoes from '../components/SecaoInspecoes.jsx'
import SecaoInteracoes from '../components/SecaoInteracoes.jsx'
import PopoverContato from '../components/PopoverContato.jsx'
import { formatarPreco, formatarData } from '../utils/formato.js'
import { TONE_STATUS_PRODUCAO } from '../data/statusProducao.js'
import { MOTIVOS, podeExcluirRegistros } from '../utils/permissoes.js'
import { modeloNegociacaoFornecedor } from '../utils/mensagensWhatsApp.js'
import { obterOfertasAtuais } from '../utils/ofertasAtuais.js'

const TONE_STATUS = {
  Disponível: 'success',
  'Em revisão': 'warning',
  Esgotada: 'neutral',
  Expirada: 'danger',
}

export default function ComprasDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const {
    ofertas,
    empresas,
    contatos,
    produtos,
    getProduto,
    getEmpresa,
    getUsuario,
    getDivisaoIdDeProduto,
    divisoes,
    usuarioLogado,
    notificarLogistica,
    dadosAyamo,
  } = useData()
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false)
  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const [modalStatusAberto, setModalStatusAberto] = useState(false)
  const [modalVendaAberto, setModalVendaAberto] = useState(false)
  const [modalEnviarAberto, setModalEnviarAberto] = useState(false)
  const [modalWhatsappAberto, setModalWhatsappAberto] = useState(false)
  const podeNegociar = ['Comprador', 'Administrador'].includes(usuarioLogado.perfil)
  const podeVender = ['Vendedor', 'Administrador'].includes(usuarioLogado.perfil)
  const podeExcluir = podeExcluirRegistros(usuarioLogado.perfil)
  const clientes = empresas.items.filter((e) => e.tipo === 'Cliente' && e.situacao === 'Ativo')

  const versoes = ofertas.items
    .filter((o) => o.codigoBase === id)
    .sort((a, b) => a.versao - b.versao)

  if (versoes.length === 0) {
    return <EmptyState title={t('compras.naoEncontrada')} />
  }

  const atual = versoes[versoes.length - 1]
  const produto = getProduto(atual.produtoId)
  const fornecedor = getEmpresa(atual.fornecedorId)
  const divisao = divisoes.items.find((d) => d.id === getDivisaoIdDeProduto(atual.produtoId))
  const entidadeAyamo = dadosAyamo.items.find((e) => e.id === atual.ayamoEntidadeId)
  const contatosFornecedor = contatos.items.filter((c) => c.empresaId === atual.fornecedorId)
  const ofertasIrmas = atual.grupoContainerId
    ? obterOfertasAtuais(ofertas.items).filter((o) => o.grupoContainerId === atual.grupoContainerId && o.codigoBase !== atual.codigoBase)
    : []

  function excluirOferta() {
    if (!window.confirm(`Excluir a oferta ${atual.codigoBase} e todas as suas ${versoes.length} revisão(ões)? Essa ação não pode ser desfeita.`)) return
    versoes.forEach((v) => ofertas.remover(v.id))
    navigate('/compras')
  }

  const podeOfertar = podeVender && atual.status === 'Disponível' && atual.quantidade > 0

  const acoesSecundarias = [
    podeNegociar && {
      label: t('compras.editarDados'),
      icone: Pencil,
      onClick: () => setModalEditarAberto(true),
    },
    podeNegociar && {
      label: t('compras.registrarContato'),
      icone: MessageSquarePlus,
      onClick: () => setModalNotaAberto(true),
    },
    podeNegociar && {
      label: t('compras.enviarWhatsApp'),
      icone: MessageCircle,
      tone: 'sucesso',
      onClick: () => setModalWhatsappAberto(true),
    },
    podeNegociar && {
      label: t('compras.alterarStatus'),
      icone: SlidersHorizontal,
      onClick: () => setModalStatusAberto(true),
      separadorAntes: true,
    },
    podeNegociar &&
      (atual.tipoRegistro ?? 'Position') === 'Position' && {
        label: t('compras.gerarPO'),
        icone: FileText,
        tone: 'primario',
        onClick: () => navigate(`/compras/${atual.codigoBase}/po`),
      },
    {
      label: t('compras.excluirOferta'),
      icone: Trash2,
      tone: 'perigo',
      onClick: excluirOferta,
      desabilitado: !podeExcluir,
      motivo: MOTIVOS.excluirRegistro,
      separadorAntes: true,
    },
  ]

  return (
    <div>
      <CabecalhoDetalhe
        voltarLabel={t('compras.voltar')}
        onVoltar={() => navigate('/compras')}
        titulo={atual.codigo}
        subtitulo={
          <>
            {produto?.nome} · {divisao?.nome} ·{' '}
            <PopoverContato empresaId={atual.fornecedorId}>{fornecedor?.nome}</PopoverContato>
          </>
        }
        selos={
          <>
            <StatusBadge
              label={atual.tipoRegistro ?? 'Position'}
              tone={(atual.tipoRegistro ?? 'Position') === 'Position' ? 'info' : 'accent'}
            />
            <StatusBadge label={atual.status} tone={TONE_STATUS[atual.status] ?? 'neutral'} />
            {atual.statusProducao && (
              <StatusBadge label={atual.statusProducao} tone={TONE_STATUS_PRODUCAO[atual.statusProducao] ?? 'neutral'} />
            )}
          </>
        }
        acoes={
          <>
            {podeOfertar && (
              <>
                <Botao variante="primario" tamanho="sm" icone={ShoppingBag} onClick={() => setModalVendaAberto(true)}>
                  {t('compras.gerarVenda')}
                </Botao>
                <Botao variante="contorno" tamanho="sm" icone={Send} onClick={() => setModalEnviarAberto(true)}>
                  {t('compras.enviarOferta')}
                </Botao>
              </>
            )}
            {podeNegociar && (
              <Botao variante="secundario" tamanho="sm" icone={History} onClick={() => setModalRevisaoAberto(true)}>
                {t('compras.registrarRevisao')}
              </Botao>
            )}
            <MenuAcoes itens={acoesSecundarias} />
          </>
        }
      >
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ayamo-text-mut">{t('compras.precoCusto')}</dt>
            <dd className="font-medium text-ayamo-text">
              {formatarPreco(atual.precoCusto.valor, atual.precoCusto.moeda, atual.precoCusto.unidade)}
            </dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">{t('comum.quantidade')}</dt>
            <dd className="font-medium text-ayamo-text">
              {atual.quantidade == null ? 'A definir' : `${atual.quantidade.toLocaleString('pt-BR')} ${atual.unidade}`}
              {atual.numeroContainers ? ` (${atual.numeroContainers} contêiner${atual.numeroContainers > 1 ? 'es' : ''})` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">{t('comum.data')}</dt>
            <dd className="font-medium text-ayamo-text">{formatarData(atual.data)}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">{t('compras.registradoPor')}</dt>
            <dd className="font-medium text-ayamo-text">{getUsuario(atual.usuarioId)?.nome ?? '—'}</dd>
          </div>
        </dl>
      </CabecalhoDetalhe>

      {ofertasIrmas.length > 0 && (
        <div className="mb-6 rounded border border-ayamo-accent/40 bg-ayamo-accent/10 px-4 py-3 text-sm text-ayamo-text">
          Parte de um pedido mix container ({ofertasIrmas.length + 1} produtos, {atual.tipoContainer || 'contêiner'}).
          Outras ofertas do mesmo pedido:{' '}
          {ofertasIrmas.map((o, i) => (
            <span key={o.id}>
              {i > 0 && ', '}
              <button
                type="button"
                onClick={() => navigate(`/compras/${o.codigoBase}`)}
                className="font-medium text-ayamo-primary hover:underline"
              >
                {o.codigo} ({getProduto(o.produtoId)?.nome})
              </button>
            </span>
          ))}
        </div>
      )}

      <SecaoRecolhivel titulo="Informações completas" aberturaInicial>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ayamo-text-mut">Incoterm</dt>
            <dd className="font-medium text-ayamo-text">{atual.incoterm || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Número do contrato</dt>
            <dd className="font-medium text-ayamo-text">{atual.numeroContrato || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Porto de origem</dt>
            <dd className="font-medium text-ayamo-text">{atual.portoOrigem || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Site de fabricação</dt>
            <dd className="font-medium text-ayamo-text">{atual.mfgSite || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Embarque</dt>
            <dd className="font-medium text-ayamo-text">
              {atual.embarqueDe || '—'} → {atual.embarqueAte || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Prazo de pagamento</dt>
            <dd className="font-medium text-ayamo-text">{atual.prazoPagamento || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Oferta válida até</dt>
            <dd className="font-medium text-ayamo-text">{atual.validadeAte || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Entidade Ayamo compradora</dt>
            <dd className="font-medium text-ayamo-text">{entidadeAyamo?.razaoSocial || '—'}</dd>
          </div>
          {atual.tipoContainer && (
            <div>
              <dt className="text-ayamo-text-mut">Tipo de contêiner</dt>
              <dd className="font-medium text-ayamo-text">{atual.tipoContainer}</dd>
            </div>
          )}
        </dl>

        <div>
          <dt className="text-sm text-ayamo-text-mut">Observação</dt>
          <dd className="mt-1 text-sm text-ayamo-text">{atual.observacao || '—'}</dd>
        </div>
      </SecaoRecolhivel>

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

      <SecaoInteracoes empresaId={atual.fornecedorId} refTipo="oferta" refId={atual.codigoBase} />

      <SecaoInspecoes contexto="Compra" refCodigo={atual.codigoBase} />

      <ModalRevisao open={modalRevisaoAberto} onClose={() => setModalRevisaoAberto(false)} atual={atual} />
      <ModalEditarOferta
        open={modalEditarAberto}
        onClose={() => setModalEditarAberto(false)}
        atual={atual}
        produtosAtivos={produtos.items.filter((p) => p.situacao === 'Ativo')}
        fornecedores={empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')}
      />
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
      <ModalEnviarWhatsApp
        open={modalWhatsappAberto}
        onClose={() => setModalWhatsappAberto(false)}
        titulo={`Enviar via WhatsApp — ${fornecedor?.nome ?? ''}`}
        contatos={contatosFornecedor}
        modelo={modeloNegociacaoFornecedor(atual, produto?.nome)}
      />
    </div>
  )
}
