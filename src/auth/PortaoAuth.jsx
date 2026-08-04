import { useAuth } from './AuthContext.jsx'
import TelaLogin from './TelaLogin.jsx'
import TelaTrocarSenha from './TelaTrocarSenha.jsx'

// Nada do sistema é montado antes de a sessão ser confirmada pelo servidor.
export default function PortaoAuth({ children }) {
  const { usuario, carregando } = useAuth()

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
