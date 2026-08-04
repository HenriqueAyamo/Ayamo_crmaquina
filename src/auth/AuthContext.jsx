import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Sessão do usuário. O token vive num cookie HttpOnly — o JavaScript não o
// enxerga, então um XSS não consegue roubar a sessão. Aqui guardamos só os
// dados de exibição que a API devolve.
const AuthContext = createContext(null)

const BASE_API = import.meta.env.VITE_API_URL ?? ''

async function chamar(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE_API}${caminho}`, {
    ...opcoes,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opcoes.headers },
  })

  let dados = null
  try {
    dados = await resposta.json()
  } catch {
    // resposta sem corpo (ex.: 204) — segue com dados null
  }

  if (!resposta.ok) {
    const erro = new Error(dados?.erro ?? 'Falha na comunicação com o servidor.')
    erro.status = resposta.status
    throw erro
  }
  return dados
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // Ao abrir o app, pergunta ao servidor se o cookie ainda vale.
  useEffect(() => {
    let cancelado = false
    chamar('/api/auth/me')
      .then((dados) => {
        if (!cancelado) setUsuario(dados.usuario)
      })
      .catch(() => {
        if (!cancelado) setUsuario(null)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const entrar = useCallback(async (email, senha) => {
    const dados = await chamar('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) })
    setUsuario(dados.usuario)
    return dados.usuario
  }, [])

  const sair = useCallback(async () => {
    try {
      await chamar('/api/auth/logout', { method: 'POST' })
    } finally {
      setUsuario(null)
    }
  }, [])

  const trocarSenha = useCallback(async (senhaAtual, novaSenha) => {
    await chamar('/api/auth/senha', { method: 'POST', body: JSON.stringify({ senhaAtual, novaSenha }) })
    setUsuario((atual) => (atual ? { ...atual, precisaTrocarSenha: false } : atual))
  }, [])

  const value = useMemo(
    () => ({ usuario, carregando, entrar, sair, trocarSenha }),
    [usuario, carregando, entrar, sair, trocarSenha],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  return context
}
