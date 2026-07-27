import { useState } from 'react'
import { Plus } from 'lucide-react'
import DataTable from '../../components/DataTable.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

function valoresIniciais(fields, item) {
  return fields
    .filter((f) => f.type !== 'derived')
    .reduce((acc, f) => ({ ...acc, [f.key]: item ? item[f.key] : (f.type === 'select' ? '' : '') }), {})
}

export default function CrudTab({ collection, itemLabel, columns, fields }) {
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})

  function abrirNovo() {
    setEditando(null)
    setForm(valoresIniciais(fields))
    setModalAberto(true)
  }

  function abrirEdicao(item) {
    setEditando(item)
    setForm(valoresIniciais(fields, item))
    setModalAberto(true)
  }

  function salvar(e) {
    e.preventDefault()
    const dados = { ...form }
    fields.forEach((f) => {
      if (f.type === 'number' && dados[f.key] !== '') dados[f.key] = Number(dados[f.key])
    })
    if (editando) collection.editar(editando.id, dados)
    else collection.criar(dados)
    setModalAberto(false)
  }

  const colunasComAcoes = [
    ...columns,
    {
      key: '_acoes',
      header: '',
      render: (item) => (
        <div className="flex justify-end gap-3 text-sm">
          <button type="button" onClick={() => abrirEdicao(item)} className="text-ayamo-primary hover:underline">
            Editar
          </button>
          {item.situacao === 'Ativo' ? (
            <button
              type="button"
              onClick={() => collection.inativar(item.id)}
              className="text-ayamo-danger hover:underline"
            >
              Inativar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => collection.editar(item.id, { situacao: 'Ativo' })}
              className="text-ayamo-success hover:underline"
            >
              Reativar
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Excluir ${itemLabel} "${item.nome}" definitivamente?`)) collection.remover(item.id)
            }}
            className="text-ayamo-danger hover:underline"
          >
            Excluir
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          Novo {itemLabel}
        </button>
      </div>

      <DataTable columns={colunasComAcoes} data={collection.items} rowKey="id" />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? `Editar ${itemLabel}` : `Novo ${itemLabel}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="crud-tab-form"
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Salvar
            </button>
          </>
        }
      >
        <form id="crud-tab-form" onSubmit={salvar} className="flex flex-col gap-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} required={f.required}>
              {f.type === 'select' && (
                <select
                  className={inputClass}
                  value={form[f.key] ?? ''}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                >
                  <option value="">Selecione</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {f.type === 'text' && (
                <input
                  className={inputClass}
                  value={form[f.key] ?? ''}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
              {f.type === 'number' && (
                <input
                  type="number"
                  className={inputClass}
                  value={form[f.key] ?? ''}
                  required={f.required}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
              {f.type === 'derived' && (
                <input className={`${inputClass} bg-ayamo-bg text-ayamo-text-mut`} value={f.compute(form)} disabled />
              )}
            </Field>
          ))}
        </form>
      </Modal>
    </div>
  )
}

export function colunaSituacao() {
  return {
    key: 'situacao',
    header: 'Situação',
    render: (item) => (
      <StatusBadge label={item.situacao} tone={item.situacao === 'Ativo' ? 'success' : 'neutral'} />
    ),
  }
}
