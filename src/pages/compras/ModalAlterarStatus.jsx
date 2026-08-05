import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

const STATUS_OPCOES = ['Disponível', 'Em revisão', 'Esgotada', 'Expirada']

export default function ModalAlterarStatus({ open, onClose, atual }) {
  const { t } = useI18n()
  const { alterarStatusOferta } = useData()
  const [status, setStatus] = useState(atual.status)
  const [observacao, setObservacao] = useState('')

  function fecharEResetar() {
    setStatus(atual.status)
    setObservacao('')
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    alterarStatusOferta(atual, status, observacao)
    fecharEResetar()
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title={t('modal.tituloAlterarStatus')}
      footer={<ModalFooterAcoes onCancelar={fecharEResetar} formId="status-oferta-form" />}
    >
      <form id="status-oferta-form" onSubmit={salvar} className="flex flex-col gap-4">
        <p className="text-sm text-ayamo-text-mut">
          Muda só o status da oferta atual — sem criar uma nova revisão de preço. Use quando o fornecedor confirmar o
          mesmo preço, ou quando precisar marcar a oferta como esgotada/expirada.
        </p>
        <Field label={t('campo.novoStatus')} required>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('campo.observacao')}>
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Ex.: Fornecedor confirmou o mesmo preço, oferta segue disponível."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
