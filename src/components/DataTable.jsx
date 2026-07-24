import EmptyState from './EmptyState.jsx'

export default function DataTable({ columns, data, rowKey, onRowClick, indentKey, emptyLabel }) {
  const getKey = (row) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey])

  if (!data || data.length === 0) {
    return <EmptyState title={emptyLabel ?? 'Nenhum registro encontrado'} />
  }

  return (
    <div className="overflow-x-auto rounded border border-ayamo-border bg-ayamo-surface">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-ayamo-bg">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-ayamo-border last:border-b-0 ${
                onRowClick ? 'cursor-pointer hover:bg-ayamo-bg' : ''
              }`}
            >
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={`px-4 py-2.5 text-[13px] text-ayamo-text ${
                    i === 0 && indentKey ? indentClass(row, indentKey) : ''
                  }`}
                >
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

function indentClass(row, indentKey) {
  return row[indentKey] ? 'pl-8' : ''
}
