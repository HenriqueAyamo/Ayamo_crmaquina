import { ArrowLeft } from 'lucide-react'

// Cabeçalho padrão das telas de detalhe (compra, venda). Separa em três faixas:
// voltar → identificação + selos de status → barra de ações. Antes tudo ficava numa
// linha só, o que espremia o título quando havia muitos botões.
export default function CabecalhoDetalhe({ voltarLabel, onVoltar, titulo, subtitulo, selos, acoes, children }) {
  return (
    <div className="mb-6">
      {onVoltar && (
        <button
          type="button"
          onClick={onVoltar}
          className="mb-4 flex items-center gap-1 text-sm text-ayamo-text-mut transition-colors hover:text-ayamo-text"
        >
          <ArrowLeft size={16} />
          {voltarLabel}
        </button>
      )}

      <div className="rounded-lg border border-ayamo-border bg-ayamo-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-ayamo-text">{titulo}</h1>
              {selos}
            </div>
            {subtitulo && <p className="mt-1.5 text-sm text-ayamo-text-mut">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
        </div>

        {children && <div className="border-t border-ayamo-border px-5 py-4">{children}</div>}
      </div>
    </div>
  )
}
