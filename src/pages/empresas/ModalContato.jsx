import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'

function valoresIniciais(contato) {
  return {
    nome: contato?.nome ?? '',
    cargo: contato?.cargo ?? '',
    telefone: contato?.telefone ?? '',
    email: contato?.email ?? '',
    categoriasIds: contato?.categoriasIds ?? [],
  }
}

export default function ModalContato({ open, onClose, empresaId, contatoEditando, categoriasAtivas }) {
  const { contatos } = useData()
  const [form, setForm] = useState(valoresIniciais(contatoEditando))

  useEffect(() => {
    if (open) setForm(valoresIniciais(contatoEditando))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  function alternarCategoria(categoriaId) {
    setForm((atual) => ({
      ...atual,
      categoriasIds: atual.categoriasIds.includes(categoriaId)
        ? atual.categoriasIds.filter((id) => id !== categoriaId)
        : [...atual.categoriasIds, categoriaId],
    }))
  }

  function salvar(e) {
    e.preventDefault()
    if (contatoEditando) contatos.editar(contatoEditando.id, form)
    else contatos.criar({ ...form, empresaId })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contatoEditando ? 'Editar contato' : 'Adicionar contato'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="contato-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Salvar
          </button>
        </>
      }
    >
      <form id="contato-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Nome" required>
          <input className={inputClass} required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label="Cargo" required>
          <input className={inputClass} required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
        </Field>
        <Field label="Telefone" required>
          <input className={inputClass} required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </Field>
        <Field label="E-mail" required>
          <input
            type="email"
            className={inputClass}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Categorias">
          <div className="flex flex-wrap gap-3">
            {categoriasAtivas.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm text-ayamo-text">
                <input type="checkbox" checked={form.categoriasIds.includes(c.id)} onChange={() => alternarCategoria(c.id)} />
                {c.nome}
              </label>
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  )
}
