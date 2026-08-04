import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { inputClass } from './Field.jsx'

// Lista de contatos cadastrados com seleção múltipla, para envio em lote.
// Cada contato precisa ter { id, nome, telefone } e opcionalmente { empresaNome, cargo }.
export default function SeletorContatos({ contatos, selecionados, onChange, vazioLabel = 'Nenhum contato cadastrado' }) {
  const [busca, setBusca] = useState('')

  const comTelefone = useMemo(() => contatos.filter((c) => c.telefone?.replace(/\D/g, '')), [contatos])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return comTelefone
    return comTelefone.filter(
      (c) =>
        c.nome?.toLowerCase().includes(termo) ||
        c.empresaNome?.toLowerCase().includes(termo) ||
        c.cargo?.toLowerCase().includes(termo) ||
        c.telefone?.includes(termo),
    )
  }, [comTelefone, busca])

  const idsFiltrados = filtrados.map((c) => c.id)
  const todosMarcados = idsFiltrados.length > 0 && idsFiltrados.every((id) => selecionados.includes(id))

  function alternar(id) {
    onChange(selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id])
  }

  function alternarTodos() {
    if (todosMarcados) onChange(selecionados.filter((id) => !idsFiltrados.includes(id)))
    else onChange([...new Set([...selecionados, ...idsFiltrados])])
  }

  if (comTelefone.length === 0) {
    return <p className="rounded-md border border-dashed border-ayamo-border px-3 py-4 text-center text-xs text-ayamo-text-mut">{vazioLabel}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ayamo-text-mut" />
        <input
          className={`${inputClass} pl-8`}
          placeholder="Buscar contato, empresa ou cargo"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between px-0.5">
        <button type="button" onClick={alternarTodos} className="text-xs font-medium text-ayamo-primary hover:underline">
          {todosMarcados ? 'Desmarcar todos' : `Selecionar todos (${idsFiltrados.length})`}
        </button>
        <span className="text-xs text-ayamo-text-mut">{selecionados.length} selecionado(s)</span>
      </div>

      <ul className="max-h-56 overflow-y-auto rounded-md border border-ayamo-border">
        {filtrados.map((contato) => {
          const marcado = selecionados.includes(contato.id)
          return (
            <li key={contato.id} className="border-b border-ayamo-border last:border-b-0">
              <button
                type="button"
                onClick={() => alternar(contato.id)}
                aria-pressed={marcado}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-ayamo-bg ${
                  marcado ? 'bg-ayamo-primary/5' : ''
                }`}
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                    marcado ? 'border-ayamo-primary bg-ayamo-primary text-white' : 'border-ayamo-border'
                  }`}
                >
                  {marcado && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ayamo-text">{contato.nome}</span>
                  <span className="block truncate text-[11px] text-ayamo-text-mut">
                    {[contato.empresaNome, contato.cargo].filter(Boolean).join(' · ')}
                    {contato.empresaNome || contato.cargo ? ' — ' : ''}
                    {contato.telefone}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {filtrados.length === 0 && (
          <li className="px-3 py-4 text-center text-xs text-ayamo-text-mut">Nenhum contato encontrado</li>
        )}
      </ul>
    </div>
  )
}
