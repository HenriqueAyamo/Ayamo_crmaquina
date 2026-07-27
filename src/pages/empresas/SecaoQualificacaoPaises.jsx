import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { inputClass } from '../../components/Field.jsx'
import { PAISES_QUALIFICACAO, STATUS_QUALIFICACAO } from '../../data/qualificacaoPaises.js'

const CARTAO_TONE = {
  Aprovado: 'border-ayamo-success/25 bg-ayamo-success/10',
  'Em andamento': 'border-ayamo-warning/25 bg-ayamo-warning/10',
  'Não iniciado': 'border-ayamo-border bg-ayamo-bg',
  Vencido: 'border-ayamo-danger/25 bg-ayamo-danger/10',
}

const SELECT_TONE = {
  Aprovado: 'text-ayamo-success',
  'Em andamento': 'text-ayamo-warning',
  'Não iniciado': 'text-ayamo-text-mut',
  Vencido: 'text-ayamo-danger',
}

const PONTO_TONE = {
  Aprovado: 'bg-ayamo-success',
  'Em andamento': 'bg-ayamo-warning',
  'Não iniciado': 'bg-ayamo-text-mut',
  Vencido: 'bg-ayamo-danger',
}

function CartaoPais({ pais, status, onAtualizar, onRemover }) {
  return (
    <div className={`rounded-lg border p-2.5 transition-colors ${CARTAO_TONE[status]}`}>
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="truncate text-sm font-medium text-ayamo-text" title={pais}>
          {pais}
        </span>
        {onRemover && (
          <button
            type="button"
            onClick={() => onRemover(pais)}
            className="flex-shrink-0 text-ayamo-text-mut hover:text-ayamo-danger"
            title="Remover país"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${PONTO_TONE[status]}`} />
        <select
          className={`w-full rounded border-0 bg-transparent py-0.5 text-xs font-medium outline-none ${SELECT_TONE[status]}`}
          value={status}
          onChange={(e) => onAtualizar(pais, e.target.value)}
        >
          {STATUS_QUALIFICACAO.map((s) => (
            <option key={s} value={s} className="text-ayamo-text">
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function SecaoQualificacaoPaises({ value, onChange }) {
  const mapa = value ?? {}
  const [novoPais, setNovoPais] = useState('')

  const paisesExtras = Object.keys(mapa).filter((pais) => !PAISES_QUALIFICACAO.includes(pais))

  function atualizar(pais, status) {
    onChange({ ...mapa, [pais]: status })
  }

  function adicionarPais(e) {
    e.preventDefault()
    const nome = novoPais.trim()
    if (!nome || mapa[nome] !== undefined || PAISES_QUALIFICACAO.includes(nome)) return
    onChange({ ...mapa, [nome]: 'Não iniciado' })
    setNovoPais('')
  }

  function removerPais(pais) {
    const { [pais]: _removido, ...resto } = mapa
    onChange(resto)
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-ayamo-text">Qualificação por país</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAISES_QUALIFICACAO.map((pais) => (
          <CartaoPais key={pais} pais={pais} status={mapa[pais] ?? 'Não iniciado'} onAtualizar={atualizar} />
        ))}
        {paisesExtras.map((pais) => (
          <CartaoPais key={pais} pais={pais} status={mapa[pais] ?? 'Não iniciado'} onAtualizar={atualizar} onRemover={removerPais} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Adicionar outro país"
          value={novoPais}
          onChange={(e) => setNovoPais(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') adicionarPais(e)
          }}
        />
        <button
          type="button"
          onClick={adicionarPais}
          className="flex items-center gap-1.5 rounded border border-ayamo-border px-3 py-1.5 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>
    </div>
  )
}
