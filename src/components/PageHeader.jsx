export default function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-ayamo-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ayamo-text-mut">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-2 rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {ActionIcon && <ActionIcon size={16} />}
          {actionLabel}
        </button>
      )}
    </div>
  )
}
