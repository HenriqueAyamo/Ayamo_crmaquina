import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useData } from '../DataContext.jsx'
import { divisoesDoUsuario, filtrarPorDivisao } from '../utils/escopoDivisao.js'

// Cada divisão é um módulo do sistema. Este contexto guarda qual módulo está
// aberto e quais o usuário pode abrir — tudo que é "do meu time" passa por aqui.
const DivisaoContext = createContext(null)

const CHAVE_STORAGE = 'ayamo_crm_v1_divisaoAtiva'

export function DivisaoProvider({ children }) {
  const { divisoes, usuarioLogado } = useData()

  const permitidas = useMemo(
    () => divisoesDoUsuario(usuarioLogado, divisoes.items),
    [usuarioLogado, divisoes.items],
  )

  const [divisaoAtivaId, setDivisaoAtivaId] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE)
      return salvo ? Number(salvo) : null
    } catch {
      return null
    }
  })

  // Se a divisão salva não é mais permitida (mudou de time, perdeu acesso),
  // cai para a primeira liberada em vez de mostrar uma tela vazia sem explicação.
  useEffect(() => {
    if (permitidas.length === 0) return
    const valida = permitidas.some((d) => d.id === divisaoAtivaId)
    if (!valida) setDivisaoAtivaId(permitidas[0].id)
  }, [permitidas, divisaoAtivaId])

  useEffect(() => {
    if (divisaoAtivaId == null) return
    try {
      localStorage.setItem(CHAVE_STORAGE, String(divisaoAtivaId))
    } catch {
      // sem persistência — a escolha vale só para esta sessão
    }
  }, [divisaoAtivaId])

  const divisaoAtiva = permitidas.find((d) => d.id === divisaoAtivaId) ?? permitidas[0] ?? null

  const trocarDivisao = useCallback((id) => setDivisaoAtivaId(Number(id)), [])

  // Atalho para as telas: recebe a lista crua e devolve só o que é do módulo.
  const noEscopo = useCallback((itens) => filtrarPorDivisao(itens, divisaoAtiva?.id ?? null), [divisaoAtiva])

  const value = useMemo(
    () => ({
      divisaoAtiva,
      divisaoAtivaId: divisaoAtiva?.id ?? null,
      permitidas,
      podeTrocar: permitidas.length > 1,
      trocarDivisao,
      noEscopo,
    }),
    [divisaoAtiva, permitidas, trocarDivisao, noEscopo],
  )

  return <DivisaoContext.Provider value={value}>{children}</DivisaoContext.Provider>
}

export function useDivisao() {
  const context = useContext(DivisaoContext)
  if (!context) throw new Error('useDivisao deve ser usado dentro de um DivisaoProvider')
  return context
}
