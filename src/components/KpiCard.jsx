const TONE_CLASSES = {
  primary: 'bg-ayamo-primary/10 text-ayamo-primary',
  success: 'bg-ayamo-success/10 text-ayamo-success',
  warning: 'bg-ayamo-warning/10 text-ayamo-warning',
  danger: 'bg-ayamo-danger/10 text-ayamo-danger',
  teal: 'bg-ayamo-teal/10 text-ayamo-teal',
}

export default function KpiCard({ label, value, icon: Icon, tone = 'primary' }) {
  return (
    <div className="rounded border border-ayamo-border bg-ayamo-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone] ?? TONE_CLASSES.primary}`}>
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">{label}</div>
          <div className="text-xl font-semibold tracking-tight text-ayamo-text">{value}</div>
        </div>
      </div>
    </div>
  )
}
