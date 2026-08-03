import { AlertCircle, CheckCircle2 } from 'lucide-react'

// Tabela de conferência mostrada entre "selecionar planilha" e "gravar de fato" — nada é
// salvo até o usuário clicar em confirmar, pra dar chance de revisar o que a leitura entendeu.
export default function PreviewImportacao({ linhas, validas, onConfirmar, onCancelar, confirmando, labelConfirmar = 'Confirmar importação' }) {
  return (
    <div className="mt-3 rounded border border-ayamo-border bg-ayamo-surface">
      <div className="border-b border-ayamo-border px-4 py-3">
        <p className="text-sm font-medium text-ayamo-text">
          Pré-visualização — {validas} de {linhas.length} linha(s) prontas para importar
        </p>
        <p className="text-xs text-ayamo-text-mut">Confira antes de confirmar. Nada foi salvo ainda.</p>
      </div>

      <div className="max-h-[32rem] overflow-y-auto">
        {linhas.map((linha) => (
          <div
            key={linha.numeroLinha}
            className="flex items-start gap-3 border-b border-ayamo-border px-4 py-3 last:border-b-0"
          >
            {linha.status === 'ok' ? (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-ayamo-success" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-ayamo-danger" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ayamo-text-mut">Linha {linha.numeroLinha}</p>
              {linha.status === 'ok' ? (
                <>
                  <p className="text-sm font-medium text-ayamo-text">{linha.titulo}</p>
                  <p className="text-xs text-ayamo-text-mut">{linha.detalhe}</p>
                  {linha.campos?.length > 0 && (
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded bg-ayamo-bg p-2 sm:grid-cols-3">
                      {linha.campos.map((campo) => (
                        <div key={campo.label} className="min-w-0">
                          <dt className="text-[11px] uppercase tracking-wide text-ayamo-text-mut">{campo.label}</dt>
                          <dd className="truncate text-xs text-ayamo-text" title={campo.valor}>
                            {campo.valor || '—'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </>
              ) : (
                <p className="text-sm text-ayamo-danger">{linha.mensagem}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 border-t border-ayamo-border px-4 py-3">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={validas === 0 || confirmando}
          onClick={onConfirmar}
          className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labelConfirmar} ({validas})
        </button>
      </div>
    </div>
  )
}
