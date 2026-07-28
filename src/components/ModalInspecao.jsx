import { useState } from 'react'
import { useData } from '../DataContext.jsx'
import Modal from './Modal.jsx'
import Field, { inputClass } from './Field.jsx'
import { redimensionarImagem } from '../utils/redimensionarImagem.js'

export default function ModalInspecao({ open, onClose, contexto, refCodigo }) {
  const { inspecoes, usuarioLogado } = useData()
  const [observacao, setObservacao] = useState('')
  const [imagem, setImagem] = useState(null)
  const [processandoImagem, setProcessandoImagem] = useState(false)

  function fecharEResetar() {
    setObservacao('')
    setImagem(null)
    onClose()
  }

  async function selecionarImagem(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setProcessandoImagem(true)
    try {
      const dataUrl = await redimensionarImagem(arquivo)
      setImagem(dataUrl)
    } finally {
      setProcessandoImagem(false)
    }
  }

  function salvar(e) {
    e.preventDefault()
    inspecoes.criar({
      contexto,
      refCodigo,
      autor: usuarioLogado.nome,
      data: new Date().toISOString().slice(0, 10),
      observacao,
      imagem,
    })
    fecharEResetar()
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title="Registrar inspeção do produto"
      footer={
        <>
          <button
            type="button"
            onClick={fecharEResetar}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="inspecao-form"
            disabled={processandoImagem}
            className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Registrar
          </button>
        </>
      }
    >
      <form id="inspecao-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Observação" required hint="Ex.: cor, embalagem, temperatura, avarias — o que foi conferido na inspeção.">
          <textarea className={inputClass} rows={3} required value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>

        <Field label="Foto (opcional)">
          <input type="file" accept="image/*" onChange={selecionarImagem} className="text-sm text-ayamo-text-mut" />
        </Field>

        {processandoImagem && <p className="text-xs text-ayamo-text-mut">Processando imagem...</p>}
        {imagem && !processandoImagem && (
          <img src={imagem} alt="Prévia da inspeção" className="max-h-48 rounded border border-ayamo-border object-contain" />
        )}
      </form>
    </Modal>
  )
}
