import { createContext, useContext, useState } from 'react'
import { divisoes as divisoesMock } from './data/divisoes.js'
import { familias as familiasMock } from './data/familias.js'
import { produtos as produtosMock } from './data/produtos.js'
import { categoriasContato as categoriasContatoMock } from './data/categoriasContato.js'
import { usuarios as usuariosMock } from './data/usuarios.js'
import { empresas as empresasMock } from './data/empresas.js'
import { contatos as contatosMock } from './data/contatos.js'
import { ofertas as ofertasMock } from './data/ofertas.js'
import { propostas as propostasMock } from './data/propostas.js'
import { calcularMargem } from './data/cambio.js'

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

  function criar(dados) {
    const novoId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1
    const novo = { situacao: 'Ativo', ...dados, id: novoId }
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

  function calcularResumoProposta(proposta) {
    let custoUSD = 0
    let vendaUSD = 0

    proposta.itens.forEach((item) => {
      const m = calcularMargem(
        { valor: item.precoCusto.valor, moeda: item.precoCusto.moeda },
        { valor: item.precoVenda.valor, moeda: item.precoVenda.moeda },
      )
      custoUSD += m.custoUSD * item.quantidade
      vendaUSD += m.vendaUSD * item.quantidade
    })

    const margemUSD = vendaUSD - custoUSD
    const margemPercentual = custoUSD !== 0 ? (margemUSD / custoUSD) * 100 : 0

    return { custoUSD, vendaUSD, margemUSD, margemPercentual }
  }

  function getPendencias(usuario) {
    if (!usuario) return []
    const pendencias = []

    if (usuario.perfil === 'Vendedor') {
      propostas.items
        .filter((p) => p.vendedorId === usuario.id)
        .forEach((p) => {
          const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
          const precisaAgir = p.status === 'Rascunho' || (p.status === 'Em negociação' && ultima?.autor === 'Cliente')
          if (!precisaAgir) return
          pendencias.push({
            tipo: 'proposta',
            id: p.numero,
            titulo: p.numero,
            descricao:
              p.status === 'Rascunho'
                ? 'Rascunho aguardando envio ao cliente'
                : `Cliente enviou contraproposta — ${getEmpresa(p.clienteId)?.nome ?? ''}`,
            data: ultima?.data ?? p.dataEnvio,
          })
        })
    }

    if (usuario.perfil === 'Comprador') {
      const divisoesResp = usuario.responsabilidades.map((r) => r.divisaoId)

      propostas.items.forEach((p) => {
        const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
        if (ultima?.tipo !== 'Escalar para comprador') return
        const divisaoItem = getDivisaoIdDeProduto(p.itens[0].produtoId)
        if (!divisoesResp.includes(divisaoItem)) return
        pendencias.push({
          tipo: 'proposta',
          id: p.numero,
          titulo: p.numero,
          descricao: `Escalada pelo vendedor ${getUsuario(p.vendedorId)?.nome ?? ''}`,
          data: ultima.data,
        })
      })

      ofertas.items
        .filter((o) => o.usuarioId === usuario.id && o.status === 'Em revisão')
        .forEach((o) => {
          pendencias.push({
            tipo: 'oferta',
            id: o.codigoBase,
            titulo: o.codigo,
            descricao: `Oferta em revisão — ${getProduto(o.produtoId)?.nome ?? ''}`,
            data: o.data,
          })
        })
    }

    if (usuario.perfil === 'Diretor') {
      propostas.items
        .filter((p) => p.status === 'Aguardando aprovação')
        .forEach((p) => {
          const vendedor = getUsuario(p.vendedorId)
          const divisaoItem = getDivisaoIdDeProduto(p.itens[0].produtoId)
          const souEuOAprovador = vendedor?.responsabilidades.some(
            (r) => r.divisaoId === divisaoItem && r.diretorId === usuario.id,
          )
          if (!souEuOAprovador) return
          const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
          pendencias.push({
            tipo: 'proposta',
            id: p.numero,
            titulo: p.numero,
            descricao: `Aprovação de margem solicitada por ${vendedor?.nome ?? ''}`,
            data: ultima?.data ?? p.dataEnvio,
          })
        })
    }

    return pendencias.sort((a, b) => (a.data < b.data ? 1 : -1))
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
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData deve ser usado dentro de um DataProvider')
  return context
}
