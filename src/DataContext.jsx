import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
import { inspecoes as inspecoesMock } from './data/inspecoes.js'
import { fretes as fretesMock } from './data/fretes.js'
import { interacoes as interacoesMock } from './data/interacoes.js'
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

  const atualizar = useCallback(
    (computar) => {
      setItems((atual) => {
        const novosItens = computar(atual)
        salvarStorage(chave, novosItens)
        return novosItens
      })
    },
    [chave],
  )

  const criar = useCallback(
    (dados) => {
      const novo = { situacao: 'Ativo', ...dados, id: proximoId.current }
      proximoId.current += 1
      atualizar((atual) => [...atual, novo])
      return novo
    },
    [atualizar],
  )

  const editar = useCallback(
    (id, dados) => {
      atualizar((atual) => atual.map((item) => (item.id === id ? { ...item, ...dados } : item)))
    },
    [atualizar],
  )

  const inativar = useCallback(
    (id) => {
      atualizar((atual) => atual.map((item) => (item.id === id ? { ...item, situacao: 'Inativo' } : item)))
    },
    [atualizar],
  )

  const remover = useCallback(
    (id) => {
      atualizar((atual) => atual.filter((item) => item.id !== id))
    },
    [atualizar],
  )

  const substituir = useCallback(
    (novosItens) => {
      proximoId.current = novosItens.reduce((max, item) => Math.max(max, item.id), 0) + 1
      atualizar(() => novosItens)
    },
    [atualizar],
  )

  return useMemo(
    () => ({ items, criar, editar, inativar, remover, substituir }),
    [items, criar, editar, inativar, remover, substituir],
  )
}

