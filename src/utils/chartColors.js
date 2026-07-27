export const CHART_COLORS = [
  'var(--ayamo-chart-1)',
  'var(--ayamo-chart-2)',
  'var(--ayamo-chart-3)',
  'var(--ayamo-chart-4)',
  'var(--ayamo-chart-5)',
  'var(--ayamo-chart-6)',
  'var(--ayamo-chart-7)',
  'var(--ayamo-chart-8)',
]

export function chartColor(indice) {
  return CHART_COLORS[indice % CHART_COLORS.length]
}
