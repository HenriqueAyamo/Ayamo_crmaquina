import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { MOEDAS } from '../../data/unidades.js'
import SecaoCapacidadeProdutos from './SecaoCapacidadeProdutos.jsx'
import SecaoQualificacaoPaises from './SecaoQualificacaoPaises.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

function valoresIniciais(empresa) {
  return {
    nome: empresa.nome,
    pais: empresa.pais,
    endereco: empresa.endereco ?? '',
    cnpj: empresa.cnpj ?? '',
    sif: empresa.sif ?? '',
    marca: empresa.marca ?? '',
    tipo: empresa.tipo,
    responsavelAyamoId: empresa.responsavelAyamoId,
    moedaPadrao: empresa.moedaPadrao,
    limiteCredito: empresa.limiteCredito,
    creditoUtilizado: empresa.creditoUtilizado,
    situacao: empresa.situacao,
    produtosCapacidade: empresa.produtosCapacidade ?? [],
    qualificacoesPaises: empresa.qualificacoesPaises ?? {},
  }
}

export default function ModalEditarEmpresa({ open, onClose, empresa }) {
  const { t } = useI18n()
  const { empresas, usuarios } = useData()
  const [form, setForm] = useState(valoresIniciais(empresa))

  useEffect(() => {
    if (open) setForm(valoresIniciais(empresa))
  }, [open, empresa])

  const responsaveis = usuarios.items.filter((u) => u.situacao === 'Ativo' || u.id === empresa.responsavelAyamoId)

  function salvar(e) {
    e.preventDefault()
    empresas.editar(empresa.id, {
      ...form,
      responsavelAyamoId: Number(form.responsavelAyamoId),
      limiteCredito: Number(form.limiteCredito),
      creditoUtilizado: Number(form.creditoUtilizado),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('modal.tituloEditarEmpresa')}
      footer={<ModalFooterAcoes onCancelar={onClose} formId="empresa-edit-form" />}
    >
      <form id="empresa-edit-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label={t('campo.nome')} required>
          <input className={inputClass} required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label={t('campo.pais')} required>
          <input className={inputClass} required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
        </Field>
        <Field label={t('campo.enderecoCompleto')} hint="Usado nos documentos de PO/Proforma">
          <textarea className={inputClass} rows={2} value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('campo.cnpj')}>
            <input className={inputClass} value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </Field>
          <Field label={t('campo.sif')}>
            <input className={inputClass} value={form.sif} onChange={(e) => setForm({ ...form, sif: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('campo.tipo')} required>
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Cliente">Cliente</option>
              <option value="Fornecedor">Fornecedor</option>
            </select>
          </Field>
          <Field label={t('campo.situacao')} required>
            <select className={inputClass} value={form.situacao} onChange={(e) => setForm({ ...form, situacao: e.target.value })}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </Field>
        </div>
        <Field label={t('campo.responsavelAyamo')} required>
          <select
            className={inputClass}
            required
            value={form.responsavelAyamoId}
            onChange={(e) => setForm({ ...form, responsavelAyamoId: e.target.value })}
          >
            {responsaveis.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('campo.moedaPadrao')} required>
          <select className={inputClass} required value={form.moedaPadrao} onChange={(e) => setForm({ ...form, moedaPadrao: e.target.value })}>
            {MOEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} — {m.nome}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('campo.limiteCredito')} required>
            <CampoNumerico required value={form.limiteCredito} onChange={(limiteCredito) => setForm({ ...form, limiteCredito })} />
          </Field>
          <Field label={t('campo.creditoUtilizado')} required>
            <CampoNumerico required value={form.creditoUtilizado} onChange={(creditoUtilizado) => setForm({ ...form, creditoUtilizado })} />
          </Field>
        </div>

        {form.tipo === 'Fornecedor' && (
          <>
            <Field label={t('campo.marca')} hint="Usada nos documentos de PO/Proforma. Se em branco, usa o nome do fornecedor.">
              <input className={inputClass} value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
            </Field>
            <SecaoCapacidadeProdutos
              value={form.produtosCapacidade}
              onChange={(produtosCapacidade) => setForm({ ...form, produtosCapacidade })}
            />
            <SecaoQualificacaoPaises
              value={form.qualificacoesPaises}
              onChange={(qualificacoesPaises) => setForm({ ...form, qualificacoesPaises })}
            />
          </>
        )}
      </form>
    </Modal>
  )
}
