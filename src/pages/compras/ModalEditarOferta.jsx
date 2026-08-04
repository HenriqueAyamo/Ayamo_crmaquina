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
import { TONELADAS_POR_CONTAINER } from '../../data/toneladasPorContainer.js'

// Correção dos dados da versão atual da oferta, sem criar revisão nova.
// Serve pra consertar o que foi digitado errado — mudança negociada com o fornecedor
// continua indo por "Registrar revisão", que preserva o histórico de preço.
function valoresDe(oferta) {
  return {
    tipoRegistro: oferta.tipoRegistro ?? 'Position',
    statusProducao: oferta.statusProducao ?? 'Pronto para embarque',
    produtoId: String(oferta.produtoId ?? ''),
    fornecedorId: String(oferta.fornecedorId ?? ''),
    valor: oferta.precoCusto?.valor ?? '',
    moeda: oferta.precoCusto?.moeda ?? 'USD',
    unidade: oferta.unidade ?? 'ton',
    numeroContainers: oferta.numeroContainers ?? '',
    quantidade: oferta.quantidade ?? '',
    observacao: oferta.observacao ?? '',
    numeroContrato: oferta.numeroContrato ?? '',
    incoterm: oferta.incoterm ?? 'CFR',
    portoOrigem: oferta.portoOrigem ?? '',
    prazoPagamento: oferta.prazoPagamento ?? '',
    embarqueDe: oferta.embarqueDe ?? '',
    embarqueAte: oferta.embarqueAte ?? '',
    mfgSite: oferta.mfgSite ?? '',
    validadeAte: oferta.validadeAte ?? '',
    ayamoEntidadeId: oferta.ayamoEntidadeId ?? '',
  }
}

export default function ModalEditarOferta({ open, onClose, atual, produtosAtivos, fornecedores }) {
  const { ofertas, dadosAyamo } = useData()
  const [form, setForm] = useState(() => valoresDe(atual))
  const [erros, setErros] = useState({})
  const entidadesAtivas = dadosAyamo.items.filter((e) => e.situacao === 'Ativo')

  useEffect(() => {
    if (open) {
      setForm(valoresDe(atual))
      setErros({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre
  }, [open])

  function salvar(e) {
    e.preventDefault()
    if (!form.produtoId || !form.fornecedorId) {
      setErros({ produtoId: !form.produtoId, fornecedorId: !form.fornecedorId })
      return
    }

    const novaQuantidade = form.quantidade === '' ? null : Number(form.quantidade)
    // quantidadeOriginal guarda o total antes das vendas consumirem estoque; ao corrigir a
    // quantidade disponível, desloca o original pelo mesmo delta pra não zerar o consumido.
    const delta = (novaQuantidade ?? 0) - (atual.quantidade ?? 0)
    const novaQuantidadeOriginal =
      atual.quantidadeOriginal == null ? novaQuantidade : Math.max(0, atual.quantidadeOriginal + delta)

    ofertas.editar(atual.id, {
      tipoRegistro: form.tipoRegistro,
      statusProducao: form.tipoRegistro === 'Position' ? form.statusProducao : null,
      produtoId: Number(form.produtoId),
      fornecedorId: Number(form.fornecedorId),
      precoCusto: { valor: Number(form.valor), moeda: form.moeda, unidade: form.unidade },
      numeroContainers: form.numeroContainers === '' ? null : Number(form.numeroContainers),
      quantidade: novaQuantidade,
      quantidadeOriginal: novaQuantidadeOriginal,
      unidade: form.unidade,
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
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar ${atual.codigo}`}
      footer={<ModalFooterAcoes onCancelar={onClose} formId="editar-oferta-form" labelSalvar="Salvar correção" />}
    >
      <form id="editar-oferta-form" onSubmit={salvar} className="flex flex-col gap-4">
        <p className="rounded-md border border-ayamo-border bg-ayamo-bg px-3 py-2 text-xs text-ayamo-text-mut">
          Isto corrige os dados da versão atual e <strong>não gera uma revisão</strong>. Para uma mudança
          negociada com o fornecedor, use <strong>Registrar revisão</strong> — assim o histórico de preço é preservado.
        </p>

        <Field label="Tipo de registro" required>
          <div className="flex gap-2">
            {['Oferta', 'Position'].map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setForm({ ...form, tipoRegistro: tipo })}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
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
          <Field label="Status de produção">
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Número de contêineres" hint={`${TONELADAS_POR_CONTAINER} ton por contêiner`}>
            <CampoNumerico
              value={form.numeroContainers}
              onChange={(numeroContainers) =>
                setForm({
                  ...form,
                  numeroContainers,
                  quantidade: numeroContainers === '' ? form.quantidade : String(Number(numeroContainers) * TONELADAS_POR_CONTAINER),
                })
              }
            />
          </Field>
          <Field
            label="Quantidade disponível"
            required={form.tipoRegistro === 'Position'}
            hint="Corrigir aqui desloca também a quantidade original, preservando o já vendido."
          >
            <CampoNumerico
              required={form.tipoRegistro === 'Position'}
              value={form.quantidade}
              onChange={(quantidade) => setForm({ ...form, quantidade })}
            />
          </Field>
        </div>

        <Field label="Observação">
          <textarea
            className={inputClass}
            rows={2}
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>

        <SecaoRecolhivel titulo="Dados para o PO" aberturaInicial={false}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Número do contrato">
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
              <Field label="Porto de origem">
                <input className={inputClass} value={form.portoOrigem} onChange={(e) => setForm({ ...form, portoOrigem: e.target.value })} />
              </Field>
              <Field label="Site / planta de fabricação">
                <input className={inputClass} value={form.mfgSite} onChange={(e) => setForm({ ...form, mfgSite: e.target.value })} />
              </Field>
            </div>

            <Field label="Prazo de pagamento">
              <input className={inputClass} value={form.prazoPagamento} onChange={(e) => setForm({ ...form, prazoPagamento: e.target.value })} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Embarque de">
                <CampoData value={form.embarqueDe} onChange={(embarqueDe) => setForm({ ...form, embarqueDe })} />
              </Field>
              <Field label="Embarque até">
                <CampoData value={form.embarqueAte} onChange={(embarqueAte) => setForm({ ...form, embarqueAte })} />
              </Field>
              <Field label="Oferta válida até">
                <CampoData value={form.validadeAte} onChange={(validadeAte) => setForm({ ...form, validadeAte })} />
              </Field>
            </div>

            {entidadesAtivas.length > 0 && (
              <Field label="Entidade Ayamo compradora">
                <select
                  className={inputClass}
                  value={form.ayamoEntidadeId}
                  onChange={(e) => setForm({ ...form, ayamoEntidadeId: e.target.value })}
                >
                  <option value="">—</option>
                  {entidadesAtivas.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.razaoSocial}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </SecaoRecolhivel>
      </form>
    </Modal>
  )
}
