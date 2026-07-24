export default function Field({ label, required, hint, error, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ayamo-text">
        {label}
        {required && <span className="text-ayamo-danger"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ayamo-text-mut">{hint}</span>}
      {error && <span className="text-xs text-ayamo-danger">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded border border-ayamo-border bg-ayamo-surface px-3 py-2 text-sm text-ayamo-text outline-none focus:border-ayamo-primary'
