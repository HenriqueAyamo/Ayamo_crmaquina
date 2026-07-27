const TONE_CLASSES = {
  success: 'bg-ayamo-success/15 text-ayamo-success border-ayamo-success/25',
  warning: 'bg-ayamo-warning/15 text-ayamo-warning border-ayamo-warning/25',
  danger: 'bg-ayamo-danger/15 text-ayamo-danger border-ayamo-danger/25',
  info: 'bg-ayamo-primary/15 text-ayamo-primary border-ayamo-primary/25',
  accent: 'bg-ayamo-accent/20 text-ayamo-text border-ayamo-accent/40',
  neutral: 'bg-ayamo-text-mut/10 text-ayamo-text-mut border-ayamo-text-mut/20',
}

export default function StatusBadge({ label, tone = 'neutral', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        TONE_CLASSES[tone] ?? TONE_CLASSES.neutral
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </span>
  )
}
