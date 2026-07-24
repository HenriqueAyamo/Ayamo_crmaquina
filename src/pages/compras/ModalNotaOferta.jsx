import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'

export default function ModalNotaOferta({ open, onClose, atual }) {
  const { registrarNotaOferta } = useData()
  const [observacao, setObservacao] = useState('')

  function fecharEResetar() {
    setObservacao('')
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    registrarNotaOferta(atual, {
      tipo: 'Contato com fornecedor',
      novoStatus: 'Em revisão',
      observacao,
    })
    fecharEResetar()
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title="Registrar contato com fornecedor"
      footer={
        <>
          <button
            type="button"
            onClick={fecharEResetar}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="nota-oferta-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Registrar
          </button>
        </>
      }
    >
      <form id="nota-oferta-form" onSubmit={salvar} className="flex flex-col gap-4">
        <p className="text-sm text-ayamo-text-mut">
          Marca a oferta como &ldquo;Em revisão&rdquo; e registra que você vai renegociar com o fornecedor — antes de saber o novo preço.
        </p>
        <Field label="Observação" required>
          <textarea
            className={inputClass}
            rows={3}
            required
            placeholder="Ex.: Vou ligar para o fornecedor pedindo desconto por causa da contraproposta do cliente."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
