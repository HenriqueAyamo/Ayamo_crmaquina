import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import SelectBusca from '../../components/SelectBusca.jsx'
import { MOEDAS, INCOTERMS } from '../../data/unidades.js'

function valoresIniciais() {
  return {
    clienteId: '',
    produtoId: '',
    proteinaPercentual: '',
    quantidade: '',
    precoAlvo: '',
    moedaAlvo: 'USD',
    incoterm: 'CFR',
    origem: '',
    destino: '',
    embalagem: '',
    mesEmbarque: '',
    observacao: '',
  }
}

export default function ModalNovaDemanda({ open, onClose, clientes, produtosAtivos, editando }) {
  const { demandas, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())
  const [erros, setErros] = useState({})

  useEffect(() => {
    if (!open) return
    setErros({})
    if (editando) {
      setForm({
        clienteId: String(editando.clienteId),
        produtoId: String(editando.produtoId),
        proteinaPercentual: editando.proteinaPercentual ?? '',
        quantidade: editando.quantidade,
        precoAlvo: editando.precoAlvo?.valor ?? '',
        moedaAlvo: editando.precoAlvo?.moeda ?? 'USD',
        incoterm: editando.incoterm,
        origem: editando.origem,
        destino: editando.destino,
        embalagem: editando.embalagem,
        mesEmbarque: editando.mesEmbarque,
        observacao: editando.observacao,
      })
    } else {
      setForm(valoresIniciais())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  function salvar(e) {
    e.preventDefault()
    if (!form.clienteId || !form.produtoId) {
      setErros({ clienteId: !form.clienteId, produtoId: !form.produtoId })
      return
    }
    const dados = {
      clienteId: Number(form.clienteId),
      produtoId: Number(form.produtoId),
      proteinaPercentual: form.proteinaPercentual === '' ? null : Number(form.proteinaPercentual),
      quantidade: Number(form.quantidade),
      precoAlvo: form.precoAlvo === '' ? null : { valor: Number(form.precoAlvo), moeda: form.moedaAlvo },
      incoterm: form.incoterm,
      origem: form.origem,
      destino: form.destino,
      embalagem: form.embalagem,
      mesEmbarque: form.mesEmbarque,
      observacao: form.observacao,
    }
    if (editando) demandas.editar(editando.id, dados)
    else demandas.criar({ ...dados, status: 'Aberta', vendedorId: usuarioLogado.id, data: new Date().toISOString().slice(0, 10) })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar demanda' : 'Nova demanda'}
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="demanda-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Salvar
          </button>
        </>
      }
    >
      <form id="demanda-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Cliente" required error={erros.clienteId ? 'Selecione o cliente.' : undefined}>
          <SelectBusca
            value={form.clienteId}
            onChange={(clienteId) => setForm({ ...form, clienteId })}
            opcoes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
            erro={erros.clienteId}
          />
        </Field>

        <Field label="Produto" required error={erros.produtoId ? 'Selecione o produto.' : undefined}>
          <SelectBusca
            value={form.produtoId}
            onChange={(produtoId) => setForm({ ...form, produtoId })}
            opcoes={produtosAtivos.map((p) => ({ value: p.id, label: p.nome }))}
            erro={erros.produtoId}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Proteína % (opcional)">
            <CampoNumerico value={form.proteinaPercentual} onChange={(v) => setForm({ ...form, proteinaPercentual: v })} />
          </Field>
          <Field label="Volume (MT)" required>
            <CampoNumerico required value={form.quantidade} onChange={(quantidade) => setForm({ ...form, quantidade })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço alvo / MT (opcional)">
            <CampoNumerico value={form.precoAlvo} onChange={(v) => setForm({ ...form, precoAlvo: v })} />
          </Field>
          <Field label="Moeda">
            <select className={inputClass} value={form.moedaAlvo} onChange={(e) => setForm({ ...form, moedaAlvo: e.target.value })}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Incoterm">
            <select className={inputClass} value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })}>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Origem">
            <input className={inputClass} value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </Field>
          <Field label="Destino">
            <input className={inputClass} value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Embalagem">
            <input className={inputClass} value={form.embalagem} onChange={(e) => setForm({ ...form, embalagem: e.target.value })} />
          </Field>
          <Field label="Mês de embarque" hint="Ex.: Agosto 2026">
            <input className={inputClass} value={form.mesEmbarque} onChange={(e) => setForm({ ...form, mesEmbarque: e.target.value })} />
          </Field>
        </div>

        <Field label="Comentários">
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
