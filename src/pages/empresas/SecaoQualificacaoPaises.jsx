import { inputClass } from '../../components/Field.jsx'
import { PAISES_QUALIFICACAO, STATUS_QUALIFICACAO } from '../../data/qualificacaoPaises.js'

export default function SecaoQualificacaoPaises({ value, onChange }) {
  const mapa = value ?? {}

  function atualizar(pais, status) {
    onChange({ ...mapa, [pais]: status })
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
      </div>
    </div>
  )
}
