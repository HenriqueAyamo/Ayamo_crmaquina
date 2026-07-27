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
    <nav className="flex h-full w-[220px] flex-shrink-0 flex-col bg-ayamo-primary py-4">
      <div className="px-5 pb-6 text-sm font-semibold tracking-wide text-white">
        AYAMO SALES INTELLIGENCE
      </div>
      <ul className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
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
