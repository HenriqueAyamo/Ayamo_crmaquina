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
import { documentos as documentosMock } from './data/documentos.js'
import { demandas as demandasMock } from './data/demandas.js'
import { claims as claimsMock } from './data/claims.js'
import { dadosAyamo as dadosAyamoMock } from './data/dadosAyamo.js'
import { converterParaUSD, converterDeUSD, calcularResumoProposta } from './data/cambio.js'
import { calcularPendencias } from './utils/pendencias.js'
import { criarAcoesOferta } from './utils/ofertasNegocio.js'

const DataContext = createContext(null)

const STORAGE_PREFIX = 'ayamo_crm_v1_'

function carregarStorage(chave, seed) {
  try {
    const bruto = localStorage.getItem(STORAGE_PREFIX + chave)
    return bruto ? JSON.parse(bruto) : seed
  } catch {
    return seed
  }
}

function salvarStorage(chave, valor) {
  try {
    localStorage.setItem(STORAGE_PREFIX + chave, JSON.stringify(valor))
  } catch {
    // localStorage indisponível (modo privado, quota excedida) — segue só em memória
  }
}

function useCollection(chave, seed) {
  const [items, setItems] = useState(() => carregarStorage(chave, seed))
  const proximoId = useRef(items.reduce((max, item) => Math.max(max, item.id), 0) + 1)

  function atualizar(computar) {
    setItems((atual) => {
      const novosItens = computar(atual)
      salvarStorage(chave, novosItens)
      return novosItens
    })
  }

  function criar(dados) {
    const novo = { situacao: 'Ativo', ...dados, id: proximoId.current }
    proximoId.current += 1
    atualizar((atual) => [...atual, novo])
    return novo
  }

  function editar(id, dados) {
    atualizar((atual) => atual.map((item) => (item.id === id ? { ...item, ...dados } : item)))
  }

  function inativar(id) {
    atualizar((atual) => atual.map((item) => (item.id === id ? { ...item, situacao: 'Inativo' } : item)))
  }

  function remover(id) {
    atualizar((atual) => atual.filter((item) => item.id !== id))
  }

  function substituir(novosItens) {
    proximoId.current = novosItens.reduce((max, item) => Math.max(max, item.id), 0) + 1
    atualizar(() => novosItens)
  }

  return { items, criar, editar, inativar, remover, substituir }
}

export function DataProvider({ children }) {
  const divisoes = useCollection('divisoes', divisoesMock)
  const familias = useCollection('familias', familiasMock)
  const produtos = useCollection('produtos', produtosMock)
  const categoriasContato = useCollection('categoriasContato', categoriasContatoMock)
  const usuarios = useCollection('usuarios', usuariosMock)
  const empresas = useCollection('empresas', empresasMock)
  const contatos = useCollection('contatos', contatosMock)
  const ofertas = useCollection('ofertas', ofertasMock)
  const propostas = useCollection('propostas', propostasMock)
  const documentos = useCollection('documentos', documentosMock)
  const dadosAyamo = useCollection('dadosAyamo', dadosAyamoMock)
  const demandas = useCollection('demandas', demandasMock)
  const claims = useCollection('claims', claimsMock)

  const [usuarioLogadoId, setUsuarioLogadoIdState] = useState(() => {
    const salvo = carregarStorage('usuarioLogadoId', null)
    return salvo ?? usuariosMock[0]?.id ?? 1
  })

  function setUsuarioLogadoId(id) {
    setUsuarioLogadoIdState(id)
    salvarStorage('usuarioLogadoId', id)
  }

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

  const {
    ajustarEstoqueOferta,
    registrarNotaOferta,
    alterarStatusOferta,
    registrarRevisaoOferta,
    notificarLogistica,
    avisarConcorrenciaEstoque,
  } = criarAcoesOferta({ ofertas, propostas, usuarioLogado })

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
    dadosAyamo,
    demandas,
    claims,
    getFamilia,
    getProduto,
    getDivisao,
    getDivisaoIdDeProduto,
    getEmpresa,
    getUsuario,
    calcularResumoProposta,
    getPendencias,
    ajustarEstoqueOferta,
    registrarNotaOferta,
    alterarStatusOferta,
    registrarRevisaoOferta,
    notificarLogistica,
    avisarConcorrenciaEstoque,
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
