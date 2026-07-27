import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { MOEDAS, INCOTERMS } from '../../data/unidades.js'

function valoresPO(atual) {
  return {
    numeroContrato: atual.numeroContrato ?? '',
    incoterm: atual.incoterm ?? 'CFR',
    portoOrigem: atual.portoOrigem ?? '',
    prazoPagamento: atual.prazoPagamento ?? '',
    embarqueDe: atual.embarqueDe ?? '',
    embarqueAte: atual.embarqueAte ?? '',
    mfgSite: atual.mfgSite ?? '',
    validadeAte: atual.validadeAte ?? '',
  }
}

export default function ModalRevisao({ open, onClose, atual }) {
  const { registrarRevisaoOferta } = useData()

  const [valor, setValor] = useState('')
  const [moeda, setMoeda] = useState(atual.precoCusto.moeda)
  const [quantidade, setQuantidade] = useState(atual.quantidade)
  const [status, setStatus] = useState('Disponível')
  const [observacao, setObservacao] = useState('')
  const [dadosPO, setDadosPO] = useState(valoresPO(atual))

  function fecharEResetar() {
    setValor('')
    setMoeda(atual.precoCusto.moeda)
    setQuantidade(atual.quantidade)
    setStatus('Disponível')
    setObservacao('')
    setDadosPO(valoresPO(atual))
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    registrarRevisaoOferta(atual, { valor: Number(valor), moeda, quantidade: Number(quantidade), status, observacao, ...dadosPO })
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
            <CampoNumerico required value={valor} onChange={setValor} />
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
            <CampoNumerico required value={quantidade} onChange={setQuantidade} />
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

        <p className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">Dados para o PO (opcional)</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Número do contrato">
            <input
              className={inputClass}
              value={dadosPO.numeroContrato}
              onChange={(e) => setDadosPO({ ...dadosPO, numeroContrato: e.target.value })}
            />
          </Field>
          <Field label="Incoterm">
            <select className={inputClass} value={dadosPO.incoterm} onChange={(e) => setDadosPO({ ...dadosPO, incoterm: e.target.value })}>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Porto de origem">
          <input className={inputClass} value={dadosPO.portoOrigem} onChange={(e) => setDadosPO({ ...dadosPO, portoOrigem: e.target.value })} />
        </Field>

        <Field label="Prazo de pagamento">
          <input
            className={inputClass}
            value={dadosPO.prazoPagamento}
            onChange={(e) => setDadosPO({ ...dadosPO, prazoPagamento: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Embarque de">
            <input
              className={inputClass}
              placeholder="dd/mm/aaaa"
              value={dadosPO.embarqueDe}
              onChange={(e) => setDadosPO({ ...dadosPO, embarqueDe: e.target.value })}
            />
          </Field>
          <Field label="Embarque até">
            <input
              className={inputClass}
              placeholder="dd/mm/aaaa"
              value={dadosPO.embarqueAte}
              onChange={(e) => setDadosPO({ ...dadosPO, embarqueAte: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Site / planta de fabricação">
            <input className={inputClass} value={dadosPO.mfgSite} onChange={(e) => setDadosPO({ ...dadosPO, mfgSite: e.target.value })} />
          </Field>
          <Field label="Oferta válida até" hint="dd/mm/aaaa">
            <input
              className={inputClass}
              placeholder="dd/mm/aaaa"
              value={dadosPO.validadeAte}
              onChange={(e) => setDadosPO({ ...dadosPO, validadeAte: e.target.value })}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
