import { useData } from '../DataContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function Topbar() {
  const { usuarios, usuarioLogado, setUsuarioLogadoId } = useData()
  const opcoes = usuarios.items.filter((u) => u.situacao === 'Ativo' || u.id === usuarioLogado.id)

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-end gap-3 border-b border-ayamo-border bg-ayamo-surface px-6">
      <ThemeToggle />
      <div className="text-right leading-tight">
        <div className="text-sm font-medium text-ayamo-text">{usuarioLogado.nome}</div>
        <div className="text-xs text-ayamo-text-mut">{usuarioLogado.perfil}</div>
      </div>
      <select
        className="rounded border border-ayamo-border bg-ayamo-surface px-2 py-1.5 text-xs text-ayamo-text-mut outline-none focus:border-ayamo-primary"
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
