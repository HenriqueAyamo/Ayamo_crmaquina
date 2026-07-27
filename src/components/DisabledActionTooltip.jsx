import { useState } from 'react'

export default function DisabledActionTooltip({ desabilitado, motivo, children }) {
  const [hover, setHover] = useState(false)
  const mostrarDica = desabilitado && Boolean(motivo)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => mostrarDica && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {mostrarDica && hover && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-48 -translate-x-1/2 rounded bg-ayamo-text px-2 py-1.5 text-center text-xs text-white shadow-lg">
          {motivo}
        </span>
      )}
    </span>
  )
}
