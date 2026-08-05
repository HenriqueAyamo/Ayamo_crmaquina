import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

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
  const { t } = useI18n()
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
      footer={<ModalFooterAcoes onCancelar={onClose} formId="contato-form" />}
    >
      <form id="contato-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label={t('campo.nome')} required>
          <input className={inputClass} required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label={t('campo.cargo')} required>
          <input className={inputClass} required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
        </Field>
        <Field label={t('campo.telefone')} required>
          <input className={inputClass} required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </Field>
        <Field label={t('campo.email')} required>
          <input
            type="email"
            className={inputClass}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label={t('campo.categorias')}>
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
