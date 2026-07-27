import { useState } from 'react'
import { Phone, Mail } from 'lucide-react'
import { useData } from '../DataContext.jsx'

export default function PopoverContato({ empresaId, children }) {
  const { contatos } = useData()
  const [aberto, setAberto] = useState(false)

  const contatosEmpresa = contatos.items.filter((c) => c.empresaId === empresaId)

  if (contatosEmpresa.length === 0) {
    return <>{children}</>
  }

  return (
    <span className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="cursor-pointer border-b border-dotted border-ayamo-text-mut text-left hover:border-ayamo-primary hover:text-ayamo-primary"
      >
        {children}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded border border-ayamo-border bg-ayamo-surface p-3 text-xs shadow-md">
            {contatosEmpresa.map((c) => (
              <div key={c.id} className="mb-2 last:mb-0">
                <p className="font-semibold text-ayamo-text">{c.nome}</p>
                <p className="mb-1 text-ayamo-text-mut">{c.cargo}</p>
                <a href={`tel:${c.telefone}`} className="flex items-center gap-1.5 text-ayamo-primary hover:underline">
                  <Phone size={12} /> {c.telefone}
                </a>
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-ayamo-primary hover:underline">
                  <Mail size={12} /> {c.email}
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </span>
  )
}
