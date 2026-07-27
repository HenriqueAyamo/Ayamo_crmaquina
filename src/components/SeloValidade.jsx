import { diasRestantes } from '../utils/formato.js'

export default function SeloValidade({ validadeAte }) {
  const dias = diasRestantes(validadeAte)
  if (dias === null) return <span className="text-xs text-ayamo-text-mut">—</span>
  if (dias < 0) {
    return <span className="rounded bg-ayamo-danger/10 px-2 py-0.5 text-xs font-medium text-ayamo-danger">Expirada</span>
  }
  const classe =
    dias <= 3
      ? 'bg-ayamo-danger/10 text-ayamo-danger'
      : dias <= 14
        ? 'bg-ayamo-warning/10 text-ayamo-warning'
        : 'bg-ayamo-bg text-ayamo-text-mut'
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${classe}`}>Expira em {dias}d</span>
}
