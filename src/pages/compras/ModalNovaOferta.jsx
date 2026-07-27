import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { MOEDAS, UNIDADES_PESO, INCOTERMS } from '../../data/unidades.js'

function proximoCodigo(ofertas) {
  const numeros = ofertas.map((o) => Number(o.codigoBase.replace('OF-', ''))).filter((n) => !Number.isNaN(n))
  const proximo = Math.max(0, ...numeros) + 1
  return `OF-${String(proximo).padStart(4, '0')}`
}

function valoresIniciais() {
  return {
    tipoRegistro: 'Position',
    produtoId: '',
    fornecedorId: '',
    valor: '',
    moeda: 'USD',
    unidade: 'ton',
    quantidade: '',
    observacao: '',
    numeroContrato: '',
    incoterm: 'CFR',
    portoOrigem: '',
    prazoPagamento: '',
    embarqueDe: '',
    embarqueAte: '',
    mfgSite: '',
    validadeAte: '',
    ayamoEntidadeId: '',
  }
}

export default function ModalNovaOferta({ open, onClose, produtosAtivos, fornecedores, onCriada, inicial }) {
  const { ofertas, dadosAyamo, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())
  const entidadesAtivas = dadosAyamo.items.filter((e) => e.situacao === 'Ativo')

  useEffect(() => {
    if (open) {
      setForm({ ...valoresIniciais(), ayamoEntidadeId: entidadesAtivas[0]?.id ?? '', ...inicial })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

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
      tipoRegistro: form.tipoRegistro,
      produtoId: Number(form.produtoId),
      fornecedorId: Number(form.fornecedorId),
      precoCusto: { valor: Number(form.valor), moeda: form.moeda, unidade: form.unidade },
      quantidade: form.quantidade === '' ? null : Number(form.quantidade),
      quantidadeOriginal: form.quantidade === '' ? null : Number(form.quantidade),
      unidade: form.unidade,
      status: 'Disponível',
      data: new Date().toISOString().slice(0, 10),
      usuarioId: usuarioLogado.id,
      observacao: form.observacao,
      numeroContrato: form.numeroContrato,
      incoterm: form.incoterm,
      portoOrigem: form.portoOrigem,
      prazoPagamento: form.prazoPagamento,
      embarqueDe: form.embarqueDe,
      embarqueAte: form.embarqueAte,
      mfgSite: form.mfgSite,
      validadeAte: form.validadeAte,
      ayamoEntidadeId: form.ayamoEntidadeId ? Number(form.ayamoEntidadeId) : null,
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

        <Field label="Tipo de registro" required hint="Oferta = ainda em negociação com o fornecedor. Position = compra já fechada.">
          <div className="flex gap-2">
            {['Oferta', 'Position'].map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setForm({ ...form, tipoRegistro: tipo })}
                className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                  form.tipoRegistro === tipo
                    ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary'
                    : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </Field>

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

        {entidadesAtivas.length > 0 && (
          <Field label="Entidade Ayamo compradora" hint="Usada no PO — configurável em Cadastros gerais > Dados da Ayamo">
            <select
              className={inputClass}
              value={form.ayamoEntidadeId}
              onChange={(e) => setForm({ ...form, ayamoEntidadeId: e.target.value })}
            >
              {entidadesAtivas.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.razaoSocial}
                </option>
              ))}
            </select>
          </Field>
        )}

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

        <Field
          label="Quantidade"
          required={form.tipoRegistro === 'Position'}
          hint={form.tipoRegistro === 'Oferta' ? 'Opcional — o fornecedor pode não ter definido ainda.' : undefined}
        >
          <CampoNumerico
            required={form.tipoRegistro === 'Position'}
            value={form.quantidade}
            onChange={(quantidade) => setForm({ ...form, quantidade })}
          />
        </Field>

        <Field label="Observação">
          <textarea
            className={inputClass}
            rows={2}
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>

        <p className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">Dados para o PO (opcional)</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Número do contrato" hint="Ex.: P12179">
            <input className={inputClass} value={form.numeroContrato} onChange={(e) => setForm({ ...form, numeroContrato: e.target.value })} />
          </Field>
          <Field label="Incoterm">
            <select className={inputClass} value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })}>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Porto de origem" hint="Ex.: Any Brazilian Port - Brazil">
            <input className={inputClass} value={form.portoOrigem} onChange={(e) => setForm({ ...form, portoOrigem: e.target.value })} />
          </Field>
          <Field label="Site / planta de fabricação">
            <input className={inputClass} value={form.mfgSite} onChange={(e) => setForm({ ...form, mfgSite: e.target.value })} />
          </Field>
        </div>

        <Field label="Oferta válida até" hint="Usado para o selo de validade na lista de Compras">
          <input
            className={inputClass}
            placeholder="dd/mm/aaaa"
            value={form.validadeAte}
            onChange={(e) => setForm({ ...form, validadeAte: e.target.value })}
          />
        </Field>

        <Field label="Prazo de pagamento" hint="Ex.: 100% TT">
          <input className={inputClass} value={form.prazoPagamento} onChange={(e) => setForm({ ...form, prazoPagamento: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Embarque de">
            <input
              className={inputClass}
              placeholder="dd/mm/aaaa"
              value={form.embarqueDe}
              onChange={(e) => setForm({ ...form, embarqueDe: e.target.value })}
            />
          </Field>
          <Field label="Embarque até">
            <input
              className={inputClass}
              placeholder="dd/mm/aaaa"
              value={form.embarqueAte}
              onChange={(e) => setForm({ ...form, embarqueAte: e.target.value })}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
