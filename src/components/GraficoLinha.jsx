import { useState } from 'react'

const ALTURA = 220
const LARGURA = 640
const MARGEM = { topo: 12, base: 28, esquerda: 56, direita: 12 }

export default function GraficoLinha({ series, rotulosX, formatarY }) {
  const [ocultas, setOcultas] = useState(() => new Set())

  const visiveis = series.filter((s) => !ocultas.has(s.nome))
  const todosValores = visiveis.flatMap((s) => s.pontos.filter((v) => v != null))
  const maximo = Math.max(1, ...todosValores)
  const minimo = Math.min(...todosValores, maximo * 0.9)

  const areaLargura = LARGURA - MARGEM.esquerda - MARGEM.direita
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.base

  function coordX(indice) {
    if (rotulosX.length <= 1) return MARGEM.esquerda + areaLargura / 2
    return MARGEM.esquerda + (indice / (rotulosX.length - 1)) * areaLargura
  }

  function coordY(valor) {
    if (maximo === minimo) return MARGEM.topo + areaAltura / 2
    return MARGEM.topo + areaAltura - ((valor - minimo) / (maximo - minimo)) * areaAltura
  }

  function alternar(nome) {
    setOcultas((atual) => {
      const nova = new Set(atual)
      if (nova.has(nome)) nova.delete(nome)
      else nova.add(nome)
      return nova
    })
  }

  if (series.length === 0 || rotulosX.length === 0) {
    return <p className="text-sm text-ayamo-text-mut">Sem dados suficientes para o gráfico.</p>
  }

  const linhasGrade = 4

  return (
    <div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" style={{ maxHeight: ALTURA }}>
        {Array.from({ length: linhasGrade + 1 }).map((_, i) => {
          const y = MARGEM.topo + (i / linhasGrade) * areaAltura
          const valor = maximo - (i / linhasGrade) * (maximo - minimo)
          return (
            <g key={i}>
              <line x1={MARGEM.esquerda} y1={y} x2={LARGURA - MARGEM.direita} y2={y} stroke="var(--ayamo-chart-grid)" strokeWidth="1" />
              <text x={MARGEM.esquerda - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--ayamo-text-mut)">
                {formatarY ? formatarY(valor) : Math.round(valor)}
              </text>
            </g>
          )
        })}

        {rotulosX.map((rotulo, i) => {
          if (rotulosX.length > 8 && i % Math.ceil(rotulosX.length / 8) !== 0) return null
          return (
            <text key={rotulo} x={coordX(i)} y={ALTURA - 8} textAnchor="middle" fontSize="9" fill="var(--ayamo-text-mut)">
              {rotulo}
            </text>
          )
        })}

        {visiveis.map((s) => {
          const pontosValidos = s.pontos.map((v, i) => (v == null ? null : `${coordX(i)},${coordY(v)}`)).filter(Boolean)
          return (
            <g key={s.nome}>
              <polyline points={pontosValidos.join(' ')} fill="none" stroke={s.cor} strokeWidth="2" />
              {s.pontos.map((v, i) => (v == null ? null : <circle key={i} cx={coordX(i)} cy={coordY(v)} r="2.5" fill={s.cor} />))}
            </g>
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((s) => (
          <button
            key={s.nome}
            type="button"
            onClick={() => alternar(s.nome)}
            className={`flex items-center gap-1.5 text-xs ${ocultas.has(s.nome) ? 'text-ayamo-text-mut line-through' : 'text-ayamo-text'}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor }} />
            {s.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
