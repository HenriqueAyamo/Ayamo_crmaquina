import { useState } from 'react'

export default function BarraEstoque({ total, restante, unidade }) {
  const vendido = Math.max(0, total - restante)
  const percentual = total > 0 ? Math.min(100, Math.round((vendido / total) * 100)) : 0
  const [hover, setHover] = useState(false)

  return (
    <div className="relative w-32" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ayamo-bg">
        <div className="h-full bg-ayamo-primary" style={{ width: `${percentual}%` }} />
      </div>
      <p className="mt-0.5 text-[11px] text-ayamo-text-mut">
        {restante.toLocaleString('pt-BR')} {unidade} rem.
      </p>

      {hover && (
        <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded border border-ayamo-border bg-ayamo-surface p-2 text-xs shadow-lg">
          <p className="mb-1 font-semibold text-ayamo-text">Detalhamento do volume</p>
          <p className="text-ayamo-text-mut">
            Total: {total.toLocaleString('pt-BR')} {unidade}
          </p>
          <p className="text-ayamo-text-mut">
            Vendido: {vendido.toLocaleString('pt-BR')} {unidade}
          </p>
          <p className="text-ayamo-text-mut">
            Restante: {restante.toLocaleString('pt-BR')} {unidade}
          </p>
          <p className="font-medium text-ayamo-text">{percentual}% vendido</p>
        </div>
      )}
    </div>
  )
}
