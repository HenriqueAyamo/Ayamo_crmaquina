import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import CampoData from '../../components/CampoData.jsx'
import { MOEDAS } from '../../data/unidades.js'
import { TIPOS_CONTAINER } from '../../data/tiposContainer.js'

function valoresIniciais() {
  return {
    origem: '',
    destino: '',
    transportadora: '',
    tipoContainer: TIPOS_CONTAINER[0],
    valor: '',
    moeda: 'USD',
    validadeAte: '',
    observacao: '',
  }
}

export default function ModalNovoFrete({ open, onClose, editando }) {
  const { fretes, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())

  useEffect(() => {
    if (!open) return
    if (editando) {
      setForm({
        origem: editando.origem,
        destino: editando.destino,
        transportadora: editando.transportadora,
        tipoContainer: editando.tipoContainer,
        valor: editando.valor.valor,
        moeda: editando.valor.moeda,
        validadeAte: editando.validadeAte ?? '',
        observacao: editando.observacao ?? '',
      })
    } else {
      setForm(valoresIniciais())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  function salvar(e) {
    e.preventDefault()
    const dados = {
      origem: form.origem,
      destino: form.destino,
      transportadora: form.transportadora,
      tipoContainer: form.tipoContainer,
      valor: { valor: Number(form.valor), moeda: form.moeda },
      validadeAte: form.validadeAte,
      observacao: form.observacao,
    }
    if (editando) fretes.editar(editando.id, dados)
    else fretes.criar({ ...dados, usuarioId: usuarioLogado.id, data: new Date().toISOString().slice(0, 10) })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar frete' : 'Novo frete'}
      footer={<ModalFooterAcoes onCancelar={onClose} formId="frete-form" />}
    >
      <form id="frete-form" onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Origem" required>
            <input className={inputClass} required value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </Field>
          <Field label="Destino" required>
            <input className={inputClass} required value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
          </Field>
        </div>

        <Field label="Transportadora / Armador" required>
          <input
            className={inputClass}
            required
            value={form.transportadora}
            onChange={(e) => setForm({ ...form, transportadora: e.target.value })}
          />
        </Field>

        <Field label="Tipo de contêiner" required>
          <select className={inputClass} value={form.tipoContainer} onChange={(e) => setForm({ ...form, tipoContainer: e.target.value })}>
            {TIPOS_CONTAINER.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor do frete" required>
            <CampoNumerico required value={form.valor} onChange={(valor) => setForm({ ...form, valor })} />
          </Field>
          <Field label="Moeda" required>
            <select className={inputClass} value={form.moeda} onChange={(e) => setForm({ ...form, moeda: e.target.value })}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Válido até">
          <CampoData value={form.validadeAte} onChange={(validadeAte) => setForm({ ...form, validadeAte })} />
        </Field>

        <Field label="Observação">
          <textarea
            className={inputClass}
            rows={2}
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>
      </form>
    </Modal>
  )
}
