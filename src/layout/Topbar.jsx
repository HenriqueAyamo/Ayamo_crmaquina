import { useData } from '../DataContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function Topbar() {
  const { usuarios, usuarioLogado, setUsuarioLogadoId } = useData()
  const opcoes = usuarios.items.filter((u) => u.situacao === 'Ativo' || u.id === usuarioLogado.id)

  const iniciais = usuarioLogado.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-end gap-4 border-b border-ayamo-border bg-ayamo-surface/90 px-6 backdrop-blur">
      <ThemeToggle />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ayamo-primary/10 text-xs font-semibold text-ayamo-primary">
          {iniciais}
        </div>
        <div className="text-right leading-tight">
          <div className="text-sm font-medium text-ayamo-text">{usuarioLogado.nome}</div>
          <div className="text-xs text-ayamo-text-mut">{usuarioLogado.perfil}</div>
        </div>
      </div>
      <select
        className="rounded border border-ayamo-border bg-ayamo-surface px-2.5 py-1.5 text-xs text-ayamo-text-mut outline-none transition-colors hover:border-ayamo-primary/40 focus:border-ayamo-primary"
        value={usuarioLogado.id}
        onChange={(e) => setUsuarioLogadoId(Number(e.target.value))}
        title="Entrar como (simulação de perfil)"
      >
        {opcoes.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome} — {u.perfil}
          </option>
        ))}
      </select>
    </header>
  )
}
