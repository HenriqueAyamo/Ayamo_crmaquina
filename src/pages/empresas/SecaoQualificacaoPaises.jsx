import { useState } from 'react'
import { X } from 'lucide-react'
import { inputClass } from '../../components/Field.jsx'
import { PAISES_QUALIFICACAO, STATUS_QUALIFICACAO } from '../../data/qualificacaoPaises.js'

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
          <div key={pais} className="flex items-center justify-between gap-2 rounded border border-ayamo-border p-2">
            <span className="text-sm text-ayamo-text">{pais}</span>
            <select
              className={`${inputClass} w-32 text-xs`}
              value={mapa[pais] ?? 'Não iniciado'}
              onChange={(e) => atualizar(pais, e.target.value)}
            >
              {STATUS_QUALIFICACAO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
        {paisesExtras.map((pais) => (
          <div key={pais} className="flex items-center justify-between gap-2 rounded border border-ayamo-border p-2">
            <span className="text-sm text-ayamo-text">{pais}</span>
            <div className="flex items-center gap-1">
              <select
                className={`${inputClass} w-32 text-xs`}
                value={mapa[pais] ?? 'Não iniciado'}
                onChange={(e) => atualizar(pais, e.target.value)}
              >
                {STATUS_QUALIFICACAO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removerPais(pais)}
                className="text-ayamo-text-mut hover:text-ayamo-danger"
                title="Remover país"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
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
          className="rounded border border-ayamo-border px-3 py-1.5 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
