import { createContext, useContext, useRef, useState } from 'react'
import { divisoes as divisoesMock } from './data/divisoes.js'
import { familias as familiasMock } from './data/familias.js'
import { produtos as produtosMock } from './data/produtos.js'
import { categoriasContato as categoriasContatoMock } from './data/categoriasContato.js'
import { usuarios as usuariosMock } from './data/usuarios.js'
import { empresas as empresasMock } from './data/empresas.js'
import { contatos as contatosMock } from './data/contatos.js'
import { ofertas as ofertasMock } from './data/ofertas.js'
import { propostas as propostasMock } from './data/propostas.js'
import { converterParaUSD, converterDeUSD, calcularResumoProposta } from './data/cambio.js'
import { calcularPendencias } from './utils/pendencias.js'

const DataContext = createContext(null)

function gerarDocumentosSeed() {
  let idCounter = 1
  const docs = []

  propostasMock
    .filter((p) => p.status === 'Aceita')
    .forEach((p, index) => {
      const cliente = empresasMock.find((e) => e.id === p.clienteId)
      const item = p.itens[0]
      const valorTotal = item.precoVenda.valor * item.quantidade
      const base = { propostaId: p.id, propostaNumero: p.numero, clienteNome: cliente?.nome ?? '—', valor: valorTotal, moeda: item.precoVenda.moeda, data: p.dataEnvio, statusEnvio: 'Enviado' }
      docs.push({ id: idCounter++, tipo: 'PO', numero: `PO-${2000 + index * 2}`, ...base })
      docs.push({ id: idCounter++, tipo: 'Proforma Invoice', numero: `PI-${3000 + index * 2}`, ...base })
    })

  return docs
}

function useCollection(initialData) {
  const [items, setItems] = useState(initialData)
  const proximoId = useRef(initialData.reduce((max, item) => Math.max(max, item.id), 0) + 1)

  function criar(dados) {
    const novo = { situacao: 'Ativo', ...dados, id: proximoId.current }
    proximoId.current += 1
    setItems((atual) => [...atual, novo])
    return novo
  }

  function editar(id, dados) {
    setItems((atual) => atual.map((item) => (item.id === id ? { ...item, ...dados } : item)))
  }

  function inativar(id) {
    setItems((atual) => atual.map((item) => (item.id === id ? { ...item, situacao: 'Inativo' } : item)))
  }

  function remover(id) {
    setItems((atual) => atual.filter((item) => item.id !== id))
  }

  function substituir(novosItens) {
    proximoId.current = novosItens.reduce((max, item) => Math.max(max, item.id), 0) + 1
    setItems(novosItens)
  }

  return { items, criar, editar, inativar, remover, substituir }
}

