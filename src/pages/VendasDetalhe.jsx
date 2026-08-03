import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { obterNotaCambio } from '../data/cambio.js'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import HistoricoNegociacao from './vendas/HistoricoNegociacao.jsx'
import TabelaItensProposta from './vendas/TabelaItensProposta.jsx'
import ModalFechamento from './vendas/ModalFechamento.jsx'
import ModalNotaOferta from './compras/ModalNotaOferta.jsx'
import ModalNovaOferta from './compras/ModalNovaOferta.jsx'
import ModalEnviarWhatsApp from '../components/ModalEnviarWhatsApp.jsx'
import PopoverContato from '../components/PopoverContato.jsx'
import SecaoInspecoes from '../components/SecaoInspecoes.jsx'
import SecaoRecolhivel from '../components/SecaoRecolhivel.jsx'
import DisabledActionTooltip from '../components/DisabledActionTooltip.jsx'
import { formatarData, formatarPreco } from '../utils/formato.js'
import { MOTIVOS, podeExcluirRegistros } from '../utils/permissoes.js'
import { diasSemResposta, mensagemCobrancaProposta } from '../utils/mensagensWhatsApp.js'

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
  const [erroCredito, setErroCredito] = useState(null)

  const proposta = propostas.items.find((p) => p.numero === id)

  if (!proposta) {
    return <EmptyState title="Proposta não encontrada" />
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

  function mensagemPropostaCliente() {
    const produtoNome = getProduto(itemPrincipal.produtoId)?.nome ?? ''
    return `Olá! Sobre a proposta ${proposta.numero} (${produtoNome}):

- Quantidade: ${itemPrincipal.quantidade.toLocaleString('pt-BR')} ${itemPrincipal.unidade}${itemPrincipal.numeroContainers ? ` (${itemPrincipal.numeroContainers} contêiner${itemPrincipal.numeroContainers > 1 ? 'es' : ''})` : ''}
- Preço: ${formatarPreco(itemPrincipal.precoVenda.valor, itemPrincipal.precoVenda.moeda, itemPrincipal.precoVenda.unidade)}
- Incoterm: ${proposta.incoterm || '—'}
- Embarque: ${proposta.embarqueDe || 'a definir'} até ${proposta.embarqueAte || 'a definir'}
- Prazo de pagamento: ${proposta.prazoPagamento || '—'}
- Status atual: ${proposta.status}

Aguardamos seu retorno para seguirmos com o fechamento.`
  }

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

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/vendas')}
        className="mb-4 flex items-center gap-1 text-sm text-ayamo-text-mut hover:text-ayamo-text"
      >
        <ArrowLeft size={16} />
        Voltar para Vendas
      </button>

      <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ayamo-text">{proposta.numero}</h1>
            <p className="text-sm text-ayamo-text-mut">
              <PopoverContato empresaId={proposta.clienteId}>{getEmpresa(proposta.clienteId)?.nome}</PopoverContato> · Vendedor:{' '}
              {getUsuario(proposta.vendedorId)?.nome} · Enviada em{' '}
              {formatarData(proposta.dataEnvio)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={proposta.status} tone={TONE_STATUS[proposta.status] ?? 'neutral'} />
            <button
              type="button"
              onClick={() => setModalWhatsappAberto(true)}
              className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-success hover:bg-ayamo-bg"
            >
              Enviar via WhatsApp
            </button>
            {podeCobrar && (
              <button
                type="button"
                onClick={() => setModalCobrancaAberto(true)}
                className="rounded border border-ayamo-warning px-3 py-1.5 text-xs font-medium text-ayamo-warning hover:bg-ayamo-bg"
              >
                Cobrar resposta ({diasSemResposta(proposta)}d)
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/vendas/${proposta.numero}/proforma`)}
              className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
            >
              Gerar Proforma
            </button>
            <DisabledActionTooltip desabilitado={!podeExcluir} motivo={MOTIVOS.excluirRegistro}>
              <button
                type="button"
                disabled={!podeExcluir}
                onClick={excluirProposta}
                className="flex items-center gap-1 rounded border border-ayamo-danger px-3 py-1.5 text-xs font-medium text-ayamo-danger hover:bg-ayamo-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={13} />
                Excluir
              </button>
            </DisabledActionTooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">Visualizar como:</span>
          {['Vendedor', 'Comprador', 'Financeiro'].map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setPerfil(opcao)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                perfil === opcao ? 'bg-ayamo-primary text-white' : 'border border-ayamo-border text-ayamo-text-mut'
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      {propostasIrmas.length > 0 && (
        <div className="mb-6 rounded border border-ayamo-accent/40 bg-ayamo-accent/10 px-4 py-3 text-sm text-ayamo-text">
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

      <SecaoRecolhivel titulo="Informações completas" aberturaInicial>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ayamo-text-mut">Incoterm</dt>
            <dd className="font-medium text-ayamo-text">{proposta.incoterm || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Número do contrato</dt>
            <dd className="font-medium text-ayamo-text">{proposta.numeroContrato || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Porto de destino</dt>
            <dd className="font-medium text-ayamo-text">{proposta.portoDestino || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">País de destino final</dt>
            <dd className="font-medium text-ayamo-text">{proposta.destinoFinal || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Embarque</dt>
            <dd className="font-medium text-ayamo-text">
              {proposta.embarqueDe || '—'} → {proposta.embarqueAte || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Prazo de pagamento</dt>
            <dd className="font-medium text-ayamo-text">{proposta.prazoPagamento || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Consignatário</dt>
            <dd className="font-medium text-ayamo-text">{proposta.consignatarioNome || cliente?.nome || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Entidade Ayamo vendedora</dt>
            <dd className="font-medium text-ayamo-text">{entidadeAyamo?.razaoSocial || '—'}</dd>
          </div>
        </dl>
      </SecaoRecolhivel>

      <h2 className="mb-3 text-base font-semibold text-ayamo-text">Itens</h2>
      <TabelaItensProposta proposta={proposta} perfil={perfil} getProduto={getProduto} />
      {perfil === 'Vendedor' && nota && <p className="mb-6 text-xs text-ayamo-text-mut">{nota}</p>}
      {perfil !== 'Vendedor' && <div className="mb-6" />}

      {proposta.status === 'Aceita' && (
        <button
          type="button"
          onClick={() => setModalFechamentoAberto(true)}
          className="mb-6 rounded border border-ayamo-success px-4 py-2 text-sm font-medium text-ayamo-success hover:bg-ayamo-bg"
        >
          Ver resumo de fechamento
        </button>
      )}

      {erroCredito && (
        <p className="mb-4 rounded border border-ayamo-danger bg-ayamo-danger/10 px-4 py-3 text-sm text-ayamo-danger">
          {erroCredito}
        </p>
      )}

      {perfil === 'Comprador' && ofertaVinculada && (
        <div className="mb-4 flex items-center justify-between rounded border border-ayamo-border bg-ayamo-surface p-3">
          <p className="text-sm text-ayamo-text-mut">
            Esta proposta depende da oferta <span className="font-medium text-ayamo-text">{ofertaVinculada.codigo}</span>.
          </p>
          <button
            type="button"
            onClick={() => setModalNotaAberto(true)}
            className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
          >
            Registrar contato com fornecedor
          </button>
        </div>
      )}

      {perfil === 'Comprador' && ofertaVinculada && faltaEstoque > 0 && (
        <div className="mb-4 flex items-center justify-between rounded border border-ayamo-danger bg-ayamo-danger/10 p-3">
          <p className="text-sm text-ayamo-danger">
            Estoque de {ofertaVinculada.codigo} insuficiente para esta proposta — faltam{' '}
            <span className="font-medium">
              {faltaEstoque.toLocaleString('pt-BR')} {itemPrincipal.unidade}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => setModalCompraAberto(true)}
            className="rounded bg-ayamo-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Solicitar compra
          </button>
        </div>
      )}

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

      <SecaoInspecoes contexto="Venda" refCodigo={proposta.numero} />

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
        mensagemInicial={mensagemPropostaCliente()}
      />

      <ModalEnviarWhatsApp
        open={modalCobrancaAberto}
        onClose={() => setModalCobrancaAberto(false)}
        titulo={`Cobrar resposta via WhatsApp — ${cliente?.nome ?? ''}`}
        contatos={contatosCliente}
        mensagemInicial={mensagemCobrancaProposta(proposta, getProduto(itemPrincipal.produtoId)?.nome ?? '')}
      />
    </div>
  )
}
