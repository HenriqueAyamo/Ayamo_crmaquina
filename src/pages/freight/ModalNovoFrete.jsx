import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import CampoData from '../../components/CampoData.jsx'
import SelectOuDigite from '../../components/SelectOuDigite.jsx'
import { formatarValor } from '../../utils/formato.js'
import { CAMPOS_CUSTO_FRETE } from '../../utils/frete.js'

const TRIMESTRES = ['Q1', 'Q2', 'Q3', 'Q4']
const CAMPOS_CUSTO = CAMPOS_CUSTO_FRETE

function valoresIniciais() {
  return {
    ano: String(new Date().getFullYear()),
    trimestre: TRIMESTRES[0],
    mercado: '',
    pol: '',
    pod: '',
    tipoContainer: '',
    transportadora: '',
    commodity: '',
    contrato: '',
    custoFreight: '',
    custoBaf: '',
    custoEfsPssGri: '',
    custoOutrasTaxas: '',
    custoCrossTrade: '',
    custoReeferMonitoring: '',
    origemFreeTime: '',
    destinoFreeTime: '',
    vigenciaDe: '',
    vigenciaAte: '',
    observacao: '',
  }
}

export default function ModalNovoFrete({ open, onClose, editando }) {
  const { fretes, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())

  const sugestoes = useMemo(() => {
    const distintos = (chave) => fretes.items.map((f) => f[chave]).filter(Boolean)
    return {
      mercado: distintos('mercado'),
      pol: distintos('pol'),
      pod: distintos('pod'),
      tipoContainer: distintos('tipoContainer'),
      transportadora: distintos('transportadora'),
      commodity: distintos('commodity'),
      contrato: distintos('contrato'),
      origemFreeTime: distintos('origemFreeTime'),
      destinoFreeTime: distintos('destinoFreeTime'),
    }
  }, [fretes.items])

  useEffect(() => {
    if (!open) return
    if (editando) {
      setForm({
        ano: editando.ano ?? '',
        trimestre: editando.trimestre ?? TRIMESTRES[0],
        mercado: editando.mercado ?? '',
        pol: editando.pol ?? '',
        pod: editando.pod ?? '',
        tipoContainer: editando.tipoContainer ?? '',
        transportadora: editando.transportadora ?? '',
        commodity: editando.commodity ?? '',
        contrato: editando.contrato ?? '',
        custoFreight: editando.custoFreight ?? '',
        custoBaf: editando.custoBaf ?? '',
        custoEfsPssGri: editando.custoEfsPssGri ?? '',
        custoOutrasTaxas: editando.custoOutrasTaxas ?? '',
        custoCrossTrade: editando.custoCrossTrade ?? '',
        custoReeferMonitoring: editando.custoReeferMonitoring ?? '',
        origemFreeTime: editando.origemFreeTime ?? '',
        destinoFreeTime: editando.destinoFreeTime ?? '',
        vigenciaDe: editando.vigenciaDe ?? '',
        vigenciaAte: editando.vigenciaAte ?? '',
        observacao: editando.observacao ?? '',
      })
    } else {
      setForm(valoresIniciais())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  const totalCalculado = CAMPOS_CUSTO.reduce((soma, { chave }) => soma + Number(form[chave] || 0), 0)

  function salvar(e) {
    e.preventDefault()
    const dados = {
      ano: form.ano,
      trimestre: form.trimestre,
      mercado: form.mercado,
      pol: form.pol,
      pod: form.pod,
      tipoContainer: form.tipoContainer,
      transportadora: form.transportadora,
      commodity: form.commodity,
      contrato: form.contrato,
      custoFreight: Number(form.custoFreight) || 0,
      custoBaf: Number(form.custoBaf) || 0,
      custoEfsPssGri: Number(form.custoEfsPssGri) || 0,
      custoOutrasTaxas: Number(form.custoOutrasTaxas) || 0,
      custoCrossTrade: Number(form.custoCrossTrade) || 0,
      custoReeferMonitoring: Number(form.custoReeferMonitoring) || 0,
      origemFreeTime: form.origemFreeTime,
      destinoFreeTime: form.destinoFreeTime,
      vigenciaDe: form.vigenciaDe,
      vigenciaAte: form.vigenciaAte,
      observacao: form.observacao,
    }
    if (editando) fretes.editar(editando.id, dados)
    else fretes.criar({ ...dados, usuarioId: usuarioLogado.id, data: new Date().toISOString().slice(0, 10) })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar frete' : 'Novo frete'}
      width="lg"
      footer={<ModalFooterAcoes onCancelar={onClose} formId="frete-form" />}
    >
      <form id="frete-form" onSubmit={salvar} className="flex flex-col gap-4">
        <p className="text-sm text-ayamo-text-mut">
          Total Freight é calculado automaticamente somando Freight, BAF, EFS/PSS/GRI, Outras taxas, Cross trade e Reefer
          Monitoring.
        </p>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ayamo-primary">Rota &amp; Contrato</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Year">
              <input className={inputClass} value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} />
            </Field>
            <Field label="Quarter">
              <select className={inputClass} value={form.trimestre} onChange={(e) => setForm({ ...form, trimestre: e.target.value })}>
                {TRIMESTRES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Market">
              <SelectOuDigite value={form.mercado} onChange={(mercado) => setForm({ ...form, mercado })} opcoes={sugestoes.mercado} />
            </Field>
            <Field label="POL">
              <SelectOuDigite value={form.pol} onChange={(pol) => setForm({ ...form, pol })} opcoes={sugestoes.pol} />
            </Field>
            <Field label="POD">
              <SelectOuDigite value={form.pod} onChange={(pod) => setForm({ ...form, pod })} opcoes={sugestoes.pod} />
            </Field>
            <Field label="Container Type">
              <SelectOuDigite
                value={form.tipoContainer}
                onChange={(tipoContainer) => setForm({ ...form, tipoContainer })}
                opcoes={sugestoes.tipoContainer}
              />
            </Field>
            <Field label="Shipping Line / Agent">
              <SelectOuDigite
                value={form.transportadora}
                onChange={(transportadora) => setForm({ ...form, transportadora })}
                opcoes={sugestoes.transportadora}
              />
            </Field>
            <Field label="Commodity">
              <SelectOuDigite value={form.commodity} onChange={(commodity) => setForm({ ...form, commodity })} opcoes={sugestoes.commodity} />
            </Field>
            <Field label="Contract">
              <SelectOuDigite value={form.contrato} onChange={(contrato) => setForm({ ...form, contrato })} opcoes={sugestoes.contrato} />
            </Field>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ayamo-primary">Valores (USD)</h3>
          <div className="grid grid-cols-3 gap-3">
            {CAMPOS_CUSTO.map(({ chave, label }) => (
              <Field key={chave} label={label}>
                <CampoNumerico value={form[chave]} onChange={(valor) => setForm({ ...form, [chave]: valor })} />
              </Field>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded border border-ayamo-border bg-ayamo-bg px-4 py-3">
            <span className="text-sm font-medium text-ayamo-text">Total freight</span>
            <span className="text-base font-semibold text-ayamo-primary">{formatarValor(totalCalculado, 'USD')}</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ayamo-primary">Prazos &amp; Vigência</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Origin free time" hint="ex.: 14 dias">
              <SelectOuDigite
                value={form.origemFreeTime}
                onChange={(origemFreeTime) => setForm({ ...form, origemFreeTime })}
                opcoes={sugestoes.origemFreeTime}
              />
            </Field>
            <Field label="Destination free time" hint="ex.: 10 dias">
              <SelectOuDigite
                value={form.destinoFreeTime}
                onChange={(destinoFreeTime) => setForm({ ...form, destinoFreeTime })}
                opcoes={sugestoes.destinoFreeTime}
              />
            </Field>
            <div />
            <Field label="Validity from">
              <CampoData value={form.vigenciaDe} onChange={(vigenciaDe) => setForm({ ...form, vigenciaDe })} />
            </Field>
            <Field label="Validity to">
              <CampoData value={form.vigenciaAte} onChange={(vigenciaAte) => setForm({ ...form, vigenciaAte })} />
            </Field>
          </div>
        </div>

        <Field label="Comments">
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
