import { useEffect, useState } from 'react'
import { useData } from '../DataContext.jsx'
import Modal from './Modal.jsx'
import ModalFooterAcoes from './ModalFooterAcoes.jsx'
import Field, { inputClass } from './Field.jsx'
import { TIPOS_INTERACAO } from '../data/interacoes.js'
import { hojeISO } from '../utils/followups.js'
import { useI18n } from '../i18n/I18nContext.jsx'

// Registra um contato com a empresa (cliente ou fornecedor) e, opcionalmente, já agenda o
// retorno. Interação e follow-up são o mesmo registro: "falei com X, volto em Y".
export default function ModalRegistrarInteracao({ open, onClose, empresaId, refTipo = null, refId = null, titulo }) {
  const { t } = useI18n()
  const { interacoes, contatos, usuarios, usuarioLogado, getEmpresa } = useData()
  const [form, setForm] = useState(null)

  const contatosEmpresa = contatos.items.filter((c) => c.empresaId === empresaId)
  const usuariosAtivos = usuarios.items.filter((u) => u.situacao === 'Ativo')

  useEffect(() => {
    if (!open) return
    setForm({
      tipo: 'Ligação',
      contatoId: contatosEmpresa[0]?.id ?? '',
      data: hojeISO(),
      observacao: '',
      agendarFollowUp: false,
      followUpEm: '',
      followUpResponsavelId: usuarioLogado.id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre
  }, [open])

  function salvar(e) {
    e.preventDefault()
    interacoes.criar({
      tipo: form.tipo,
      empresaId,
      contatoId: form.contatoId === '' ? null : Number(form.contatoId),
      refTipo,
      refId,
      data: form.data,
      usuarioId: usuarioLogado.id,
      observacao: form.observacao,
      followUpEm: form.agendarFollowUp && form.followUpEm ? form.followUpEm : null,
      followUpResponsavelId: form.agendarFollowUp ? Number(form.followUpResponsavelId) : null,
      followUpConcluido: false,
      followUpConcluidoEm: null,
    })
    onClose()
  }

  if (!form) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo ?? `Registrar contato — ${getEmpresa(empresaId)?.nome ?? ''}`}
      footer={<ModalFooterAcoes onCancelar={onClose} formId="interacao-form" labelSalvar="Registrar" />}
    >
      <form id="interacao-form" onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('campo.tipoContato')} required>
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_INTERACAO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('campo.data')} required>
            <input
              type="date"
              className={inputClass}
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              required
            />
          </Field>
        </div>

        <Field label={t('campo.contato')} hint={contatosEmpresa.length === 0 ? 'Nenhum contato cadastrado nesta empresa' : undefined}>
          <select className={inputClass} value={form.contatoId} onChange={(e) => setForm({ ...form, contatoId: e.target.value })}>
            <option value="">— Não especificado —</option>
            {contatosEmpresa.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.cargo ? ` — ${c.cargo}` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('campo.oQueFoiTratado')} required>
          <textarea
            className={inputClass}
            rows={4}
            required
            placeholder="Ex.: Cliente pediu preço para 2 contêineres em setembro; vai confirmar até sexta."
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>

        <div className="rounded-md border border-ayamo-border bg-ayamo-bg/50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ayamo-text">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--ayamo-primary)]"
              checked={form.agendarFollowUp}
              onChange={(e) => setForm({ ...form, agendarFollowUp: e.target.checked })}
            />
            Agendar follow-up
          </label>

          {form.agendarFollowUp && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label={t('campo.retornarEm')} required>
                <input
                  type="date"
                  className={inputClass}
                  value={form.followUpEm}
                  min={form.data}
                  required
                  onChange={(e) => setForm({ ...form, followUpEm: e.target.value })}
                />
              </Field>
              <Field label={t('campo.responsavel')} required>
                <select
                  className={inputClass}
                  value={form.followUpResponsavelId}
                  onChange={(e) => setForm({ ...form, followUpResponsavelId: e.target.value })}
                >
                  {usuariosAtivos.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} — {u.perfil}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
