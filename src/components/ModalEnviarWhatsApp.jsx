import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, RotateCcw } from 'lucide-react'
import Modal from './Modal.jsx'
import Botao from './Botao.jsx'
import Field, { inputClass } from './Field.jsx'
import CampoNumerico from './CampoNumerico.jsx'
import SeletorContatos from './SeletorContatos.jsx'
import { MOEDAS, UNIDADES_PESO } from '../data/unidades.js'
import {
  IDIOMAS_MENSAGEM,
  NOTA_CAMBIO,
  converterPreco,
  converterQuantidade,
  fechamentoPadrao,
  montarMensagemWhatsApp,
  saudacaoPadrao,
} from '../utils/mensagensWhatsApp.js'

// Campos de texto livre que aparecem no formulário, por tipo de mensagem.
const CAMPOS_TEXTO = {
  negociacaoFornecedor: [
    { chave: 'produto', label: 'Produto' },
    { chave: 'referencia', label: 'Código da oferta' },
    { chave: 'incoterm', label: 'Incoterm' },
    { chave: 'embarqueDe', label: 'Embarque de' },
    { chave: 'embarqueAte', label: 'Embarque até' },
    { chave: 'prazoPagamento', label: 'Prazo de pagamento' },
    { chave: 'validade', label: 'Validade da oferta' },
  ],
  propostaCliente: [
    { chave: 'produto', label: 'Produto' },
    { chave: 'referencia', label: 'Número da proposta' },
    { chave: 'incoterm', label: 'Incoterm' },
    { chave: 'embarqueDe', label: 'Embarque de' },
    { chave: 'embarqueAte', label: 'Embarque até' },
    { chave: 'prazoPagamento', label: 'Prazo de pagamento' },
    { chave: 'status', label: 'Status atual' },
  ],
  cobrancaProposta: [
    { chave: 'produto', label: 'Produto' },
    { chave: 'referencia', label: 'Número da proposta' },
    { chave: 'incoterm', label: 'Incoterm' },
    { chave: 'embarqueDe', label: 'Embarque de' },
    { chave: 'embarqueAte', label: 'Embarque até' },
    { chave: 'prazoPagamento', label: 'Prazo de pagamento' },
    { chave: 'status', label: 'Status atual' },
  ],
}

