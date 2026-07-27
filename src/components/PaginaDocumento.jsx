import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Printer } from 'lucide-react'

export default function PaginaDocumento({ voltarPara, corpoEmail, children }) {
  const navigate = useNavigate()
  const [copiado, setCopiado] = useState(false)

  function copiarEmail() {
    navigator.clipboard.writeText(corpoEmail).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div className="mx-auto max-w-3xl bg-ayamo-bg p-6 print:bg-white print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => navigate(voltarPara)}
          className="flex items-center gap-1 text-sm text-ayamo-text-mut hover:text-ayamo-text"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Printer size={16} />
          Imprimir / salvar como PDF
        </button>
      </div>

      <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5 print:hidden">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ayamo-text-mut">Corpo do e-mail</h2>
          <button type="button" onClick={copiarEmail} className="flex items-center gap-1 text-sm text-ayamo-primary hover:underline">
            <Copy size={14} />
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-ayamo-text">{corpoEmail}</pre>
      </div>

      <div className="rounded border border-ayamo-border bg-white p-8 text-sm text-gray-900 print:border-none print:p-0">
        {children}
      </div>
    </div>
  )
}
