import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import EmptyState from './EmptyState.jsx'

function valorPadrao(row, col) {
  return col.sortValue ? col.sortValue(row) : row[col.key]
}

function comparar(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'pt-BR', { numeric: true })
}

export default function DataTable({ columns, data, rowKey, onRowClick, emptyLabel }) {
  const [ordenacao, setOrdenacao] = useState({ chave: null, direcao: 'asc' })

  const getKey = (row) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey])

  const dadosOrdenados = useMemo(() => {
    if (!ordenacao.chave || !data) return data
    const coluna = columns.find((c) => c.key === ordenacao.chave)
    if (!coluna) return data
    const sinal = ordenacao.direcao === 'asc' ? 1 : -1
    return [...data].sort((a, b) => sinal * comparar(valorPadrao(a, coluna), valorPadrao(b, coluna)))
  }, [data, ordenacao, columns])

  function alternarOrdenacao(coluna) {
    if (coluna.sortable === false || coluna.key === '_acoes') return
    setOrdenacao((atual) => {
      if (atual.chave !== coluna.key) return { chave: coluna.key, direcao: 'asc' }
      return { chave: coluna.key, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
    })
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyLabel ?? 'Nenhum registro encontrado'} />
  }

  return (
    <div className="overflow-x-auto rounded border border-ayamo-border bg-ayamo-surface">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-ayamo-bg">
          <tr>
            {columns.map((col) => {
              const ordenavel = col.sortable !== false && col.key !== '_acoes'
              const ativa = ordenacao.chave === col.key
              return (
                <th
                  key={col.key}
                  onClick={ordenavel ? () => alternarOrdenacao(col) : undefined}
                  className={`border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut ${
                    ordenavel ? 'cursor-pointer select-none hover:text-ayamo-text' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {ordenavel &&
                      (ativa ? (
                        ordenacao.direcao === 'asc' ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      ))}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {dadosOrdenados.map((row) => (
            <tr
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-ayamo-border last:border-b-0 ${
                onRowClick ? 'cursor-pointer hover:bg-ayamo-bg' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-[13px] text-ayamo-text">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
