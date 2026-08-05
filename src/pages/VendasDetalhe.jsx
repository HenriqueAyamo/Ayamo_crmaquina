import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BellRing, FileText, MessageCircle, Pencil, Receipt, Trash2 } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { obterNotaCambio } from '../data/cambio.js'
import StatusBadge from '../components/StatusBadge.jsx'
import Botao from '../components/Botao.jsx'
import MenuAcoes from '../components/MenuAcoes.jsx'
import CabecalhoDetalhe from '../components/CabecalhoDetalhe.jsx'
import EmptyState from '../components/EmptyState.jsx'
import HistoricoNegociacao from './vendas/HistoricoNegociacao.jsx'
import TabelaItensProposta from './vendas/TabelaItensProposta.jsx'
import ResumoNegocio from './vendas/ResumoNegocio.jsx'
import TrilhaStatus from './vendas/TrilhaStatus.jsx'
import ListaDados from '../components/ListaDados.jsx'
import ModalFechamento from './vendas/ModalFechamento.jsx'
import ModalEditarItens from './vendas/ModalEditarItens.jsx'
import ModalNotaOferta from './compras/ModalNotaOferta.jsx'
import ModalNovaOferta from './compras/ModalNovaOferta.jsx'
import ModalEnviarWhatsApp from '../components/ModalEnviarWhatsApp.jsx'
import PopoverContato from '../components/PopoverContato.jsx'
import SecaoInspecoes from '../components/SecaoInspecoes.jsx'
import SecaoInteracoes from '../components/SecaoInteracoes.jsx'
import { formatarData } from '../utils/formato.js'
import { MOTIVOS, podeExcluirRegistros } from '../utils/permissoes.js'
import { diasSemResposta, modeloCobrancaProposta, modeloPropostaCliente } from '../utils/mensagensWhatsApp.js'
import { TONELADAS_POR_CONTAINER } from '../data/toneladasPorContainer.js'

const TONE_STATUS = {
  Rascunho: 'neutral',
  Enviada: 'info',
  'Em negociação': 'warning',
  'Aguardando aprovação': 'accent',
  'Aguardando aprovação financeira': 'warning',
  Aceita: 'success',
  Recusada: 'danger',
  Expirada: 'neutral',
}

