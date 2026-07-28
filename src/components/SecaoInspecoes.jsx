import { useState } from 'react'
import { Camera } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import SecaoRecolhivel from './SecaoRecolhivel.jsx'
import ModalInspecao from './ModalInspecao.jsx'
import { formatarData } from '../utils/formato.js'

export default function SecaoInspecoes({ contexto, refCodigo }) {
  const { inspecoes } = useData()
  const [modalAberto, setModalAberto] = useState(false)
  const [imagemAmpliada, setImagemAmpliada] = useState(null)

  const inspecoesDoRegistro = inspecoes.items
    .filter((i) => i.contexto === contexto && i.refCodigo === refCodigo)
    .sort((a, b) => (a.data < b.data ? 1 : -1))

  return (
    <SecaoRecolhivel titulo={`Inspeções do produto (${inspecoesDoRegistro.length})`} aberturaInicial={false}>
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text hover:bg-ayamo-bg"
        >
          <Camera size={14} />
          Registrar inspeção
        </button>
      </div>

      {inspecoesDoRegistro.length === 0 ? (
        <p className="text-sm text-ayamo-text-mut">Nenhuma inspeção registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {inspecoesDoRegistro.map((i) => (
            <div key={i.id} className="flex gap-3 rounded border border-ayamo-border p-3">
              {i.imagem && (
                <button type="button" onClick={() => setImagemAmpliada(i.imagem)} className="flex-shrink-0">
                  <img src={i.imagem} alt="Inspeção" className="h-16 w-16 rounded object-cover" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ayamo-text">{i.autor}</span>
                  <span className="text-xs text-ayamo-text-mut">{formatarData(i.data)}</span>
                </div>
                <p className="text-sm text-ayamo-text-mut">{i.observacao}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {imagemAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setImagemAmpliada(null)}
        >
          <img src={imagemAmpliada} alt="Inspeção ampliada" className="max-h-[85vh] max-w-full rounded" />
        </div>
      )}

      <ModalInspecao open={modalAberto} onClose={() => setModalAberto(false)} contexto={contexto} refCodigo={refCodigo} />
    </SecaoRecolhivel>
  )
}
