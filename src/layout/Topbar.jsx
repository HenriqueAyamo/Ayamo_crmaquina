const USUARIO_LOGADO = { nome: 'Marina Duarte', perfil: 'Vendedor' }

export default function Topbar() {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-end border-b border-ayamo-border bg-ayamo-surface px-6">
      <div className="text-right leading-tight">
        <div className="text-sm font-medium text-ayamo-text">{USUARIO_LOGADO.nome}</div>
        <div className="text-xs text-ayamo-text-mut">{USUARIO_LOGADO.perfil}</div>
      </div>
    </header>
  )
}
