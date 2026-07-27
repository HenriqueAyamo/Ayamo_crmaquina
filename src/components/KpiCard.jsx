const TONE_CLASSES = {
  primary: 'bg-ayamo-primary/10 text-ayamo-primary',
  success: 'bg-ayamo-success/10 text-ayamo-success',
  warning: 'bg-ayamo-warning/10 text-ayamo-warning',
  danger: 'bg-ayamo-danger/10 text-ayamo-danger',
  teal: 'bg-ayamo-teal/10 text-ayamo-teal',
}

export default function KpiCard({ label, value, icon: Icon, tone = 'primary' }) {
  return (
    <div className="rounded border border-ayamo-border bg-ayamo-surface p-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone] ?? TONE_CLASSES.primary}`}>
            <Icon size={18} />
          </span>
        )}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">{label}</div>
          <div className="text-xl font-semibold text-ayamo-text">{value}</div>
        </div>
      </div>
    </div>
  )
}
