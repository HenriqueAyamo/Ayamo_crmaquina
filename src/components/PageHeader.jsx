export default function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon }) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ayamo-text">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ayamo-text-mut">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-2 rounded-md bg-ayamo-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-card-hover hover:opacity-95 active:translate-y-0"
        >
          {ActionIcon && <ActionIcon size={16} />}
          {actionLabel}
        </button>
      )}
    </div>
  )
}
