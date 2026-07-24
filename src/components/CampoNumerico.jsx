import { useEffect, useState } from 'react'
import { inputClass } from './Field.jsx'

export default function CampoNumerico({ value, onChange, locale = 'pt-BR', required, placeholder }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')

  useEffect(() => {
    if (editando) return
    setTexto(value === '' || value == null ? '' : Number(value).toLocaleString(locale, { maximumFractionDigits: 2 }))
  }, [value, editando, locale])

  function aoFocar() {
    setEditando(true)
    setTexto(value === '' || value == null ? '' : String(value))
  }

  function aoDigitar(e) {
    const bruto = e.target.value.replace(',', '.')
    setTexto(e.target.value)
    if (bruto === '') {
      onChange('')
      return
    }
    const numero = Number(bruto)
    if (!Number.isNaN(numero)) onChange(numero)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={inputClass}
      value={texto}
      required={required}
      placeholder={placeholder}
      onFocus={aoFocar}
      onChange={aoDigitar}
      onBlur={() => setEditando(false)}
    />
  )
}
