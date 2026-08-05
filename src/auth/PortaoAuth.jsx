import { AUTH_HABILITADA } from './config.js'
import { useAuth } from './AuthContext.jsx'
import TelaLogin from './TelaLogin.jsx'
import TelaTrocarSenha from './TelaTrocarSenha.jsx'

// Nada do sistema é montado antes de a sessão ser confirmada pelo servidor.
// Com AUTH_HABILITADA = false o portão fica aberto e o app abre direto.
export default function PortaoAuth({ children }) {
  const { usuario, carregando } = useAuth()

  if (!AUTH_HABILITADA) return children

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ayamo-bg">
        <p className="text-sm text-ayamo-text-mut">Verificando sessão...</p>
      </div>
    )
  }

  if (!usuario) return <TelaLogin />
  if (usuario.precisaTrocarSenha) return <TelaTrocarSenha />

  return children
}
