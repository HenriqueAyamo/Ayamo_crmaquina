import { useEffect, useState } from 'react'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { INCOTERMS } from '../../data/unidades.js'
import { formatarValor } from '../../utils/formato.js'

function valoresIniciais(oferta) {
  return {
    clienteId: '',
    nomeCliente: '',
    destino: '',
    incoterm: oferta.incoterm ?? 'CFR',
    prazoPagamento: oferta.prazoPagamento ?? '',
    margem: '',
    emails: '',
    whatsapps: '',
  }
}

export default function ModalEnviarOferta({ open, onClose, oferta, produto, fornecedor, clientes }) {
  const [form, setForm] = useState(valoresIniciais(oferta))
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (open) {
      setForm(valoresIniciais(oferta))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  const precoFinal = oferta.precoCusto.valor + Number(form.margem || 0)

  useEffect(() => {
    if (!open) return
    setAssunto(`Offer — ${produto?.nome ?? ''} — ${oferta.embarqueDe || 'TBI'}`)
    setMensagem(`Dear ${form.nomeCliente || 'Team'},

We are pleased to share the following offer for your consideration:

- Product: ${produto?.nome ?? ''}
- Price: ${formatarValor(precoFinal, oferta.precoCusto.moeda)} / ${oferta.unidade} ${form.incoterm}
- Volume: ${oferta.quantidade.toLocaleString('pt-BR')} ${oferta.unidade}
- Destination: ${form.destino || 'TBI'}
- Packaging: ${produto?.embalagem || '—'}
- Shipment: ${oferta.embarqueDe || 'TBI'} - ${oferta.embarqueAte || 'TBI'}
- Payment terms: ${form.prazoPagamento || '—'}
- Offer expires on: ${oferta.validadeAte || 'TBI'}

Availability is subject to prior sale. Please let us know if you would like to proceed or discuss further details.

Best regards,`)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só monta o texto de novo quando o modal abre ou o cliente/margem muda
  }, [open, form.nomeCliente, form.destino, form.incoterm, form.prazoPagamento, form.margem])

  function selecionarCliente(clienteId) {
    const cliente = clientes.find((c) => String(c.id) === clienteId)
    setForm((atual) => ({
      ...atual,
      clienteId,
      nomeCliente: cliente?.nome ?? atual.nomeCliente,
      destino: cliente?.pais ?? atual.destino,
    }))
  }

  function enviarPorEmail() {
    const destinatarios = form.emails
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean)
      .join(',')
    const url = `mailto:${destinatarios}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`
    window.location.href = url
  }

  function enviarPorWhatsapp() {
    const numeros = form.whatsapps
      .split(/[,;]/)
      .map((n) => n.replace(/\D/g, ''))
      .filter(Boolean)
    numeros.forEach((numero) => window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank'))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enviar oferta — ${produto?.nome ?? ''}`}
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={enviarPorWhatsapp}
            disabled={!form.whatsapps}
            className="rounded border border-ayamo-primary px-4 py-2 text-sm font-medium text-ayamo-primary hover:bg-ayamo-bg disabled:opacity-40"
          >
            Enviar por WhatsApp
          </button>
          <button
            type="button"
            onClick={enviarPorEmail}
            disabled={!form.emails}
            className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            Enviar por e-mail
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-3">
          <Field label="Cliente (opcional)" hint="Preenche nome e destino automaticamente">
            <select className={inputClass} value={form.clienteId} onChange={(e) => selecionarCliente(e.target.value)}>
              <option value="">Selecione ou preencha manualmente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nome do cliente (saudação)">
            <input className={inputClass} value={form.nomeCliente} onChange={(e) => setForm({ ...form, nomeCliente: e.target.value })} />
          </Field>
          <Field label="Destino">
            <input className={inputClass} value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Incoterm oferecido">
              <select className={inputClass} value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })}>
                {INCOTERMS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prazo de pagamento">
              <input
                className={inputClass}
                value={form.prazoPagamento}
                onChange={(e) => setForm({ ...form, prazoPagamento: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Margem / ton (interno)" hint="Nunca é enviado ao cliente">
            <CampoNumerico value={form.margem} onChange={(margem) => setForm({ ...form, margem })} />
          </Field>
          <Field label="Preço final ao cliente" hint="Custo + margem, calculado">
            <input className={`${inputClass} bg-ayamo-bg`} disabled value={formatarValor(precoFinal, oferta.precoCusto.moeda)} />
          </Field>
          <Field label="E-mail(s) do cliente" hint="Separados por vírgula">
            <input className={inputClass} value={form.emails} onChange={(e) => setForm({ ...form, emails: e.target.value })} />
          </Field>
          <Field label="WhatsApp (opcional)" hint="Separados por vírgula, com DDI">
            <input className={inputClass} value={form.whatsapps} onChange={(e) => setForm({ ...form, whatsapps: e.target.value })} />
          </Field>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Assunto">
            <input className={inputClass} value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          </Field>
          <Field label="Mensagem">
            <textarea className={inputClass} rows={16} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          </Field>
          <p className="rounded border border-ayamo-warning bg-ayamo-warning/10 px-3 py-2 text-xs text-ayamo-warning">
            Preço de custo, margem e o fornecedor ({fornecedor?.nome}) nunca aparecem na mensagem — só o preço final calculado.
          </p>
        </div>
      </div>
    </Modal>
  )
}
