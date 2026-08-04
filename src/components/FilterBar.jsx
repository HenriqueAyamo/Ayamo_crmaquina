export default function FilterBar({ children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3.5 rounded-lg border border-ayamo-border bg-ayamo-surface p-4">
      {children}
    </div>
  )
}
