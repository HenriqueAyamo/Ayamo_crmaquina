import { useEffect, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'

export default function ModalRodada({ open, tipo, itemAtual, onClose, onConfirmar }) {
  const exigePreco = tipo === 'Contraproposta do cliente'

  const [preco, setPreco] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    if (open && itemAtual) {
      setPreco(itemAtual.precoVenda.valor)
      setQuantidade(itemAtual.quantidade)
      setObservacao('')
    }
  }, [open, itemAtual])

  function confirmar(e) {
    e.preventDefault()
    onConfirmar({
      preco: exigePreco ? { valor: Number(preco), moeda: itemAtual.precoVenda.moeda, unidade: itemAtual.unidade } : undefined,
      quantidade: exigePreco ? Number(quantidade) : undefined,
      observacao,
    })
  }

  if (!itemAtual) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tipo}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="rodada-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Registrar
          </button>
        </>
      }
    >
      <form id="rodada-form" onSubmit={confirmar} className="flex flex-col gap-4">
        {exigePreco && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Preço (${itemAtual.precoVenda.moeda})`} required>
              <CampoNumerico required value={preco} onChange={setPreco} />
            </Field>
            <Field label="Quantidade" required>
              <CampoNumerico required value={quantidade} onChange={setQuantidade} />
            </Field>
          </div>
        )}
        <Field label="Observação">
          <textarea className={inputClass} rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
