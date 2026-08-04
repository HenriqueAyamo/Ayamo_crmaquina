import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import LogoMark from '../components/LogoMark.jsx'
import Botao from '../components/Botao.jsx'
import Field, { inputClass } from '../components/Field.jsx'

export default function TelaLogin() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (problema) {
      setErro(problema.message)
      setSenha('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ayamo-bg p-4">
      <div className="w-full max-w-sm">
        <div
          className="mb-6 flex items-center justify-center gap-3 rounded-lg px-5 py-6"
          style={{ background: 'linear-gradient(165deg, var(--ayamo-primary) 0%, var(--ayamo-primary-dark) 100%)' }}
        >
          <LogoMark size={34} />
          <div className="text-base font-semibold leading-tight tracking-wide text-white">
            AYAMO
            <br />
            <span className="text-sm text-white/70">SALES INTELLIGENCE</span>
          </div>
        </div>

        <form
          onSubmit={submeter}
          className="flex flex-col gap-4 rounded-lg border border-ayamo-border bg-ayamo-surface p-6"
        >
          <h1 className="text-lg font-semibold text-ayamo-text">Entrar</h1>

          <Field label="E-mail" required>
            <input
              className={inputClass}
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Senha" required>
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Field>

          {erro && (
            <p role="alert" className="rounded-md border border-ayamo-danger/40 bg-ayamo-danger/10 px-3 py-2 text-sm text-ayamo-danger">
              {erro}
            </p>
          )}

          <Botao variante="primario" tamanho="lg" icone={LogIn} type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Entrando...' : 'Entrar'}
          </Botao>

          <p className="text-center text-xs text-ayamo-text-mut">
            Após 5 tentativas incorretas a conta fica bloqueada por 15 minutos.
          </p>
        </form>
      </div>
    </div>
  )
}
