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
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import LogoMark from '../components/LogoMark.jsx'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/', label: 'Início', icon: Home, end: true },
      { to: '/pendencias', label: 'Pendências', icon: AlertCircle },
    ],
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
      { to: '/training', label: 'Training', icon: BookOpen },
      { to: '/uso-ia', label: 'Uso de IA', icon: Sparkles },
    ],
  },
]

export default function Sidebar() {
  return (
    <nav
      className="flex h-full w-[220px] flex-shrink-0 flex-col overflow-y-auto py-4"
      style={{ background: 'linear-gradient(165deg, var(--ayamo-primary) 0%, var(--ayamo-primary-dark) 100%)' }}
    >
      <div className="flex items-center gap-2.5 px-5 pb-5">
        <LogoMark size={30} />
        <div className="text-sm font-semibold leading-tight tracking-wide text-white">
          AYAMO
          <br />
          <span className="text-white/70">SALES INTELLIGENCE</span>
        </div>
      </div>
      <div className="mx-5 mb-4 h-px bg-white/10" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((grupo, indice) => (
          <div key={grupo.label ?? `grupo-${indice}`}>
            {grupo.label && (
              <div className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-white/40">{grupo.label}</div>
            )}
            <ul className="flex flex-col gap-0.5">
              {grupo.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-all ${
                        isActive
                          ? 'bg-white/15 font-medium text-white shadow-sm'
                          : 'text-white/70 hover:translate-x-0.5 hover:bg-white/8 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={16} className="flex-shrink-0" />
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
