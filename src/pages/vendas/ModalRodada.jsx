import { useEffect, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function ModalRodada({ open, tipo, itemAtual, onClose, onConfirmar }) {
  const { t } = useI18n()
  const exigePreco = tipo === 'Contraproposta do cliente'

  const [preco, setPreco] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    if (open && itemAtual) {
      setPreco(itemAtual.precoVenda.valor)
      setQuantidade(itemAtual.quantidade)
      setObservacao('')
    }
  }, [open, itemAtual])

  function confirmar(e) {
    e.preventDefault()
    onConfirmar({
      preco: exigePreco ? { valor: Number(preco), moeda: itemAtual.precoVenda.moeda, unidade: itemAtual.unidade } : undefined,
      quantidade: exigePreco ? Number(quantidade) : undefined,
      observacao,
    })
  }

  if (!itemAtual) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tipo}
      footer={<ModalFooterAcoes onCancelar={onClose} formId="rodada-form" labelSalvar="Registrar" />}
    >
      <form id="rodada-form" onSubmit={confirmar} className="flex flex-col gap-4">
        {exigePreco && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Preço (${itemAtual.precoVenda.moeda})`} required>
              <CampoNumerico required value={preco} onChange={setPreco} />
            </Field>
            <Field label={t('campo.quantidade')} required>
              <CampoNumerico required value={quantidade} onChange={setQuantidade} />
            </Field>
          </div>
        )}
        <Field label={t('campo.observacao')}>
          <textarea className={inputClass} rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
