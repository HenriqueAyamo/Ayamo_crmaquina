import { Fragment, useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Maximize2, Minimize2, Columns3 } from 'lucide-react'
import EmptyState from './EmptyState.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

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

function carregarOcultas(chave) {
  if (!chave) return []
  try {
    const bruto = localStorage.getItem(`ayamo_crm_v1_colunas_${chave}`)
    return bruto ? JSON.parse(bruto) : []
  } catch {
    return []
  }
}

export default function DataTable({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyLabel,
  storageKey,
  stickyFirstColumn = false,
  linhaExpandida,
}) {
  const { t } = useI18n()
  const [ordenacao, setOrdenacao] = useState({ chave: null, direcao: 'asc' })
  const [telaCheia, setTelaCheia] = useState(false)
  const [colunasOcultas, setColunasOcultas] = useState(() => carregarOcultas(storageKey))
  const [menuColunasAberto, setMenuColunasAberto] = useState(false)
  const [linhasExpandidas, setLinhasExpandidas] = useState(() => new Set())

  const getKey = (row) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey])

  function alternarExpansao(chave) {
    setLinhasExpandidas((atual) => {
      const nova = new Set(atual)
      if (nova.has(chave)) nova.delete(chave)
      else nova.add(chave)
      return nova
    })
  }

  const colunasVisiveis = useMemo(
    () => columns.filter((col) => col.toggleable === false || !colunasOcultas.includes(col.key)),
    [columns, colunasOcultas],
  )

  const colunasComToggle = columns.filter((col) => col.toggleable !== false)

  function alternarColuna(chaveColuna) {
    setColunasOcultas((atual) => {
      const nova = atual.includes(chaveColuna) ? atual.filter((c) => c !== chaveColuna) : [...atual, chaveColuna]
      if (storageKey) {
        try {
          localStorage.setItem(`ayamo_crm_v1_colunas_${storageKey}`, JSON.stringify(nova))
        } catch {
          // localStorage indisponível — segue só em memória
        }
      }
      return nova
    })
  }

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

  const semDados = !data || data.length === 0

  return (
    <div className={telaCheia ? 'fixed inset-0 z-50 flex flex-col overflow-hidden bg-ayamo-bg p-4' : ''}>
      {!semDados && (
        <div className="mb-2 flex items-center justify-end gap-2">
          {colunasComToggle.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuColunasAberto((atual) => !atual)}
                className="flex items-center gap-1.5 rounded border border-ayamo-border bg-ayamo-surface px-2.5 py-1.5 text-xs text-ayamo-text-mut hover:bg-ayamo-bg hover:text-ayamo-text"
                title={t('modal.mostrarOcultarColunas')}
              >
                <Columns3 size={14} />
                Colunas
              </button>
              {menuColunasAberto && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuColunasAberto(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-56 rounded border border-ayamo-border bg-ayamo-surface p-2 shadow-md">
                    {colunasComToggle.map((col) => (
                      <label key={col.key} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-ayamo-text hover:bg-ayamo-bg">
                        <input
                          type="checkbox"
                          checked={!colunasOcultas.includes(col.key)}
                          onChange={() => alternarColuna(col.key)}
                        />
                        {col.header}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setTelaCheia((atual) => !atual)}
            className="flex items-center gap-1.5 rounded border border-ayamo-border bg-ayamo-surface px-2.5 py-1.5 text-xs text-ayamo-text-mut hover:bg-ayamo-bg hover:text-ayamo-text"
            title={telaCheia ? 'Sair da tela cheia' : 'Ver em tela cheia'}
          >
            {telaCheia ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          </button>
        </div>
      )}

      {semDados ? (
        <EmptyState title={emptyLabel ?? 'Nenhum registro encontrado'} />
      ) : (
        <div className={`overflow-auto rounded border border-ayamo-border bg-ayamo-surface ${telaCheia ? 'flex-1' : ''}`}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-ayamo-bg">
              <tr>
                {linhaExpandida && <th className="w-8 border-b border-ayamo-border" />}
                {colunasVisiveis.map((col, indice) => {
                  const ordenavel = col.sortable !== false && col.key !== '_acoes'
                  const ativa = ordenacao.chave === col.key
                  const fixa = stickyFirstColumn && indice === 0
                  return (
                    <th
                      key={col.key}
                      onClick={ordenavel ? () => alternarOrdenacao(col) : undefined}
                      className={`border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut ${
                        ordenavel ? 'cursor-pointer select-none hover:text-ayamo-text' : ''
                      } ${fixa ? 'sticky left-0 z-20 bg-ayamo-bg' : ''}`}
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
              {dadosOrdenados.map((row) => {
                const chave = getKey(row)
                const expandida = linhaExpandida && linhasExpandidas.has(chave)
                return (
                  <Fragment key={chave}>
                    <tr
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`border-b border-ayamo-border ${expandida ? '' : 'last:border-b-0'} ${
                        onRowClick ? 'cursor-pointer hover:bg-ayamo-bg' : ''
                      }`}
                    >
                      {linhaExpandida && (
                        <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => alternarExpansao(chave)}
                            className="text-ayamo-text-mut hover:text-ayamo-text"
                          >
                            <ChevronRight size={14} className={`transition-transform ${expandida ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                      )}
                      {colunasVisiveis.map((col, indice) => {
                        const fixa = stickyFirstColumn && indice === 0
                        return (
                          <td
                            key={col.key}
                            className={`whitespace-nowrap px-4 py-2.5 text-[13px] text-ayamo-text ${
                              fixa ? 'sticky left-0 z-[1] bg-ayamo-surface' : ''
                            }`}
                          >
                            {col.render ? col.render(row) : row[col.key]}
                          </td>
                        )
                      })}
                    </tr>
                    {expandida && (
                      <tr className="border-b border-ayamo-border last:border-b-0">
                        <td colSpan={colunasVisiveis.length + 1} className="bg-ayamo-bg px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {linhaExpandida(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