export function DataProvider({ children, usuarioAutenticado }) {
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
  const inspecoes = useCollection('inspecoes', inspecoesMock)
  const fretes = useCollection('fretes', fretesMock)
  const interacoes = useCollection('interacoes', interacoesMock)

  // Sem autenticação ligada, o usuário é escolhido no seletor da barra superior
  // e fica guardado no navegador — é só uma simulação de perfil, não credencial.
  const [usuarioLogadoId, setUsuarioLogadoIdState] = useState(() => {
    const salvo = carregarStorage('usuarioLogadoId', null)
    return salvo ?? usuariosMock[0]?.id ?? 1
  })

  const setUsuarioLogadoId = useCallback((id) => {
    setUsuarioLogadoIdState(id)
    salvarStorage('usuarioLogadoId', id)
  }, [])

  // Com autenticação ligada, quem está logado vem da sessão do servidor, não de
  // uma escolha no cliente. O cadastro local complementa com o que a sessão não
  // carrega (responsabilidades por divisão, diretor aprovador), casando pelo
  // e-mail. O perfil que vale é sempre o do servidor — mudar o cadastro local
  // não concede permissão.
  const usuarioLogado = useMemo(() => {
    if (!usuarioAutenticado) {
      return usuarios.items.find((u) => u.id === usuarioLogadoId) ?? usuarios.items[0]
    }
    const doCadastro = usuarios.items.find((u) => u.email?.toLowerCase() === usuarioAutenticado.email?.toLowerCase())
    return {
      ...(doCadastro ?? {}),
      id: doCadastro?.id ?? usuarioAutenticado.id,
      nome: usuarioAutenticado.nome,
      email: usuarioAutenticado.email,
      perfil: usuarioAutenticado.perfil,
      situacao: 'Ativo',
      responsabilidades: doCadastro?.responsabilidades ?? [],
    }
  }, [usuarios.items, usuarioAutenticado, usuarioLogadoId])

  // Carimba divisaoId nos registros criados antes do escopo por divisão existir.
  // Roda uma vez por sessão: a divisão passa a viver no próprio registro, e
  // deixa de ser recalculada a partir de produto → família a cada leitura.
  const migracaoFeita = useRef(false)
  useEffect(() => {
    if (migracaoFeita.current) return
    if (familias.items.length === 0 || produtos.items.length === 0) return
    migracaoFeita.current = true

    const divisaoDoProduto = (produtoId) => {
      const produto = produtos.items.find((p) => p.id === produtoId)
      const familia = familias.items.find((f) => f.id === produto?.familiaId)
      return familia?.divisaoId ?? null
    }

    const carimbar = (colecao, obterProdutoId) => {
      const faltando = colecao.items.filter((item) => item.divisaoId == null)
      if (faltando.length === 0) return
      colecao.substituir(
        colecao.items.map((item) =>
          item.divisaoId == null ? { ...item, divisaoId: divisaoDoProduto(obterProdutoId(item)) } : item,
        ),
      )
    }

    carimbar(ofertas, (o) => o.produtoId)
    carimbar(propostas, (p) => p.itens?.[0]?.produtoId)
    carimbar(demandas, (d) => d.produtoId)
    carimbar(claims, (c) => c.produtoId)
  }, [familias.items, produtos.items, ofertas, propostas, demandas, claims])

  const getFamilia = useCallback((familiaId) => familias.items.find((f) => f.id === familiaId), [familias.items])

  const getProduto = useCallback((produtoId) => produtos.items.find((p) => p.id === produtoId), [produtos.items])

  const getDivisaoIdDeProduto = useCallback(
    (produtoId) => {
      const familia = getFamilia(getProduto(produtoId)?.familiaId)
      return familia?.divisaoId ?? null
    },
    [getFamilia, getProduto],
  )

  const getDivisao = useCallback((divisaoId) => divisoes.items.find((d) => d.id === divisaoId), [divisoes.items])

  const getEmpresa = useCallback((empresaId) => empresas.items.find((e) => e.id === empresaId), [empresas.items])

  const getUsuario = useCallback((usuarioId) => usuarios.items.find((u) => u.id === usuarioId), [usuarios.items])

  const {
    ajustarEstoqueOferta,
    registrarNotaOferta,
    alterarStatusOferta,
    registrarRevisaoOferta,
    notificarLogistica,
    avisarConcorrenciaEstoque,
  } = useMemo(() => criarAcoesOferta({ ofertas, propostas, usuarioLogado }), [ofertas, propostas, usuarioLogado])

  const verificarLimiteCredito = useCallback(
    (clienteId, valorNegocioUSD) => {
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
    },
    [getEmpresa],
  )

  const registrarUsoCreditoCliente = useCallback(
    (clienteId, valorNegocioUSD) => {
      const empresa = getEmpresa(clienteId)
      if (!empresa) return
      const acrescimo = converterDeUSD(valorNegocioUSD, empresa.moedaPadrao)
      empresas.editar(empresa.id, { creditoUtilizado: empresa.creditoUtilizado + acrescimo })
    },
    [getEmpresa, empresas],
  )

  const getPendencias = useCallback(
    (usuario, divisaoId = null) =>
      calcularPendencias(
        usuario,
        {
        ofertas,
        propostas,
        interacoes,
        empresas,
        produtos,
        getEmpresa,
        getUsuario,
        getProduto,
          getDivisaoIdDeProduto,
        },
        divisaoId,
      ),
    [ofertas, propostas, interacoes, empresas, produtos, getEmpresa, getUsuario, getProduto, getDivisaoIdDeProduto],
  )

  const resetarTodosDados = useCallback(() => {
    Object.keys(localStorage)
      .filter((chave) => chave.startsWith(STORAGE_PREFIX))
      .forEach((chave) => localStorage.removeItem(chave))
    window.location.reload()
  }, [])

  const value = useMemo(
    () => ({
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
      fretes,
      inspecoes,
      interacoes,
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
      resetarTodosDados,
    }),
    [
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
      fretes,
      inspecoes,
      interacoes,
      getFamilia,
      getProduto,
      getDivisao,
      getDivisaoIdDeProduto,
      getEmpresa,
      getUsuario,
      getPendencias,
      ajustarEstoqueOferta,
      registrarNotaOferta,
      alterarStatusOferta,
      registrarRevisaoOferta,
      notificarLogistica,
      avisarConcorrenciaEstoque,
      verificarLimiteCredito,
      registrarUsoCreditoCliente,
      resetarTodosDados,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData deve ser usado dentro de um DataProvider')
  return context
}
