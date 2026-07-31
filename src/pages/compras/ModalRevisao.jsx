import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import CampoData from '../../components/CampoData.jsx'
import SecaoRecolhivel from '../../components/SecaoRecolhivel.jsx'
import { MOEDAS, INCOTERMS } from '../../data/unidades.js'
import { STATUS_PRODUCAO } from '../../data/statusProducao.js'

function valoresPO(atual) {
  return {
    numeroContrato: atual.numeroContrato ?? '',
    incoterm: atual.incoterm ?? 'CFR',
    portoOrigem: atual.portoOrigem ?? '',
    prazoPagamento: atual.prazoPagamento ?? '',
    embarqueDe: atual.embarqueDe ?? '',
    embarqueAte: atual.embarqueAte ?? '',
    mfgSite: atual.mfgSite ?? '',
    validadeAte: atual.validadeAte ?? '',
    ayamoEntidadeId: atual.ayamoEntidadeId ?? '',
  }
}

export default function ModalRevisao({ open, onClose, atual }) {
  const { registrarRevisaoOferta, dadosAyamo } = useData()
  const entidadesAtivas = dadosAyamo.items.filter((e) => e.situacao === 'Ativo')

  const [tipoRegistro, setTipoRegistro] = useState(atual.tipoRegistro ?? 'Position')
  const [statusProducao, setStatusProducao] = useState(atual.statusProducao ?? 'Pronto para embarque')
  const [valor, setValor] = useState('')
  const [moeda, setMoeda] = useState(atual.precoCusto.moeda)
  const [quantidade, setQuantidade] = useState(atual.quantidade ?? '')
  const [status, setStatus] = useState('Disponível')
  const [observacao, setObservacao] = useState('')
  const [dadosPO, setDadosPO] = useState(valoresPO(atual))

  function fecharEResetar() {
    setTipoRegistro(atual.tipoRegistro ?? 'Position')
    setStatusProducao(atual.statusProducao ?? 'Pronto para embarque')
    setValor('')
    setMoeda(atual.precoCusto.moeda)
    setQuantidade(atual.quantidade ?? '')
    setStatus('Disponível')
    setObservacao('')
    setDadosPO(valoresPO(atual))
    onClose()
  }

  function salvar(e) {
    e.preventDefault()
    registrarRevisaoOferta(atual, {
      tipoRegistro,
      statusProducao: tipoRegistro === 'Position' ? statusProducao : null,
      valor: Number(valor),
      moeda,
      quantidade: quantidade === '' ? null : Number(quantidade),
      status,
      observacao,
      ...dadosPO,
    })
    fecharEResetar()
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title="Registrar revisão de preço"
      footer={<ModalFooterAcoes onCancelar={fecharEResetar} formId="revisao-form" labelSalvar="Registrar" />}
    >
      <form id="revisao-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Tipo de registro" required hint="Oferta = ainda em negociação com o fornecedor. Position = compra já fechada.">
          <div className="flex gap-2">
            {['Oferta', 'Position'].map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoRegistro(tipo)}
                className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                  tipoRegistro === tipo
                    ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary'
                    : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </Field>

        {tipoRegistro === 'Position' && (
          <Field label="Status de produção" hint="Nem toda Position já está pronta — pode ser um pedido que só fica pronto depois.">
            <select className={inputClass} value={statusProducao} onChange={(e) => setStatusProducao(e.target.value)}>
              {STATUS_PRODUCAO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Field label="Novo preço" required>
            <CampoNumerico required value={valor} onChange={setValor} />
          </Field>
          <Field label="Moeda" required>
            <select className={inputClass} value={moeda} onChange={(e) => setMoeda(e.target.value)}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade" required={tipoRegistro === 'Position'} hint={tipoRegistro === 'Oferta' ? 'Opcional' : undefined}>
            <CampoNumerico required={tipoRegistro === 'Position'} value={quantidade} onChange={setQuantidade} />
          </Field>
        </div>
        <Field label="Status da revisão" required>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Disponível">Disponível</option>
            <option value="Em revisão">Em revisão</option>
            <option value="Esgotada">Esgotada</option>
            <option value="Expirada">Expirada</option>
          </select>
        </Field>
        <Field label="Observação">
          <textarea className={inputClass} rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>

        <SecaoRecolhivel titulo="Dados para o PO (opcional)" aberturaInicial={false}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Número do contrato">
                <input
                  className={inputClass}
                  value={dadosPO.numeroContrato}
                  onChange={(e) => setDadosPO({ ...dadosPO, numeroContrato: e.target.value })}
                />
              </Field>
              <Field label="Incoterm">
                <select className={inputClass} value={dadosPO.incoterm} onChange={(e) => setDadosPO({ ...dadosPO, incoterm: e.target.value })}>
                  {INCOTERMS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Porto de origem">
              <input className={inputClass} value={dadosPO.portoOrigem} onChange={(e) => setDadosPO({ ...dadosPO, portoOrigem: e.target.value })} />
            </Field>

            <Field label="Prazo de pagamento">
              <input
                className={inputClass}
                value={dadosPO.prazoPagamento}
                onChange={(e) => setDadosPO({ ...dadosPO, prazoPagamento: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Embarque de">
                <CampoData value={dadosPO.embarqueDe} onChange={(embarqueDe) => setDadosPO({ ...dadosPO, embarqueDe })} />
              </Field>
              <Field label="Embarque até">
                <CampoData value={dadosPO.embarqueAte} onChange={(embarqueAte) => setDadosPO({ ...dadosPO, embarqueAte })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Site / planta de fabricação">
                <input className={inputClass} value={dadosPO.mfgSite} onChange={(e) => setDadosPO({ ...dadosPO, mfgSite: e.target.value })} />
              </Field>
              <Field label="Oferta válida até">
                <CampoData value={dadosPO.validadeAte} onChange={(validadeAte) => setDadosPO({ ...dadosPO, validadeAte })} />
              </Field>
            </div>

            {entidadesAtivas.length > 0 && (
              <Field label="Entidade Ayamo compradora">
                <select
                  className={inputClass}
                  value={dadosPO.ayamoEntidadeId}
                  onChange={(e) => setDadosPO({ ...dadosPO, ayamoEntidadeId: e.target.value })}
                >
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
