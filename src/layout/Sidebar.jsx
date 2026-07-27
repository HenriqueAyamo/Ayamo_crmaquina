import { NavLink } from 'react-router-dom'
import {
  Home,
  ShoppingCart,
  TrendingUp,
  Building2,
  Users,
  Settings,
  UserCog,
  FileText,
  ClipboardList,
} from 'lucide-react'
import LogoMark from '../components/LogoMark.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/vendas', label: 'Vendas', icon: TrendingUp },
  { to: '/demandas', label: 'Demandas', icon: ClipboardList },
  { to: '/empresas', label: 'Empresas', icon: Building2 },
  { to: '/contatos', label: 'Contatos', icon: Users },
  { to: '/cadastros', label: 'Cadastros', icon: Settings },
  { to: '/usuarios', label: 'Usuários', icon: UserCog },
  { to: '/documentos', label: 'Documentos', icon: FileText },
]

export default function Sidebar() {
  return (
    <nav
      className="flex h-full w-[220px] flex-shrink-0 flex-col py-4"
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
      <ul className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
    </nav>
  )
}