export function DataProvider({ children }) {
  const divisoes = useCollection(divisoesMock)
  const familias = useCollection(familiasMock)
  const produtos = useCollection(produtosMock)
  const categoriasContato = useCollection(categoriasContatoMock)
  const usuarios = useCollection(usuariosMock)
  const empresas = useCollection(empresasMock)
  const contatos = useCollection(contatosMock)
  const ofertas = useCollection(ofertasMock)
  const propostas = useCollection(propostasMock)
  const documentos = useCollection(gerarDocumentosSeed())

  const [usuarioLogadoId, setUsuarioLogadoId] = useState(1)
  const usuarioLogado = usuarios.items.find((u) => u.id === usuarioLogadoId) ?? usuarios.items[0]

  function getFamilia(familiaId) {
    return familias.items.find((f) => f.id === familiaId)
  }

  function getProduto(produtoId) {
    return produtos.items.find((p) => p.id === produtoId)
  }

  function getDivisaoIdDeProduto(produtoId) {
    const familia = getFamilia(getProduto(produtoId)?.familiaId)
    return familia?.divisaoId ?? null
  }

  function getDivisao(divisaoId) {
    return divisoes.items.find((d) => d.id === divisaoId)
  }

  function getEmpresa(empresaId) {
    return empresas.items.find((e) => e.id === empresaId)
  }

  function getUsuario(usuarioId) {
    return usuarios.items.find((u) => u.id === usuarioId)
  }

  function ajustarEstoqueOferta(ofertaCodigo, delta) {
    const oferta = ofertas.items.find((o) => o.codigo === ofertaCodigo)
    if (!oferta) return
    const novaQuantidade = Math.max(0, oferta.quantidade + delta)
    const novoStatus =
      novaQuantidade === 0 ? 'Esgotada' : oferta.status === 'Esgotada' ? 'Disponível' : oferta.status
    ofertas.editar(oferta.id, { quantidade: novaQuantidade, status: novoStatus })
  }

  function registrarRevisaoOferta(ofertaAtual, dados) {
    const novaOferta = ofertas.criar({
      codigo: `${ofertaAtual.codigoBase}-R${ofertaAtual.versao + 1}`,
      codigoBase: ofertaAtual.codigoBase,
      versao: ofertaAtual.versao + 1,
      produtoId: ofertaAtual.produtoId,
      fornecedorId: ofertaAtual.fornecedorId,
      precoCusto: { valor: dados.valor, moeda: dados.moeda, unidade: ofertaAtual.unidade },
      quantidade: dados.quantidade,
      unidade: ofertaAtual.unidade,
      status: dados.status,
      data: new Date().toISOString().slice(0, 10),
      usuarioId: usuarioLogado.id,
      observacao: dados.observacao,
    })

    // Qualquer proposta de venda ainda aberta que dependa deste código de oferta
    // recebe o novo custo automaticamente e volta para o vendedor decidir (margem recalculada).
    propostas.items
      .filter(
        (p) =>
          !['Aceita', 'Recusada', 'Expirada'].includes(p.status) &&
          p.itens.some((item) => item.ofertaCodigo === ofertaAtual.codigo),
      )
      .forEach((p) => {
        const novosItens = p.itens.map((item) =>
          item.ofertaCodigo === ofertaAtual.codigo
            ? { ...item, ofertaCodigo: novaOferta.codigo, precoCusto: { ...novaOferta.precoCusto } }
            : item,
        )
        propostas.editar(p.id, {
          status: 'Em negociação',
          itens: novosItens,
          historicoNegociacao: [
            ...p.historicoNegociacao,
            {
              rodada: p.historicoNegociacao.length + 1,
              autor: 'Comprador',
              tipo: 'Novo custo do fornecedor',
              preco: { ...novaOferta.precoCusto },
              quantidade: novosItens[0].quantidade,
              data: novaOferta.data,
              observacao: `Custo atualizado (${novaOferta.codigo}). Margem recalculada — aguardando decisão do vendedor.`,
            },
          ],
        })
      })

    return novaOferta
  }

  function verificarLimiteCredito(clienteId, valorNegocioUSD) {
    const empresa = getEmpresa(clienteId)
    if (!empresa) return { bloqueado: true, motivo: 'Cliente não encontrado.' }
    if (!empresa.limiteCredito || empresa.limiteCredito <= 0) {
      return { bloqueado: true, motivo: 'Cliente sem limite de crédito cadastrado — fechamento bloqueado pelo Financeiro.' }
    }
    const limiteUSD = converterParaUSD(empresa.limiteCredito, empresa.moedaPadrao)
    const utilizadoUSD = converterParaUSD(empresa.creditoUtilizado, empresa.moedaPadrao)
    if (utilizadoUSD + valorNegocioUSD > limiteUSD) {
      return { bloqueado: true, motivo: 'Fechamento excede o limite de crédito disponível do cliente — bloqueado pelo Financeiro.' }
    }
    return { bloqueado: false }
  }

  function registrarUsoCreditoCliente(clienteId, valorNegocioUSD) {
    const empresa = getEmpresa(clienteId)
    if (!empresa) return
    const acrescimo = converterDeUSD(valorNegocioUSD, empresa.moedaPadrao)
    empresas.editar(empresa.id, { creditoUtilizado: empresa.creditoUtilizado + acrescimo })
  }

  function getPendencias(usuario) {
    return calcularPendencias(usuario, { ofertas, propostas, getEmpresa, getUsuario, getProduto, getDivisaoIdDeProduto })
  }

  const value = {
    divisoes,
    familias,
    produtos,
    categoriasContato,
    usuarios,
    empresas,
    contatos,
    ofertas,
    propostas,
    documentos,
    usuarioLogado,
    setUsuarioLogadoId,
    getFamilia,
    getProduto,
    getDivisao,
    getDivisaoIdDeProduto,
    getEmpresa,
    getUsuario,
    calcularResumoProposta,
    getPendencias,
    ajustarEstoqueOferta,
    registrarRevisaoOferta,
    verificarLimiteCredito,
    registrarUsoCreditoCliente,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData deve ser usado dentro de um DataProvider')
  return context
}
