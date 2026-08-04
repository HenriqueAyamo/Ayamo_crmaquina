import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  Building2,
  Users,
  Settings,
  UserCog,
  FileText,
  AlertTriangle,
  Globe,
  Ship,
  UserCircle,
  BookOpen,
  Sparkles,
  AlertCircle,
  CalendarClock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import LogoMark from '../components/LogoMark.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

const CHAVE_RECOLHIDA = 'ayamo_crm_v1_sidebarRecolhida'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/', chave: 'nav.inicio', icon: Home, end: true },
      { to: '/pendencias', chave: 'nav.pendencias', icon: AlertCircle },
      { to: '/follow-ups', chave: 'nav.followUps', icon: CalendarClock },
    ],
  },
  {
    label: 'nav.trading',
    items: [
      { to: '/compras', chave: 'nav.compras', icon: ShoppingCart },
      { to: '/vendas', chave: 'nav.vendas', icon: TrendingUp },
      { to: '/demandas', chave: 'nav.demandas', icon: ClipboardList },
      { to: '/freight', chave: 'nav.freight', icon: Ship },
    ],
  },
  {
    label: 'nav.fornecedoresProdutos',
    items: [
      { to: '/empresas', chave: 'nav.empresas', icon: Building2 },
      { to: '/qualificacoes', chave: 'nav.qualificacoes', icon: Globe },
      { to: '/contatos', chave: 'nav.contatos', icon: Users },
    ],
  },
  {
    label: 'nav.claims',
    items: [{ to: '/claims', chave: 'nav.claims', icon: AlertTriangle }],
  },
  {
    label: 'nav.sistema',
    items: [
      { to: '/cadastros', chave: 'nav.cadastros', icon: Settings },
      { to: '/usuarios', chave: 'nav.usuarios', icon: UserCog },
      { to: '/documentos', chave: 'nav.documentos', icon: FileText },
      { to: '/configuracoes', chave: 'nav.minhaConta', icon: UserCircle },
      { to: '/training', chave: 'nav.training', icon: BookOpen },
      { to: '/uso-ia', chave: 'nav.usoIA', icon: Sparkles },
    ],
  },
]

export default function Sidebar() {
  const { t } = useI18n()
  const [recolhida, setRecolhida] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_RECOLHIDA) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_RECOLHIDA, recolhida ? '1' : '0')
    } catch {
      // sem persistência — a preferência vale só para esta sessão
    }
  }, [recolhida])

  return (
    <nav
      className={`flex h-full flex-shrink-0 flex-col overflow-y-auto py-4 transition-[width] duration-200 ${
        recolhida ? 'w-[68px]' : 'w-[220px]'
      }`}
      style={{ background: 'linear-gradient(165deg, var(--ayamo-primary) 0%, var(--ayamo-primary-dark) 100%)' }}
    >
      <div className={`flex items-center gap-2.5 pb-5 ${recolhida ? 'justify-center px-2' : 'px-5'}`}>
        <LogoMark size={30} />
        {!recolhida && (
          <div className="text-sm font-semibold leading-tight tracking-wide text-white">
            AYAMO
            <br />
            <span className="text-white/70">SALES INTELLIGENCE</span>
          </div>
        )}
      </div>

      <div className={`mb-4 h-px bg-white/10 ${recolhida ? 'mx-2' : 'mx-5'}`} />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((grupo, indice) => (
          <div key={grupo.label ?? `grupo-${indice}`}>
            {grupo.label && !recolhida && (
              <div className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-white/40">
                {t(grupo.label)}
              </div>
            )}
            {grupo.label && recolhida && indice > 0 && <div className="mx-2 mb-2 h-px bg-white/10" />}
            <ul className="flex flex-col gap-0.5">
              {grupo.items.map(({ to, chave, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    title={recolhida ? t(chave) : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md py-2 text-[13px] transition-all ${
                        recolhida ? 'justify-center px-2' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-white/15 font-medium text-white shadow-sm'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {!recolhida && t(chave)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRecolhida((atual) => !atual)}
        title={recolhida ? t('nav.expandir') : t('nav.recolher')}
        aria-label={recolhida ? t('nav.expandir') : t('nav.recolher')}
        className={`mx-3 flex items-center gap-2.5 rounded-md py-2 text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-white ${
          recolhida ? 'justify-center px-2' : 'px-3'
        }`}
      >
        {recolhida ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        {!recolhida && t('nav.recolher')}
      </button>
    </nav>
  )
}
