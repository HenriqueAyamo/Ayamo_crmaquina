import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, LayoutGrid } from 'lucide-react'
import { useDivisao } from './DivisaoContext.jsx'

// Seletor do módulo aberto. Fica em destaque na barra superior porque define o
// escopo de tudo que a pessoa vê — não é um filtro qualquer, é onde ela está.
export default function SeletorDivisao() {
  const { divisaoAtiva, permitidas, podeTrocar, trocarDivisao } = useDivisao()
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e) {
      if (!containerRef.current?.contains(e.target)) setAberto(false)
    }
    function aoTeclar(e) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  if (!divisaoAtiva) return null

  // Uma divisão só: mostra onde está, sem oferecer troca que não existe.
  if (!podeTrocar) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-ayamo-primary/10 px-3 py-1.5">
        <LayoutGrid size={15} className="text-ayamo-primary" />
        <span className="text-sm font-semibold text-ayamo-primary">{divisaoAtiva.nome}</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="flex items-center gap-2 rounded-md bg-ayamo-primary/10 px-3 py-1.5 text-sm font-semibold text-ayamo-primary transition-colors hover:bg-ayamo-primary/15"
      >
        <LayoutGrid size={15} />
        {divisaoAtiva.nome}
        <ChevronDown size={14} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute left-0 z-40 mt-1.5 min-w-[220px] overflow-hidden rounded-md border border-ayamo-border bg-ayamo-surface py-1 shadow-pop"
        >
          <p className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-ayamo-text-mut">
            Módulo
          </p>
          {permitidas.map((divisao) => {
            const ativa = divisao.id === divisaoAtiva.id
            return (
              <button
                key={divisao.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  trocarDivisao(divisao.id)
                  setAberto(false)
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-ayamo-bg ${
                  ativa ? 'font-medium text-ayamo-primary' : 'text-ayamo-text'
                }`}
              >
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                  {ativa && <Check size={13} strokeWidth={3} />}
                </span>
                {divisao.nome}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