// Modal genérico pra mandar qualquer mensagem (negociação, follow-up, etc.) via WhatsApp —
// sem backend, só abre o wa.me com o texto preenchido. Usado em Compras (fornecedor) e Vendas (cliente).
//
// Recebe um "modelo" ({ tipo, dados }) de utils/mensagensWhatsApp.js. À esquerda o usuário ajusta
// os valores, escolhe o idioma (PT/EN/ES) e converte moeda e unidade; à direita vê o preview.
// Quem edita o texto direto no preview assume o controle e o remonte automático para.
export default function ModalEnviarWhatsApp({ open, onClose, titulo, contatos, modelo, mensagemInicial }) {
  const [selecionados, setSelecionados] = useState([])
  const [telefoneManual, setTelefoneManual] = useState('')
  const [idioma, setIdioma] = useState('pt')
  const [dados, setDados] = useState(null)
  const [textoManual, setTextoManual] = useState(null)

  useEffect(() => {
    if (!open) return
    setSelecionados(contatos?.[0]?.id != null ? [contatos[0].id] : [])
    setTelefoneManual('')
    setIdioma('pt')
    setDados(modelo ? { ...modelo.dados } : null)
    setTextoManual(modelo ? null : (mensagemInicial ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre
  }, [open])

  // Trocar o idioma reescreve só as frases geradas pelo sistema (saudação e pedido final);
  // o que o usuário digitou nos outros campos é preservado.
  function trocarIdioma(novoIdioma) {
    setIdioma(novoIdioma)
    setDados((atual) =>
      atual
        ? {
            ...atual,
            saudacao: saudacaoPadrao(novoIdioma),
            fechamento: fechamentoPadrao(modelo.tipo, novoIdioma),
          }
        : atual,
    )
  }

  function trocarMoeda(moedaAlvo) {
    setDados((atual) => ({ ...atual, preco: converterPreco(atual.preco, moedaAlvo, atual.preco.unidade) }))
  }

  function trocarUnidade(unidadeAlvo) {
    setDados((atual) => ({
      ...atual,
      preco: converterPreco(atual.preco, atual.preco.moeda, unidadeAlvo),
      quantidade: converterQuantidade(atual.quantidade, unidadeAlvo),
    }))
  }

  const mensagemGerada = useMemo(() => {
    if (!modelo || !dados) return mensagemInicial ?? ''
    return montarMensagemWhatsApp(modelo.tipo, dados, idioma)
  }, [modelo, dados, idioma, mensagemInicial])

  const mensagem = textoManual ?? mensagemGerada
  const camposTexto = modelo ? (CAMPOS_TEXTO[modelo.tipo] ?? []) : []

  // Números de destino = contatos marcados na lista + os digitados à mão (separados por vírgula).
  const destinos = useMemo(() => {
    const dosContatos = (contatos ?? [])
      .filter((c) => selecionados.includes(c.id))
      .map((c) => ({ nome: c.nome, numero: c.telefone.replace(/\D/g, '') }))
    const manuais = telefoneManual
      .split(/[,;]/)
      .map((n) => n.replace(/\D/g, ''))
      .filter(Boolean)
      .map((numero) => ({ nome: numero, numero }))
    const vistos = new Set()
    return [...dosContatos, ...manuais].filter((d) => d.numero && !vistos.has(d.numero) && vistos.add(d.numero))
  }, [contatos, selecionados, telefoneManual])

  function abrirConversa(numero) {
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer')
  }

  function enviar() {
    if (destinos.length === 0) return
    destinos.forEach((d) => abrirConversa(d.numero))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      width="lg"
      footer={
        <>
          <Botao variante="secundario" onClick={onClose}>
            Cancelar
          </Botao>
          <Botao variante="primario" icone={MessageCircle} disabled={destinos.length === 0} onClick={enviar}>
            {destinos.length > 1 ? `Enviar para ${destinos.length} contatos` : 'Enviar por WhatsApp'}
          </Botao>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Contatos cadastrados" hint="Marque um ou vários — cada um abre em uma conversa própria">
            <SeletorContatos contatos={contatos ?? []} selecionados={selecionados} onChange={setSelecionados} />
          </Field>

          <Field label="Outros números (com DDI)" hint="Separados por vírgula, para quem não está cadastrado">
            <input
              className={inputClass}
              value={telefoneManual}
              onChange={(e) => setTelefoneManual(e.target.value)}
              placeholder="+55 47 99999-0000, +1 212 555-0100"
            />
          </Field>

          {destinos.length > 1 && (
            <div className="rounded-md border border-ayamo-warning/40 bg-ayamo-warning/10 px-3 py-2 text-xs text-ayamo-warning">
              Serão abertas {destinos.length} abas do WhatsApp, uma por contato — a mesma mensagem em todas. Se o
              navegador bloquear, libere os pop-ups deste site ou envie um a um pela lista abaixo do preview.
            </div>
          )}

          {modelo && dados && (
            <>
              <Field label="Idioma da mensagem" hint="Troca as frases geradas pelo sistema; o que você digitou é mantido.">
                <div className="flex gap-2">
                  {IDIOMAS_MENSAGEM.map((op) => (
                    <button
                      key={op.codigo}
                      type="button"
                      onClick={() => trocarIdioma(op.codigo)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        idioma === op.codigo
                          ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary'
                          : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
                      }`}
                    >
                      {op.nome}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="border-t border-ayamo-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">
                  Preço e quantidade
                </p>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Preço">
                      <CampoNumerico
                        value={dados.preco.valor}
                        onChange={(valor) => setDados((a) => ({ ...a, preco: { ...a.preco, valor: Number(valor) || 0 } }))}
                      />
                    </Field>
                    <Field label="Moeda" hint={NOTA_CAMBIO}>
                      <select className={inputClass} value={dados.preco.moeda} onChange={(e) => trocarMoeda(e.target.value)}>
                        {MOEDAS.map((m) => (
                          <option key={m.codigo} value={m.codigo}>
                            {m.codigo}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Unidade" hint="Converte preço e quantidade">
                      <select className={inputClass} value={dados.preco.unidade} onChange={(e) => trocarUnidade(e.target.value)}>
                        {UNIDADES_PESO.map((u) => (
                          <option key={u.codigo} value={u.codigo}>
                            {u.codigo}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={`Quantidade (${dados.quantidade.unidade})`}>
                      <CampoNumerico
                        value={dados.quantidade.valor ?? ''}
                        onChange={(valor) =>
                          setDados((a) => ({
                            ...a,
                            quantidade: { ...a.quantidade, valor: valor === '' ? null : Number(valor) },
                          }))
                        }
                      />
                    </Field>
                    <Field label="Contêineres">
                      <CampoNumerico
                        value={dados.numeroContainers ?? ''}
                        onChange={(valor) =>
                          setDados((a) => ({ ...a, numeroContainers: valor === '' ? null : Number(valor) }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="border-t border-ayamo-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">
                  Ajustar textos da mensagem
                </p>
                <div className="flex flex-col gap-3">
                  <Field label="Saudação">
                    <input
                      className={inputClass}
                      value={dados.saudacao}
                      onChange={(e) => setDados((a) => ({ ...a, saudacao: e.target.value }))}
                    />
                  </Field>
                  {camposTexto.map((campo) => (
                    <Field key={campo.chave} label={campo.label}>
                      <input
                        className={inputClass}
                        value={dados[campo.chave] ?? ''}
                        onChange={(e) => setDados((a) => ({ ...a, [campo.chave]: e.target.value }))}
                      />
                    </Field>
                  ))}
                  <Field label="Pedido final">
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={dados.fechamento}
                      onChange={(e) => setDados((a) => ({ ...a, fechamento: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">Preview</p>
            {textoManual !== null && modelo && (
              <button
                type="button"
                onClick={() => setTextoManual(null)}
                className="flex items-center gap-1 text-xs text-ayamo-primary hover:underline"
              >
                <RotateCcw size={12} />
                Voltar ao texto gerado
              </button>
            )}
          </div>

          <div className="rounded-lg border border-ayamo-border bg-ayamo-bg p-3">
            <div className="ml-auto max-w-[92%] rounded-lg rounded-br-sm bg-ayamo-success/15 px-3 py-2">
              <textarea
                aria-label="Mensagem"
                className="max-h-[46vh] min-h-[300px] w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed text-ayamo-text outline-none"
                value={mensagem}
                onChange={(e) => setTextoManual(e.target.value)}
              />
              <div className="mt-1 text-right text-[10px] text-ayamo-text-mut">{mensagem.length} caracteres</div>
            </div>
          </div>

          <p className="text-xs text-ayamo-text-mut">
            {textoManual !== null
              ? 'Texto editado à mão — mudanças nos campos ao lado não sobrescrevem mais este conteúdo.'
              : 'Você pode editar direto aqui; os campos ao lado remontam o texto automaticamente.'}
          </p>

          {destinos.length > 0 && (
            <div className="mt-1">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">
                Enviar individualmente
              </p>
              <ul className="flex flex-col gap-1">
                {destinos.map((d) => (
                  <li key={d.numero} className="flex items-center justify-between gap-2 rounded-md border border-ayamo-border px-2.5 py-1.5">
                    <span className="min-w-0 truncate text-xs text-ayamo-text">{d.nome}</span>
                    <Botao variante="sucesso" tamanho="sm" icone={MessageCircle} onClick={() => abrirConversa(d.numero)}>
                      Abrir
                    </Botao>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
