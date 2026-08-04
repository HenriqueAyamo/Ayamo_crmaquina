import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import EmptyState from './EmptyState.jsx'

// Substituto de DataTable em formato de cartão — aceita as mesmas props (columns, data, rowKey,
// onRowClick, emptyLabel, linhaExpandida) pra trocar direto sem redesenhar cada tela. A primeira
// coluna vira o título do card; o resto vira uma grade de campo:valor; a coluna "_acoes" vira os
// botões no rodapé. Não tem ordenar/ocultar coluna/tela cheia — isso não existe em cards.
export default function CardList({ columns, data, rowKey, onRowClick, emptyLabel, linhaExpandida }) {
  const [expandidos, setExpandidos] = useState(() => new Set())
  const getKey = (row) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey])

  if (!data || data.length === 0) {
    return <EmptyState title={emptyLabel ?? 'Nenhum registro encontrado'} />
  }

  const [colunaTitulo, ...resto] = columns
  const colunasCampos = resto.filter((c) => c.key !== '_acoes')
  const colunaAcoes = resto.find((c) => c.key === '_acoes')

  function alternarExpansao(chave) {
    setExpandidos((atual) => {
      const nova = new Set(atual)
      if (nova.has(chave)) nova.delete(chave)
      else nova.add(chave)
      return nova
    })
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((row) => {
        const chave = getKey(row)
        const expandido = linhaExpandida && expandidos.has(chave)
        const acoes = colunaAcoes?.render(row)
        return (
          <div
            key={chave}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`rounded-lg border border-ayamo-border bg-ayamo-surface p-4 ${onRowClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-ayamo-primary/30 hover:shadow-card-hover' : ''}`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-ayamo-text">
                {colunaTitulo.render ? colunaTitulo.render(row) : row[colunaTitulo.key]}
              </div>
              {linhaExpandida && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    alternarExpansao(chave)
                  }}
                  className="flex-shrink-0 text-ayamo-text-mut hover:text-ayamo-text"
                >
                  <ChevronRight size={14} className={`transition-transform ${expandido ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {colunasCampos.map((col) => (
                <div key={col.key} className="min-w-0">
                  <dt className="text-ayamo-text-mut">{col.header}</dt>
                  <dd className={`font-medium text-ayamo-text ${col.render ? 'overflow-hidden' : 'truncate'}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </dd>
                </div>
              ))}
            </dl>

            {expandido && (
              <div className="mt-3 border-t border-ayamo-border pt-3" onClick={(e) => e.stopPropagation()}>
                {linhaExpandida(row)}
              </div>
            )}

            {acoes && (
              <div className="mt-3 flex justify-end border-t border-ayamo-border pt-3" onClick={(e) => e.stopPropagation()}>
                {acoes}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
