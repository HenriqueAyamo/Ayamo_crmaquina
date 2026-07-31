import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import SelectBusca from '../../components/SelectBusca.jsx'
import { MOEDAS } from '../../data/unidades.js'

function valoresIniciais() {
  return {
    fornecedorId: '',
    produtoId: '',
    descricao: '',
    impacto: '',
    moedaImpacto: 'USD',
    status: 'Não iniciado',
    comentario: '',
  }
}

export default function ModalNovoClaim({ open, onClose, fornecedores, produtosAtivos, editando }) {
  const { claims, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())
  const [erros, setErros] = useState({})

  useEffect(() => {
    if (!open) return
    setErros({})
    if (editando) {
      setForm({
        fornecedorId: String(editando.fornecedorId),
        produtoId: String(editando.produtoId),
        descricao: editando.descricao,
        impacto: editando.impacto?.valor ?? '',
        moedaImpacto: editando.impacto?.moeda ?? 'USD',
        status: editando.status,
        comentario: editando.comentario ?? '',
      })
    } else {
      setForm(valoresIniciais())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  function salvar(e) {
    e.preventDefault()
    if (!form.fornecedorId || !form.produtoId) {
      setErros({ fornecedorId: !form.fornecedorId, produtoId: !form.produtoId })
      return
    }
    const dados = {
      fornecedorId: Number(form.fornecedorId),
      produtoId: Number(form.produtoId),
      descricao: form.descricao,
      impacto: form.impacto === '' ? null : { valor: Number(form.impacto), moeda: form.moedaImpacto },
      status: form.status,
      comentario: form.comentario,
    }
    if (editando) claims.editar(editando.id, dados)
    else claims.criar({ ...dados, vendedorId: usuarioLogado.id, data: new Date().toISOString().slice(0, 10) })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar claim' : 'Novo claim'}
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
          <button type="submit" form="claim-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Salvar
          </button>
        </>
      }
    >
      <form id="claim-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Fornecedor" required error={erros.fornecedorId ? 'Selecione o fornecedor.' : undefined}>
          <SelectBusca
            value={form.fornecedorId}
            onChange={(fornecedorId) => setForm({ ...form, fornecedorId })}
            opcoes={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
            erro={erros.fornecedorId}
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

        <Field label="Descrição" required>
          <textarea
            className={inputClass}
            rows={2}
            required
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Impacto financeiro (opcional)">
            <CampoNumerico value={form.impacto} onChange={(v) => setForm({ ...form, impacto: v })} />
          </Field>
          <Field label="Moeda">
            <select className={inputClass} value={form.moedaImpacto} onChange={(e) => setForm({ ...form, moedaImpacto: e.target.value })}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Não iniciado">Não iniciado</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Rejeitado">Rejeitado</option>
          </select>
        </Field>

        <Field label="Comentários">
          <textarea
            className={inputClass}
            rows={2}
            value={form.comentario}
            onChange={(e) => setForm({ ...form, comentario: e.target.value })}
          />
        </Field>
      </form>
    </Modal>
  )
}
