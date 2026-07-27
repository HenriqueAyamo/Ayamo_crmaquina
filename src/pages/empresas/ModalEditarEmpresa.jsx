import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { MOEDAS } from '../../data/unidades.js'

function valoresIniciais(empresa) {
  return {
    nome: empresa.nome,
    pais: empresa.pais,
    endereco: empresa.endereco ?? '',
    sif: empresa.sif ?? '',
    tipo: empresa.tipo,
    responsavelAyamoId: empresa.responsavelAyamoId,
    moedaPadrao: empresa.moedaPadrao,
    limiteCredito: empresa.limiteCredito,
    creditoUtilizado: empresa.creditoUtilizado,
    situacao: empresa.situacao,
  }
}

export default function ModalEditarEmpresa({ open, onClose, empresa }) {
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
      title="Editar empresa"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          <button type="submit" form="empresa-edit-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Salvar
          </button>
        </>
      }
    >
      <form id="empresa-edit-form" onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Nome" required>
          <input className={inputClass} required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label="País" required>
          <input className={inputClass} required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} />
        </Field>
        <Field label="Endereço completo" hint="Usado nos documentos de PO/Proforma">
          <textarea className={inputClass} rows={2} value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </Field>
        <Field label="SIF / número de estabelecimento">
          <input className={inputClass} value={form.sif} onChange={(e) => setForm({ ...form, sif: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo" required>
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Cliente">Cliente</option>
              <option value="Fornecedor">Fornecedor</option>
            </select>
          </Field>
          <Field label="Situação" required>
            <select className={inputClass} value={form.situacao} onChange={(e) => setForm({ ...form, situacao: e.target.value })}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </Field>
        </div>
        <Field label="Responsável Ayamo" required>
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
        <Field label="Moeda padrão de negociação" required>
          <select className={inputClass} required value={form.moedaPadrao} onChange={(e) => setForm({ ...form, moedaPadrao: e.target.value })}>
            {MOEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} — {m.nome}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Limite de crédito" required>
            <CampoNumerico required value={form.limiteCredito} onChange={(limiteCredito) => setForm({ ...form, limiteCredito })} />
          </Field>
          <Field label="Crédito utilizado" required>
            <CampoNumerico required value={form.creditoUtilizado} onChange={(creditoUtilizado) => setForm({ ...form, creditoUtilizado })} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
