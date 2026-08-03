import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import Field, { inputClass } from './Field.jsx'

// Modal genérico pra mandar qualquer mensagem (negociação, follow-up, etc.) via WhatsApp —
// sem backend, só abre o wa.me com o texto preenchido. Usado em Compras (fornecedor) e Vendas (cliente).
export default function ModalEnviarWhatsApp({ open, onClose, titulo, contatos, mensagemInicial }) {
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (open) {
      setTelefone(contatos?.[0]?.telefone ?? '')
      setMensagem(mensagemInicial ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre
  }, [open])

  function enviar() {
    const numero = telefone.replace(/\D/g, '')
    if (!numero) return
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!telefone.replace(/\D/g, '')}
            onClick={enviar}
            className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar por WhatsApp
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Contato" hint="Escolha um contato salvo ou digite o número manualmente">
          <select
            className={inputClass}
            value={contatos?.some((c) => c.telefone === telefone) ? telefone : ''}
            onChange={(e) => setTelefone(e.target.value)}
          >
            <option value="">Digitar manualmente...</option>
            {contatos?.map((c) => (
              <option key={c.id ?? c.telefone} value={c.telefone}>
                {c.nome} — {c.telefone}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Número (com DDI)" required>
          <input className={inputClass} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+55 47 99999-0000" />
        </Field>
        <Field label="Mensagem">
          <textarea className={inputClass} rows={12} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
