import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import { MOEDAS } from '../../data/unidades.js'

export default function ModalRevisao({ open, onClose, atual }) {
  const { ofertas, usuarioLogado } = useData()

  const [valor, setValor] = useState('')
  const [moeda, setMoeda] = useState(atual.precoCusto.moeda)
  const [quantidade, setQuantidade] = useState(atual.quantidade)
  const [status, setStatus] = useState('Disponível')
  const [observacao, setObservacao] = useState('')

  function fecharEResetar() {
    setValor('')
    setMoeda(atual.precoCusto.moeda)
    setQuantidade(atual.quantidade)
    setStatus('Disponível')
    setObservacao('')
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    ofertas.criar({
      codigo: `${atual.codigoBase}-R${atual.versao + 1}`,
      codigoBase: atual.codigoBase,
      versao: atual.versao + 1,
      produtoId: atual.produtoId,
      fornecedorId: atual.fornecedorId,
      precoCusto: { valor: Number(valor), moeda, unidade: atual.unidade },
      quantidade: Number(quantidade),
      unidade: atual.unidade,
      status,
      data: new Date().toISOString().slice(0, 10),
      usuarioId: usuarioLogado.id,
      observacao,
    })
    fecharEResetar()
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title="Registrar revisão de preço"
      footer={
        <>
          <button
            type="button"
            onClick={fecharEResetar}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="revisao-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Registrar
          </button>
        </>
      }
    >
      <form id="revisao-form" onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Novo preço" required>
            <input type="number" min="0" step="0.01" className={inputClass} required value={valor} onChange={(e) => setValor(e.target.value)} />
          </Field>
          <Field label="Moeda" required>
            <select className={inputClass} value={moeda} onChange={(e) => setMoeda(e.target.value)}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade" required>
            <input
              type="number"
              min="0"
              className={inputClass}
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Status da revisão" required>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Disponível">Disponível</option>
            <option value="Em revisão">Em revisão</option>
            <option value="Esgotada">Esgotada</option>
            <option value="Expirada">Expirada</option>
          </select>
        </Field>
        <Field label="Observação">
          <textarea className={inputClass} rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
