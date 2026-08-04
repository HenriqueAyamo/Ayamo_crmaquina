import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { TRADUCOES } from './traducoes.js'

export const IDIOMAS = [
  { codigo: 'pt', nome: 'Português', curto: 'PT', locale: 'pt-BR' },
  { codigo: 'en', nome: 'English', curto: 'EN', locale: 'en-US' },
  { codigo: 'es', nome: 'Español', curto: 'ES', locale: 'es-ES' },
]

const CHAVE_STORAGE = 'ayamo_crm_v1_idioma'
const IDIOMA_PADRAO = 'pt'

const I18nContext = createContext(null)

function idiomaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE)
    if (salvo && IDIOMAS.some((i) => i.codigo === salvo)) return salvo
  } catch {
    // localStorage indisponível — cai no padrão
  }
  const doNavegador = (navigator.language ?? '').slice(0, 2)
  return IDIOMAS.some((i) => i.codigo === doNavegador) ? doNavegador : IDIOMA_PADRAO
}

export function I18nProvider({ children }) {
  const [idioma, setIdiomaState] = useState(idiomaInicial)

  const setIdioma = useCallback((novo) => {
    setIdiomaState(novo)
    try {
      localStorage.setItem(CHAVE_STORAGE, novo)
    } catch {
      // sem persistência, mas a troca vale para a sessão
    }
    document.documentElement.lang = IDIOMAS.find((i) => i.codigo === novo)?.locale ?? 'pt-BR'
  }, [])

  // t('compras.titulo') — cai no português se a chave ainda não foi traduzida, e devolve a
  // própria chave se não existir em lugar nenhum, o que deixa o buraco visível na tela.
  const t = useCallback(
    (chave, valores) => {
      const bruto = TRADUCOES[idioma]?.[chave] ?? TRADUCOES[IDIOMA_PADRAO]?.[chave] ?? chave
      if (!valores) return bruto
      return Object.entries(valores).reduce(
        (texto, [nome, valor]) => texto.replaceAll(`{${nome}}`, String(valor)),
        bruto,
      )
    },
    [idioma],
  )

  const locale = IDIOMAS.find((i) => i.codigo === idioma)?.locale ?? 'pt-BR'

  const value = useMemo(() => ({ idioma, setIdioma, t, locale }), [idioma, setIdioma, t, locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n deve ser usado dentro de um I18nProvider')
  return context
}
