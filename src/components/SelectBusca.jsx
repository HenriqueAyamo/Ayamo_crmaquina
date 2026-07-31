import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { inputClass } from './Field.jsx'

// <select> comum vira ruim de usar quando a lista passa de umas 10 opções — este componente
// deixa digitar pra filtrar em vez de rolar uma lista longa.
export default function SelectBusca({ value, onChange, opcoes, placeholder = 'Selecione', disabled = false, erro = false }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const containerRef = useRef(null)

  const selecionada = opcoes.find((o) => String(o.value) === String(value))

  const filtradas = opcoes.filter((o) => o.label.toLowerCase().includes(busca.toLowerCase()))

  useEffect(() => {
    function aoClicarFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false)
        setBusca('')
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  function escolher(opcao) {
    onChange(String(opcao.value))
    setAberto(false)
    setBusca('')
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        className={`${inputClass} flex items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-60 ${erro ? 'border-ayamo-danger' : ''}`}
      >
        <span className={selecionada ? 'text-ayamo-text' : 'text-ayamo-text-mut'}>{selecionada ? selecionada.label : placeholder}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-ayamo-text-mut" />
      </button>

      {aberto && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded border border-ayamo-border bg-ayamo-surface shadow-lg">
          <input
            autoFocus
            className={`${inputClass} rounded-b-none border-x-0 border-t-0`}
            placeholder="Digite para buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto">
            {filtradas.length === 0 && <p className="px-3 py-2 text-sm text-ayamo-text-mut">Nada encontrado.</p>}
            {filtradas.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => escolher(o)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-ayamo-bg ${
                  String(o.value) === String(value) ? 'bg-ayamo-primary/10 font-medium text-ayamo-primary' : 'text-ayamo-text'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
