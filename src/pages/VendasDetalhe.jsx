import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { obterNotaCambio } from '../data/cambio.js'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import HistoricoNegociacao from './vendas/HistoricoNegociacao.jsx'
import TabelaItensProposta from './vendas/TabelaItensProposta.jsx'
import ModalFechamento from './vendas/ModalFechamento.jsx'
import ModalNotaOferta from './compras/ModalNotaOferta.jsx'
import ModalNovaOferta from './compras/ModalNovaOferta.jsx'
import { formatarData } from '../utils/formato.js'

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
    getEmpresa,
    getUsuario,
    getProduto,
    calcularResumoProposta,
    ajustarEstoqueOferta,
    verificarLimiteCredito,
    registrarUsoCreditoCliente,
    avisarConcorrenciaEstoque,
  } = useData()

  const [perfil, setPerfil] = useState('Vendedor')
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false)
  const [modalNotaAberto, setModalNotaAberto] = useState(false)
  const [modalCompraAberto, setModalCompraAberto] = useState(false)
  const [erroCredito, setErroCredito] = useState(null)

  const proposta = propostas.items.find((p) => p.numero === id)

  if (!proposta) {
    return <EmptyState title="Proposta não encontrada" />
  }

  const itemPrincipal = proposta.itens[0]
  const resumoMargem = calcularResumoProposta(proposta)
  const ofertaVinculada = ofertas.items.find((o) => o.codigo === itemPrincipal.ofertaCodigo)
  const faltaEstoque = Math.max(0, itemPrincipal.quantidade - (ofertaVinculada?.quantidade ?? 0))
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')
  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')

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
              {getEmpresa(proposta.clienteId)?.nome} · Vendedor: {getUsuario(proposta.vendedorId)?.nome} · Enviada em{' '}
              {formatarData(proposta.dataEnvio)}
            </p>
          </div>
          <StatusBadge label={proposta.status} tone={TONE_STATUS[proposta.status] ?? 'neutral'} />
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
    </div>
  )
}
