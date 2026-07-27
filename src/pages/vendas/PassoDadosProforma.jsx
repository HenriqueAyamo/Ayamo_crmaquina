import { useData } from '../../DataContext.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import { INCOTERMS } from '../../data/unidades.js'

export default function PassoDadosProforma({ dados, onAtualizar }) {
  const { dadosAyamo } = useData()
  const entidadesAtivas = dadosAyamo.items.filter((e) => e.situacao === 'Ativo')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ayamo-text-mut">
        Opcional — usado para gerar a Proforma Invoice depois. Se ficar em branco, dá pra completar mais tarde.
      </p>

      {entidadesAtivas.length > 0 && (
        <Field label="Entidade Ayamo vendedora" hint="Configurável em Cadastros gerais > Dados da Ayamo">
          <select className={inputClass} value={dados.ayamoEntidadeId} onChange={(e) => onAtualizar('ayamoEntidadeId', e.target.value)}>
            {entidadesAtivas.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.razaoSocial}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Número do contrato" hint="Ex.: S12179.1">
          <input className={inputClass} value={dados.numeroContrato} onChange={(e) => onAtualizar('numeroContrato', e.target.value)} />
        </Field>
        <Field label="Incoterm">
          <select className={inputClass} value={dados.incoterm} onChange={(e) => onAtualizar('incoterm', e.target.value)}>
            {INCOTERMS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Porto de destino">
          <input className={inputClass} value={dados.portoDestino} onChange={(e) => onAtualizar('portoDestino', e.target.value)} />
        </Field>
        <Field label="País de destino final">
          <input className={inputClass} value={dados.destinoFinal} onChange={(e) => onAtualizar('destinoFinal', e.target.value)} />
        </Field>
      </div>

      <Field label="Prazo de pagamento" hint="Ex.: 100% TT against copy of original documents">
        <input className={inputClass} value={dados.prazoPagamento} onChange={(e) => onAtualizar('prazoPagamento', e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Embarque de">
          <input
            className={inputClass}
            placeholder="dd/mm/aaaa"
            value={dados.embarqueDe}
            onChange={(e) => onAtualizar('embarqueDe', e.target.value)}
          />
        </Field>
        <Field label="Embarque até">
          <input
            className={inputClass}
            placeholder="dd/mm/aaaa"
            value={dados.embarqueAte}
            onChange={(e) => onAtualizar('embarqueAte', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Consignatário (nome)" hint="Deixe em branco se for o mesmo cliente">
        <input className={inputClass} value={dados.consignatarioNome} onChange={(e) => onAtualizar('consignatarioNome', e.target.value)} />
      </Field>
      <Field label="Consignatário (endereço)">
        <textarea
          className={inputClass}
          rows={2}
          value={dados.consignatarioEndereco}
          onChange={(e) => onAtualizar('consignatarioEndereco', e.target.value)}
        />
      </Field>
    </div>
  )
}
