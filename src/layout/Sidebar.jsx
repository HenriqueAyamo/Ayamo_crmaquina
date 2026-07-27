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
  LayoutDashboard,
  AlertTriangle,
  Globe,
  Ship,
  Trophy,
  UserCircle,
} from 'lucide-react'
import LogoMark from '../components/LogoMark.jsx'

const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/', label: 'Início', icon: Home, end: true }],
  },
  {
    label: 'Trading',
    items: [
      { to: '/compras', label: 'Compras', icon: ShoppingCart },
      { to: '/vendas', label: 'Vendas', icon: TrendingUp },
      { to: '/demandas', label: 'Demandas', icon: ClipboardList },
      { to: '/freight', label: 'Freight', icon: Ship },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { to: '/compras/painel', label: 'Painel de Compras', icon: LayoutDashboard },
      { to: '/vendas-ranking', label: 'Sales Ranking', icon: Trophy },
    ],
  },
  {
    label: 'Fornecedores & Produtos',
    items: [
      { to: '/empresas', label: 'Empresas', icon: Building2 },
      { to: '/qualificacoes', label: 'Qualificações por país', icon: Globe },
      { to: '/contatos', label: 'Contatos', icon: Users },
    ],
  },
  {
    label: 'Claims',
    items: [{ to: '/claims', label: 'Claims', icon: AlertTriangle }],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/cadastros', label: 'Cadastros', icon: Settings },
      { to: '/usuarios', label: 'Usuários', icon: UserCog },
      { to: '/documentos', label: 'Documentos', icon: FileText },
      { to: '/configuracoes', label: 'Minha Conta', icon: UserCircle },
    ],
  },
]

export default function Sidebar() {
  return (
    <nav
      className="flex h-full w-[220px] flex-shrink-0 flex-col overflow-y-auto py-4"
      style={{ background: 'linear-gradient(165deg, var(--ayamo-primary) 0%, var(--ayamo-primary-dark) 100%)' }}
    >
      <div className="flex items-center gap-2 px-5 pb-6">
        <LogoMark size={30} />
        <div className="text-sm font-semibold leading-tight tracking-wide text-white">
          AYAMO
          <br />
          SALES INTELLIGENCE
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-2">
        {NAV_GROUPS.map((grupo, indice) => (
          <div key={grupo.label ?? `grupo-${indice}`}>
            {grupo.label && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">{grupo.label}</div>
            )}
            <ul className="flex flex-col gap-1">
              {grupo.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded border-l-2 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-ayamo-accent bg-white/10 font-medium text-white'
                          : 'border-transparent text-white/75 hover:border-ayamo-teal/60 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
