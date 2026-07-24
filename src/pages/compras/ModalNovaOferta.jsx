import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { MOEDAS, UNIDADES_PESO } from '../../data/unidades.js'

function proximoCodigo(ofertas) {
  const numeros = ofertas.map((o) => Number(o.codigoBase.replace('OF-', ''))).filter((n) => !Number.isNaN(n))
  const proximo = Math.max(0, ...numeros) + 1
  return `OF-${String(proximo).padStart(4, '0')}`
}

function valoresIniciais() {
  return {
    produtoId: '',
    fornecedorId: '',
    valor: '',
    moeda: 'USD',
    unidade: 'ton',
    quantidade: '',
    observacao: '',
  }
}

export default function ModalNovaOferta({ open, onClose, produtosAtivos, fornecedores, onCriada }) {
  const { ofertas, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())

  function fecharEResetar() {
    setForm(valoresIniciais())
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    const codigo = proximoCodigo(ofertas.items)
    const nova = ofertas.criar({
      codigo,
      codigoBase: codigo,
      versao: 0,
      produtoId: Number(form.produtoId),
      fornecedorId: Number(form.fornecedorId),
      precoCusto: { valor: Number(form.valor), moeda: form.moeda, unidade: form.unidade },
      quantidade: Number(form.quantidade),
      unidade: form.unidade,
      status: 'Disponível',
      data: new Date().toISOString().slice(0, 10),
      usuarioId: usuarioLogado.id,
      observacao: form.observacao,
    })
    fecharEResetar()
    onCriada(nova)
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title="Nova oferta"
      footer={
        <>
          <button
            type="button"
            onClick={fecharEResetar}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="oferta-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Salvar
          </button>
        </>
      }
    >
      <form id="oferta-form" onSubmit={salvar} className="flex flex-col gap-4">
        <button
          type="button"
          disabled
          className="flex w-fit items-center rounded border border-dashed border-ayamo-border px-3 py-1.5 text-xs text-ayamo-text-mut opacity-60"
        >
          Importar de imagem (IA) — em breve
        </button>

        <Field label="Produto" required>
          <select className={inputClass} required value={form.produtoId} onChange={(e) => setForm({ ...form, produtoId: e.target.value })}>
            <option value="">Selecione</option>
            {produtosAtivos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fornecedor" required>
          <select className={inputClass} required value={form.fornecedorId} onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}>
            <option value="">Selecione</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Preço de custo" required>
            <CampoNumerico required value={form.valor} onChange={(valor) => setForm({ ...form, valor })} />
          </Field>
          <Field label="Moeda" required>
            <select className={inputClass} value={form.moeda} onChange={(e) => setForm({ ...form, moeda: e.target.value })}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unidade" required>
            <select className={inputClass} value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
              {UNIDADES_PESO.map((u) => (
                <option key={u.codigo} value={u.codigo}>
                  {u.codigo}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Quantidade" required>
          <CampoNumerico required value={form.quantidade} onChange={(quantidade) => setForm({ ...form, quantidade })} />
        </Field>

        <Field label="Observação">
          <textarea
            className={inputClass}
            rows={2}
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>
      </form>
    </Modal>
  )
}
