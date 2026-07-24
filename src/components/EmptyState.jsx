export default function EmptyState({ title = 'Nada encontrado', description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded border border-dashed border-ayamo-border py-14 text-center">
      <p className="text-sm font-medium text-ayamo-text">{title}</p>
      {description && <p className="text-sm text-ayamo-text-mut">{description}</p>}
    </div>
  )
}
