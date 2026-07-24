export default function FilterBar({ children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-ayamo-border bg-ayamo-surface p-3">
      {children}
    </div>
  )
}
