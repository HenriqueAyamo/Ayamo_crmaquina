import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { inputClass } from './Field.jsx'

function separadorDecimal(locale) {
  return locale.startsWith('en') ? '.' : ','
}

function formatar(valor, locale) {
  if (valor === '' || valor == null || Number.isNaN(Number(valor))) return ''
  return Number(valor).toLocaleString(locale, { maximumFractionDigits: 2 })
}

function contarDigitosAte(texto, posicao) {
  let count = 0
  for (let i = 0; i < posicao && i < texto.length; i++) {
    if (/[0-9]/.test(texto[i])) count++
  }
  return count
}

function posicaoParaDigitos(texto, digitosAlvo) {
  let count = 0
  for (let i = 0; i < texto.length; i++) {
    if (count === digitosAlvo) return i
    if (/[0-9]/.test(texto[i])) count++
  }
  return texto.length
}

export default function CampoNumerico({ value, onChange, locale = 'pt-BR', required, placeholder }) {
  const inputRef = useRef(null)
  const cursorPendente = useRef(null)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(() => formatar(value, locale))

  useEffect(() => {
    if (editando) return
    setTexto(formatar(value, locale))
  }, [value, locale, editando])

  useLayoutEffect(() => {
    if (cursorPendente.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPendente.current, cursorPendente.current)
      cursorPendente.current = null
    }
  })

  function aoDigitar(e) {
    const bruto = e.target.value
    const digitosAntesDoCursor = contarDigitosAte(bruto, e.target.selectionStart)
    const separador = separadorDecimal(locale)

    let inteiros = ''
    let decimais = ''
    let viuDecimal = false
    for (const ch of bruto) {
      if (/[0-9]/.test(ch)) {
        if (viuDecimal) decimais += ch
        else inteiros += ch
      } else if ((ch === ',' || ch === '.') && !viuDecimal) {
        viuDecimal = true
      }
    }
    decimais = decimais.slice(0, 2)

    if (inteiros === '' && decimais === '' && !viuDecimal) {
      setTexto('')
      cursorPendente.current = 0
      onChange('')
      return
    }

    const novoTexto = Number(inteiros || '0').toLocaleString(locale) + (viuDecimal ? separador + decimais : '')
    setTexto(novoTexto)
    cursorPendente.current = posicaoParaDigitos(novoTexto, digitosAntesDoCursor)
    onChange(Number(`${inteiros || '0'}.${decimais || '0'}`))
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className={inputClass}
      value={texto}
      required={required}
      placeholder={placeholder}
      onFocus={() => setEditando(true)}
      onBlur={() => setEditando(false)}
      onChange={aoDigitar}
    />
  )
}
