import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function SecaoRecolhivel({ titulo, aberturaInicial = true, children }) {
  const [aberto, setAberto] = useState(aberturaInicial)

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold text-ayamo-text">{titulo}</h2>
        {aberto ? <ChevronUp size={18} className="text-ayamo-text-mut" /> : <ChevronDown size={18} className="text-ayamo-text-mut" />}
      </button>
      {aberto && children}
    </div>
  )
}
