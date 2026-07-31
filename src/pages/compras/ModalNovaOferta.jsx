import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import CampoData from '../../components/CampoData.jsx'
import SelectBusca from '../../components/SelectBusca.jsx'
import SecaoRecolhivel from '../../components/SecaoRecolhivel.jsx'
import { MOEDAS, UNIDADES_PESO, INCOTERMS } from '../../data/unidades.js'
import { STATUS_PRODUCAO } from '../../data/statusProducao.js'

function proximoCodigo(ofertas) {
  const numeros = ofertas.map((o) => Number(o.codigoBase.replace('OF-', ''))).filter((n) => !Number.isNaN(n))
  const proximo = Math.max(0, ...numeros) + 1
  return `OF-${String(proximo).padStart(4, '0')}`
}

function valoresIniciais() {
  return {
    tipoRegistro: 'Position',
    statusProducao: 'Pronto para embarque',
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
  const [erros, setErros] = useState({})
  const entidadesAtivas = dadosAyamo.items.filter((e) => e.situacao === 'Ativo')

  useEffect(() => {
    if (open) {
      setForm({ ...valoresIniciais(), ayamoEntidadeId: entidadesAtivas[0]?.id ?? '', ...inicial })
      setErros({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  function fecharEResetar() {
    setForm(valoresIniciais())
    setErros({})
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    if (!form.produtoId || !form.fornecedorId) {
      setErros({ produtoId: !form.produtoId, fornecedorId: !form.fornecedorId })
      return
    }
    const codigo = proximoCodigo(ofertas.items)
    const nova = ofertas.criar({
      codigo,
      codigoBase: codigo,
      versao: 0,
      tipoRegistro: form.tipoRegistro,
      statusProducao: form.tipoRegistro === 'Position' ? form.statusProducao : null,
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
      footer={<ModalFooterAcoes onCancelar={fecharEResetar} formId="oferta-form" />}
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

        {form.tipoRegistro === 'Position' && (
          <Field label="Status de produção" hint="Nem toda Position já está pronta — pode ser um pedido que só fica pronto depois.">
            <select
              className={inputClass}
              value={form.statusProducao}
              onChange={(e) => setForm({ ...form, statusProducao: e.target.value })}
            >
              {STATUS_PRODUCAO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Produto" required error={erros.produtoId ? 'Selecione o produto.' : undefined}>
          <SelectBusca
            value={form.produtoId}
            onChange={(produtoId) => setForm({ ...form, produtoId })}
            opcoes={produtosAtivos.map((p) => ({ value: p.id, label: p.nome }))}
            erro={erros.produtoId}
          />
        </Field>

        <Field label="Fornecedor" required error={erros.fornecedorId ? 'Selecione o fornecedor.' : undefined}>
          <SelectBusca
            value={form.fornecedorId}
            onChange={(fornecedorId) => setForm({ ...form, fornecedorId })}
            opcoes={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
            erro={erros.fornecedorId}
          />
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

        <Field label="Observação" hint="Campo de texto livre — escreva à mão qualquer detalhe relevante da negociação.">
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Ex.: Fornecedor pediu confirmação até sexta-feira."
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>

        <SecaoRecolhivel titulo="Dados para o PO (opcional)" aberturaInicial={false}>
          <div className="flex flex-col gap-4">
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
              <CampoData value={form.validadeAte} onChange={(validadeAte) => setForm({ ...form, validadeAte })} />
            </Field>

            <Field label="Prazo de pagamento" hint="Ex.: 100% TT">
              <input className={inputClass} value={form.prazoPagamento} onChange={(e) => setForm({ ...form, prazoPagamento: e.target.value })} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Embarque de">
                <CampoData value={form.embarqueDe} onChange={(embarqueDe) => setForm({ ...form, embarqueDe })} />
              </Field>
              <Field label="Embarque até">
                <CampoData value={form.embarqueAte} onChange={(embarqueAte) => setForm({ ...form, embarqueAte })} />
              </Field>
            </div>
          </div>
        </SecaoRecolhivel>
      </form>
    </Modal>
  )
}
