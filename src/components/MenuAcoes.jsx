import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import Botao from './Botao.jsx'

const TONE_ITEM = {
  neutro: 'text-ayamo-text',
  primario: 'text-ayamo-primary',
  sucesso: 'text-ayamo-success',
  alerta: 'text-ayamo-warning',
  perigo: 'text-ayamo-danger',
}

// Menu suspenso de ações secundárias. As telas de detalhe tinham 8 botões enfileirados no
// cabeçalho; agora só as ações principais ficam visíveis e o resto entra aqui.
// itens: { label, icone, onClick, tone, desabilitado, motivo, separadorAntes }
export default function MenuAcoes({ itens, rotulo = 'Mais ações', tamanho = 'sm', variante = 'secundario', alinhamento = 'direita' }) {
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

  const visiveis = itens.filter(Boolean)
  if (visiveis.length === 0) return null

  return (
    <div ref={containerRef} className="relative inline-block">
      <Botao
        variante={variante}
        tamanho={tamanho}
        icone={rotulo ? undefined : MoreHorizontal}
        iconeFim={rotulo ? ChevronDown : undefined}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={rotulo || 'Mais ações'}
        onClick={() => setAberto((atual) => !atual)}
      >
        {rotulo}
      </Botao>

      {aberto && (
        <div
          role="menu"
          className={`absolute z-40 mt-1.5 min-w-[220px] overflow-hidden rounded-md border border-ayamo-border bg-ayamo-surface py-1 shadow-pop ${
            alinhamento === 'direita' ? 'right-0' : 'left-0'
          }`}
        >
          {visiveis.map((item, indice) => {
            const Icone = item.icone
            return (
              <div key={item.label}>
                {item.separadorAntes && indice > 0 && <div className="my-1 h-px bg-ayamo-border" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.desabilitado}
                  title={item.desabilitado ? item.motivo : undefined}
                  onClick={() => {
                    setAberto(false)
                    item.onClick()
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-ayamo-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                    TONE_ITEM[item.tone] ?? TONE_ITEM.neutro
                  }`}
                >
                  {Icone && <Icone size={14} className="flex-shrink-0" />}
                  <span className="flex-1">{item.label}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
