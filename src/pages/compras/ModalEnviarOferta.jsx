import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Botao from '../../components/Botao.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import SeletorContatos from '../../components/SeletorContatos.jsx'
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
  const { contatos: contatosCadastro, getEmpresa } = useData()
  const [form, setForm] = useState(valoresIniciais(oferta))
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [selecionados, setSelecionados] = useState([])

  useEffect(() => {
    if (open) {
      setForm(valoresIniciais(oferta))
      setSelecionados([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  // Contatos de todos os clientes ativos — a oferta normalmente vai pra vários de uma vez.
  const idsClientes = useMemo(() => new Set(clientes.map((c) => c.id)), [clientes])
  const contatosClientes = useMemo(
    () =>
      contatosCadastro.items
        .filter((c) => idsClientes.has(c.empresaId))
        .map((c) => ({ ...c, empresaNome: getEmpresa(c.empresaId)?.nome ?? '' })),
    [contatosCadastro.items, idsClientes, getEmpresa],
  )

  const selecionadosObj = contatosClientes.filter((c) => selecionados.includes(c.id))

  const numerosSelecionados = useMemo(() => {
    const manuais = form.whatsapps
      .split(/[,;]/)
      .map((n) => n.replace(/\D/g, ''))
      .filter(Boolean)
    const dosContatos = selecionadosObj.map((c) => c.telefone.replace(/\D/g, '')).filter(Boolean)
    return [...new Set([...dosContatos, ...manuais])]
  }, [selecionadosObj, form.whatsapps])

  const emailsSelecionados = useMemo(() => {
    const manuais = form.emails
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean)
    const dosContatos = selecionadosObj.map((c) => c.email).filter(Boolean)
    return [...new Set([...dosContatos, ...manuais])]
  }, [selecionadosObj, form.emails])

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
    // Vai tudo em cópia oculta: os clientes não podem ver para quem mais a oferta foi enviada.
    const url = `mailto:?bcc=${encodeURIComponent(emailsSelecionados.join(','))}&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`
    window.location.href = url
  }

  function enviarPorWhatsapp() {
    numerosSelecionados.forEach((numero) =>
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer'),
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Enviar oferta — ${produto?.nome ?? ''}`}
      width="lg"
      footer={
        <>
          <Botao variante="secundario" onClick={onClose}>
            Fechar
          </Botao>
          <Botao variante="contorno" onClick={enviarPorWhatsapp} disabled={numerosSelecionados.length === 0}>
            WhatsApp ({numerosSelecionados.length})
          </Botao>
          <Botao variante="primario" onClick={enviarPorEmail} disabled={emailsSelecionados.length === 0}>
            E-mail ({emailsSelecionados.length})
          </Botao>
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
          <Field
            label="Destinatários cadastrados"
            hint="Marque quantos quiser — o envio é em lote, uma aba de WhatsApp por contato e um único e-mail em Cco"
          >
            <SeletorContatos
              contatos={contatosClientes}
              selecionados={selecionados}
              onChange={setSelecionados}
              vazioLabel="Nenhum contato de cliente cadastrado — use os campos abaixo"
            />
          </Field>
          <Field label="Outros e-mails" hint="Separados por vírgula">
            <input className={inputClass} value={form.emails} onChange={(e) => setForm({ ...form, emails: e.target.value })} />
          </Field>
          <Field label="Outros WhatsApp" hint="Separados por vírgula, com DDI">
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
