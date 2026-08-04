import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import Botao from '../components/Botao.jsx'
import Field, { inputClass } from '../components/Field.jsx'

// Mostrada quando o usuário entra com uma senha provisória (precisaTrocarSenha).
// A troca derruba as outras sessões daquele usuário no servidor.
export default function TelaTrocarSenha() {
  const { trocarSenha, sair } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não confere com a nova senha.')
      return
    }
    setEnviando(true)
    try {
      await trocarSenha(senhaAtual, novaSenha)
    } catch (problema) {
      setErro(problema.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ayamo-bg p-4">
      <form
        onSubmit={submeter}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-ayamo-border bg-ayamo-surface p-6"
      >
        <h1 className="text-lg font-semibold text-ayamo-text">Defina uma nova senha</h1>
        <p className="text-sm text-ayamo-text-mut">
          Sua senha é provisória. Escolha uma nova com pelo menos 12 caracteres, incluindo maiúscula, minúscula e número.
        </p>

        <Field label="Senha atual" required>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            required
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
        </Field>

        <Field label="Nova senha" required>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
        </Field>

        <Field label="Confirmar nova senha" required>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </Field>

        {erro && (
          <p role="alert" className="rounded-md border border-ayamo-danger/40 bg-ayamo-danger/10 px-3 py-2 text-sm text-ayamo-danger">
            {erro}
          </p>
        )}

        <Botao variante="primario" tamanho="lg" icone={KeyRound} type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Salvando...' : 'Salvar nova senha'}
        </Botao>

        <button type="button" onClick={sair} className="text-center text-xs text-ayamo-text-mut hover:text-ayamo-text hover:underline">
          Sair
        </button>
      </form>
    </div>
  )
}
