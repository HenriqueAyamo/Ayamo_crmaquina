import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'Nada encontrado', description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed border-ayamo-border bg-ayamo-surface/40 py-16 text-center">
      <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-ayamo-text-mut/10 text-ayamo-text-mut">
        <Inbox size={18} />
      </span>
      <p className="text-sm font-medium text-ayamo-text">{title}</p>
      {description && <p className="max-w-xs text-sm text-ayamo-text-mut">{description}</p>}
    </div>
  )
}
