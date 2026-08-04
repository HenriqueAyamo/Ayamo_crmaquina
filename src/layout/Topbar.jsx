import { LogOut } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { IDIOMAS, useI18n } from '../i18n/I18nContext.jsx'

export default function Topbar() {
  const { usuarioLogado } = useData()
  const { sair } = useAuth()
  const { idioma, setIdioma, t } = useI18n()

  const iniciais = usuarioLogado.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-end gap-4 border-b border-ayamo-border bg-ayamo-surface/90 px-6 backdrop-blur">
      <div
        className="flex items-center rounded-md border border-ayamo-border p-0.5"
        role="group"
        aria-label={t('topbar.idioma')}
      >
        {IDIOMAS.map((op) => (
          <button
            key={op.codigo}
            type="button"
            onClick={() => setIdioma(op.codigo)}
            title={op.nome}
            aria-pressed={idioma === op.codigo}
            className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
              idioma === op.codigo
                ? 'bg-ayamo-primary text-white'
                : 'text-ayamo-text-mut hover:bg-ayamo-bg hover:text-ayamo-text'
            }`}
          >
            {op.curto}
          </button>
        ))}
      </div>

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

      <button
        type="button"
        onClick={sair}
        title={t('topbar.sair')}
        aria-label={t('topbar.sair')}
        className="flex items-center gap-1.5 rounded-md border border-ayamo-border px-2.5 py-1.5 text-xs font-medium text-ayamo-text-mut transition-colors hover:border-ayamo-danger/40 hover:bg-ayamo-danger/10 hover:text-ayamo-danger"
      >
        <LogOut size={14} />
        {t('topbar.sair')}
      </button>
    </header>
  )
}
