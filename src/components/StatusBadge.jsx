const TONE_CLASSES = {
  success: 'bg-ayamo-success/10 text-ayamo-success',
  warning: 'bg-ayamo-warning/10 text-ayamo-warning',
  danger: 'bg-ayamo-danger/10 text-ayamo-danger',
  info: 'bg-ayamo-primary/10 text-ayamo-primary',
  accent: 'bg-ayamo-accent/15 text-ayamo-accent',
  neutral: 'bg-ayamo-border text-ayamo-text-mut',
}

export default function StatusBadge({ label, tone = 'neutral' }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        TONE_CLASSES[tone] ?? TONE_CLASSES.neutral
      }`}
    >
      {label}
    </span>
  )
}