export default function VendasDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const {
    propostas,
    ofertas,
    produtos,
    empresas,
    contatos,
    getEmpresa,
    getUsuario,
    getProduto,
    calcularResumoProposta,
    ajustarEstoqueOferta,
    verificarLimiteCredito,
    registrarUsoCreditoCliente,
    avisarConcorrenciaEstoque,
    usuarioLogado,
    dadosAyamo,
  } = useData()

  const [perfil, setPerfil] = useState('Vendedor')
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false)
  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const [modalCompraAberto, setModalCompraAberto] = useState(false)
  const [modalWhatsappAberto, setModalWhatsappAberto] = useState(false)
  const [modalCobrancaAberto, setModalCobrancaAberto] = useState(false)
  const [modalItensAberto, setModalItensAberto] = useState(false)
  const [erroCredito, setErroCredito] = useState(null)

  const proposta = propostas.items.find((p) => p.numero === id)

  if (!proposta) {
    return <EmptyState title={t('vendas.naoEncontrada')} />
  }

  const podeExcluir = podeExcluirRegistros(usuarioLogado.perfil)

  function excluirProposta() {
    if (!window.confirm(`Excluir a proposta ${proposta.numero}? Essa ação não pode ser desfeita.`)) return
    propostas.remover(proposta.id)
    navigate('/vendas')
  }

  const itemPrincipal = proposta.itens[0]
  const resumoMargem = calcularResumoProposta(proposta)
  const ofertaVinculada = ofertas.items.find((o) => o.codigo === itemPrincipal.ofertaCodigo)
  const faltaEstoque = Math.max(0, itemPrincipal.quantidade - (ofertaVinculada?.quantidade ?? 0))
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')
  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')
  const entidadeAyamo = dadosAyamo.items.find((e) => e.id === proposta.ayamoEntidadeId)
  const cliente = getEmpresa(proposta.clienteId)
  const contatosCliente = contatos.items.filter((c) => c.empresaId === proposta.clienteId)
  const propostasIrmas = proposta.grupoEnvioId
    ? propostas.items.filter((p) => p.grupoEnvioId === proposta.grupoEnvioId && p.id !== proposta.id)
    : []

  const podeCobrar = ['Rascunho', 'Enviada', 'Em negociação'].includes(proposta.status)

  function registrarRodada(tipo, dados) {
    const rodada = proposta.historicoNegociacao.length + 1
    const autor = tipo === 'Contraproposta do cliente' ? 'Cliente' : perfil
    const hoje = new Date().toISOString().slice(0, 10)

    const novaEntrada = {
      rodada,
      autor,
      tipo,
      preco: dados.preco ?? itemPrincipal.precoVenda,
      quantidade: dados.quantidade ?? itemPrincipal.quantidade,
      data: hoje,
      observacao: dados.observacao ?? '',
    }

    const novosItens = dados.preco
      ? proposta.itens.map((item, i) =>
          i === 0 ? { ...item, precoVenda: dados.preco, quantidade: dados.quantidade ?? item.quantidade } : item,
        )
      : proposta.itens

    const statusPorTipo = {
      'Contraproposta do cliente': 'Em negociação',
      'Escalar para comprador': 'Em negociação',
      'Solicitar aprovação do diretor': 'Aguardando aprovação',
      'Solicitar aprovação financeira': 'Aguardando aprovação financeira',
      'Aprovação financeira concedida': 'Aceita',
      'Recusar aprovação financeira': 'Recusada',
      'Aceite e fechamento': 'Aceita',
      'Recusar proposta': 'Recusada',
    }

    if (tipo === 'Recusar proposta' || tipo === 'Recusar aprovação financeira') {
      ajustarEstoqueOferta(itemPrincipal.ofertaCodigo, itemPrincipal.quantidade)
    }

    propostas.editar(proposta.id, {
      status: statusPorTipo[tipo] ?? proposta.status,
      itens: novosItens,
      historicoNegociacao: [...proposta.historicoNegociacao, novaEntrada],
    })
  }

  function handleAceitarFechar() {
    const { bloqueado, motivo } = verificarLimiteCredito(proposta.clienteId, resumoMargem.vendaUSD)
    if (bloqueado) {
      setErroCredito(`Enviado para aprovação do Financeiro — ${motivo}`)
      registrarRodada('Solicitar aprovação financeira', { observacao: motivo })
      return
    }
    setErroCredito(null)
    registrarRodada('Aceite e fechamento', { observacao: 'Proposta aceita e fechada.' })
    registrarUsoCreditoCliente(proposta.clienteId, resumoMargem.vendaUSD)
    avisarConcorrenciaEstoque(itemPrincipal.ofertaCodigo, proposta.id)
    setModalFechamentoAberto(true)
  }

  function handleRecusar() {
    registrarRodada('Recusar proposta', { observacao: 'Proposta recusada pelo cliente.' })
  }

  function handleAprovarCredito() {
    registrarRodada('Aprovação financeira concedida', { observacao: 'Crédito liberado pelo Financeiro.' })
    registrarUsoCreditoCliente(proposta.clienteId, resumoMargem.vendaUSD)
    avisarConcorrenciaEstoque(itemPrincipal.ofertaCodigo, proposta.id)
    setModalFechamentoAberto(true)
  }

  function handleRecusarCredito() {
    registrarRodada('Recusar aprovação financeira', { observacao: 'Crédito não liberado pelo Financeiro.' })
  }

  const nota = obterNotaCambio(itemPrincipal.precoCusto, itemPrincipal.precoVenda)

  const acoesSecundarias = [
    {
      label: t('vendas.editarItens'),
      icone: Pencil,
      onClick: () => setModalItensAberto(true),
    },
    {
      label: t('vendas.gerarProforma'),
      icone: FileText,
      tone: 'primario',
      onClick: () => navigate(`/vendas/${proposta.numero}/proforma`),
    },
    {
      label: t('vendas.excluirProposta'),
      icone: Trash2,
      tone: 'perigo',
      onClick: excluirProposta,
      desabilitado: !podeExcluir,
      motivo: MOTIVOS.excluirRegistro,
      separadorAntes: true,
    },
  ]

  return (
    <div>
      <CabecalhoDetalhe
        voltarLabel={t('vendas.voltar')}
        onVoltar={() => navigate('/vendas')}
        titulo={proposta.numero}
        subtitulo={
          <>
            <PopoverContato empresaId={proposta.clienteId}>{getEmpresa(proposta.clienteId)?.nome}</PopoverContato> · Vendedor:{' '}
            {getUsuario(proposta.vendedorId)?.nome} · Enviada em {formatarData(proposta.dataEnvio)}
          </>
        }
        selos={<StatusBadge label={proposta.status} tone={TONE_STATUS[proposta.status] ?? 'neutral'} />}
        acoes={
          <>
            {podeCobrar && (
              <Botao variante="alerta" tamanho="sm" icone={BellRing} onClick={() => setModalCobrancaAberto(true)}>
                {t('vendas.cobrarResposta', { dias: diasSemResposta(proposta) })}
              </Botao>
            )}
            <Botao variante="sucesso" tamanho="sm" icone={MessageCircle} onClick={() => setModalWhatsappAberto(true)}>
              {t('vendas.enviarWhatsApp')}
            </Botao>
            {proposta.status === 'Aceita' && (
              <Botao variante="contorno" tamanho="sm" icone={Receipt} onClick={() => setModalFechamentoAberto(true)}>
                Resumo de fechamento
              </Botao>
            )}
            <MenuAcoes itens={acoesSecundarias} />
          </>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TrilhaStatus status={proposta.status} />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ayamo-text-mut">
              {t('vendas.visualizarComo')}
            </span>
            {['Vendedor', 'Comprador', 'Financeiro'].map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setPerfil(opcao)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  perfil === opcao
                    ? 'bg-ayamo-primary text-white'
                    : 'border border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg hover:text-ayamo-text'
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
        </div>
      </CabecalhoDetalhe>

      <ResumoNegocio proposta={proposta} resumo={resumoMargem} mostrarMargem={perfil === 'Vendedor'} />

      {erroCredito && (
        <p className="mb-6 rounded-lg border border-ayamo-danger/40 bg-ayamo-danger/10 px-4 py-3 text-sm text-ayamo-danger">
          {erroCredito}
        </p>
      )}

      {propostasIrmas.length > 0 && (
        <div className="mb-6 rounded-lg border border-ayamo-accent/40 bg-ayamo-accent/10 px-4 py-3 text-sm text-ayamo-text">
          Parte de um envio em grupo ({propostasIrmas.length + 1} clientes). Outras propostas do mesmo envio:{' '}
          {propostasIrmas.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <button
                type="button"
                onClick={() => navigate(`/vendas/${p.numero}`)}
                className="font-medium text-ayamo-primary hover:underline"
              >
                {p.numero} ({getEmpresa(p.clienteId)?.nome})
              </button>
            </span>
          ))}
        </div>
      )}

      {perfil === 'Comprador' && ofertaVinculada && faltaEstoque > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ayamo-danger/40 bg-ayamo-danger/10 px-4 py-3">
          <p className="text-sm text-ayamo-danger">
            Estoque de {ofertaVinculada.codigo} insuficiente — faltam{' '}
            <span className="font-semibold">
              {faltaEstoque.toLocaleString('pt-BR')} {itemPrincipal.unidade}
            </span>
            .
          </p>
          <Botao variante="perigo" tamanho="sm" onClick={() => setModalCompraAberto(true)}>
            Solicitar compra
          </Botao>
        </div>
      )}

      {/* Duas colunas: à esquerda o que muda a negociação, à direita o contexto
          do negócio. Antes era tudo uma pilha só e os dados de contrato — quase
          todos vazios — ficavam antes dos itens e da negociação. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ayamo-text-mut">{t('vendas.itens')}</h2>
              {proposta.mixContainer && (
                <span className="rounded-full border border-ayamo-accent/40 bg-ayamo-accent/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ayamo-warning">
                  Mix container
                </span>
              )}
            </div>
            <TabelaItensProposta proposta={proposta} perfil={perfil} getProduto={getProduto} />
            {proposta.mixContainer && (
              <p className="mt-2 text-xs text-ayamo-text-mut">
                Produtos embarcados juntos, contêineres compartilhados —{' '}
                {Math.ceil(proposta.itens.reduce((soma, i) => soma + i.quantidade, 0) / TONELADAS_POR_CONTAINER)} contêiner(es)
                de {TONELADAS_POR_CONTAINER}t.
              </p>
            )}
            {perfil === 'Vendedor' && nota && <p className="mt-2 text-xs text-ayamo-text-mut">{nota}</p>}
          </div>

          <HistoricoNegociacao
            proposta={proposta}
            itemAtual={itemPrincipal}
            perfil={perfil}
            onRegistrarRodada={registrarRodada}
            onAceitarFechar={handleAceitarFechar}
            onRecusar={handleRecusar}
            onAprovarCredito={handleAprovarCredito}
            onRecusarCredito={handleRecusarCredito}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-ayamo-border bg-ayamo-surface">
            <div className="border-b border-ayamo-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-ayamo-text">Dados do negócio</h2>
            </div>
            <div className="px-5 py-4">
              <ListaDados
                colunas={2}
                dados={[
                  { rotulo: 'Incoterm', valor: proposta.incoterm },
                  { rotulo: 'Prazo de pagamento', valor: proposta.prazoPagamento },
                  { rotulo: 'Porto de destino', valor: proposta.portoDestino },
                  { rotulo: 'País de destino', valor: proposta.destinoFinal },
                  {
                    rotulo: 'Embarque',
                    valor: proposta.embarqueDe || proposta.embarqueAte ? `${proposta.embarqueDe || '?'} → ${proposta.embarqueAte || '?'}` : null,
                  },
                  { rotulo: 'Nº do contrato', valor: proposta.numeroContrato },
                  { rotulo: 'Consignatário', valor: proposta.consignatarioNome || cliente?.nome },
                  { rotulo: 'Entidade Ayamo', valor: entidadeAyamo?.razaoSocial },
                ]}
              />
            </div>
          </section>

          {perfil === 'Comprador' && ofertaVinculada && (
            <section className="rounded-lg border border-ayamo-border bg-ayamo-surface px-5 py-4">
              <h2 className="mb-1 text-sm font-semibold text-ayamo-text">Oferta de origem</h2>
              <button
                type="button"
                onClick={() => navigate(`/compras/${ofertaVinculada.codigoBase}`)}
                className="text-sm font-medium text-ayamo-primary hover:underline"
              >
                {ofertaVinculada.codigo}
              </button>
              <p className="mt-1 text-xs text-ayamo-text-mut">
                Disponível: {(ofertaVinculada.quantidade ?? 0).toLocaleString('pt-BR')} {ofertaVinculada.unidade}
              </p>
              <Botao variante="secundario" tamanho="sm" className="mt-3 w-full" onClick={() => setModalNotaAberto(true)}>
                Registrar contato com fornecedor
              </Botao>
            </section>
          )}
        </aside>
      </div>

      <div className="mt-6">
        <SecaoInteracoes empresaId={proposta.clienteId} refTipo="proposta" refId={proposta.numero} />
        <SecaoInspecoes contexto="Venda" refCodigo={proposta.numero} />
      </div>

      <ModalEditarItens open={modalItensAberto} onClose={() => setModalItensAberto(false)} proposta={proposta} />

      <ModalFechamento
        open={modalFechamentoAberto}
        onClose={() => setModalFechamentoAberto(false)}
        proposta={proposta}
        itemAtual={itemPrincipal}
        produtoNome={getProduto(itemPrincipal.produtoId)?.nome}
        resumoMargem={resumoMargem}
      />

      {ofertaVinculada && (
        <ModalNotaOferta open={modalNotaAberto} onClose={() => setModalNotaAberto(false)} atual={ofertaVinculada} />
      )}

      {ofertaVinculada && (
        <ModalNovaOferta
          open={modalCompraAberto}
          onClose={() => setModalCompraAberto(false)}
          produtosAtivos={produtosAtivos}
          fornecedores={fornecedores}
          inicial={{
            produtoId: String(itemPrincipal.produtoId),
            fornecedorId: String(ofertaVinculada.fornecedorId),
            quantidade: faltaEstoque,
            unidade: ofertaVinculada.unidade,
            observacao: `Solicitado a partir da proposta ${proposta.numero} — cliente pediu ${itemPrincipal.quantidade.toLocaleString('pt-BR')} ${itemPrincipal.unidade}, estoque disponível em ${ofertaVinculada.codigo}: ${ofertaVinculada.quantidade.toLocaleString('pt-BR')} ${ofertaVinculada.unidade}.`,
          }}
          onCriada={(nova) => navigate(`/compras/${nova.codigoBase}`)}
        />
      )}

      <ModalEnviarWhatsApp
        open={modalWhatsappAberto}
        onClose={() => setModalWhatsappAberto(false)}
        titulo={`Enviar via WhatsApp — ${cliente?.nome ?? ''}`}
        contatos={contatosCliente}
        modelo={modeloPropostaCliente(proposta, getProduto(itemPrincipal.produtoId)?.nome)}
      />

      <ModalEnviarWhatsApp
        open={modalCobrancaAberto}
        onClose={() => setModalCobrancaAberto(false)}
        titulo={`Cobrar resposta via WhatsApp — ${cliente?.nome ?? ''}`}
        contatos={contatosCliente}
        modelo={modeloCobrancaProposta(proposta, getProduto(itemPrincipal.produtoId)?.nome)}
      />
    </div>
  )
}
