import { useState } from 'react'

function ler(chave) {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

// Rascunho automatico generico: salva sob demanda e pode ser relido (o modal que o usa
// costuma ficar montado o tempo todo, só alternando `open` — por isso `recarregar()` existe,
// para pegar o estado mais recente do localStorage toda vez que o modal reabre).
export function useAutoSaveRascunho(chave) {
  const [rascunho, setRascunho] = useState(() => ler(chave))

  function recarregar() {
    const atual = ler(chave)
    setRascunho(atual)
    return atual
  }

  function salvar(dados) {
    try {
      localStorage.setItem(chave, JSON.stringify({ dados, salvoEm: new Date().toISOString() }))
    } catch {
      // localStorage indisponível — segue só em memória, sem persistir o rascunho
    }
  }

  function limpar() {
    try {
      localStorage.removeItem(chave)
    } catch {
      // ignorar
    }
    setRascunho(null)
  }

  return { rascunho, recarregar, salvar, limpar }
}
