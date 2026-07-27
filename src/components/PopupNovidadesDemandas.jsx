import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useData } from '../DataContext.jsx'

const CHAVE = 'ayamo_crm_v1_ultimaVisitaDemandas'

export default function PopupNovidadesDemandas() {
  const { demandas, getProduto, getEmpresa } = useData()
  const navigate = useNavigate()
  const [novidades, setNovidades] = useState([])

  useEffect(() => {
    const ultimaVisita = localStorage.getItem(CHAVE)
    if (!ultimaVisita) {
      localStorage.setItem(CHAVE, new Date().toISOString().slice(0, 10))
      return
    }
    const novas = demandas.items.filter((d) => d.status === 'Aberta' && d.data > ultimaVisita)
    if (novas.length > 0) setNovidades(novas)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só verifica uma vez, na entrada da tela
  }, [])

  function fechar() {
    localStorage.setItem(CHAVE, new Date().toISOString().slice(0, 10))
    setNovidades([])
  }

  if (novidades.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-ayamo-surface p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-ayamo-accent" />
          <h2 className="text-base font-semibold text-ayamo-text">Novidades desde sua última visita</h2>
        </div>
        <ul className="mb-4 flex flex-col gap-2">
          {novidades.slice(0, 5).map((d) => (
            <li key={d.id} className="rounded border border-ayamo-border p-2.5 text-sm">
              <span className="font-medium text-ayamo-text">{getEmpresa(d.clienteId)?.nome ?? '—'}</span>
              <span className="text-ayamo-text-mut"> procura {getProduto(d.produtoId)?.nome ?? '—'}</span>
            </li>
          ))}
        </ul>
        {novidades.length > 5 && (
          <p className="mb-3 text-xs text-ayamo-text-mut">e mais {novidades.length - 5} demanda(s).</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={fechar}
            className="rounded border border-ayamo-border px-3 py-1.5 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              fechar()
              navigate('/demandas')
            }}
            className="rounded bg-ayamo-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Ver demandas
          </button>
        </div>
      </div>
    </div>
  )
}
