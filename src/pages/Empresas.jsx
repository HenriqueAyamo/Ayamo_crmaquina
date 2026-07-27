import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import CampoNumerico from '../components/CampoNumerico.jsx'
import { formatarValor } from '../utils/formato.js'
import { MOEDAS } from '../data/unidades.js'
import { contarAprovacoes } from '../data/qualificacaoPaises.js'

const TONE_SITUACAO = { Ativo: 'success', Inativo: 'neutral', Bloqueado: 'danger' }

function valoresIniciais() {
  return {
    nome: '',
    pais: '',
    endereco: '',
    sif: '',
    tipo: 'Cliente',
    responsavelAyamoId: '',
    moedaPadrao: '',
    limiteCredito: 0,
    creditoUtilizado: 0,
  }
}

export default function Empresas() {
  const { empresas, usuarios, getUsuario } = useData()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [situacaoFiltro, setSituacaoFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(valoresIniciais())

  const responsaveis = usuarios.items.filter((u) => u.situacao === 'Ativo')

  const empresasFiltradas = useMemo(() => {
    return empresas.items.filter((e) => {
      const combinaBusca = e.nome.toLowerCase().includes(busca.toLowerCase())
      const combinaTipo = !tipoFiltro || e.tipo === tipoFiltro
      const combinaSituacao = !situacaoFiltro || e.situacao === situacaoFiltro
      return combinaBusca && combinaTipo && combinaSituacao
    })
  }, [empresas.items, busca, tipoFiltro, situacaoFiltro])

  function abrirNova() {
    setForm(valoresIniciais())
    setModalAberto(true)
  }

  function salvar(e) {
    e.preventDefault()
    const nova = empresas.criar({
      ...form,
      responsavelAyamoId: Number(form.responsavelAyamoId),
      limiteCredito: Number(form.limiteCredito),
      creditoUtilizado: Number(form.creditoUtilizado),
    })
    setModalAberto(false)
    navigate(`/empresas/${nova.id}`)
  }

  return (
    <div>
      <PageHeader title="Empresas" actionLabel="Nova empresa" onAction={abrirNova} />

      <FilterBar>
        <Field label="Buscar">
          <input
            className={inputClass}
            placeholder="Nome da empresa"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
        <Field label="Tipo">
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="Fornecedor">Fornecedor</option>
            <option value="Cliente">Cliente</option>
          </select>
        </Field>
        <Field label="Situação">
          <select className={inputClass} value={situacaoFiltro} onChange={(e) => setSituacaoFiltro(e.target.value)}>
            <option value="">Todas</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Bloqueado">Bloqueado</option>
          </select>
        </Field>
      </FilterBar>

      <DataTable
        rowKey="id"
        onRowClick={(item) => navigate(`/empresas/${item.id}`)}
        data={empresasFiltradas}
        columns={[
          { key: 'nome', header: 'Nome' },
          { key: 'pais', header: 'País' },
          {
            key: 'responsavel',
            header: 'Responsável Ayamo',
            render: (item) => getUsuario(item.responsavelAyamoId)?.nome ?? '—',
            sortValue: (item) => getUsuario(item.responsavelAyamoId)?.nome ?? '',
          },
          { key: 'moedaPadrao', header: 'Moeda padrão' },
          {
            key: 'qualificacoes',
            header: 'Qualificações',
            render: (item) => {
              if (item.tipo !== 'Fornecedor') return '—'
              const { emAndamentoOuAprovado, total } = contarAprovacoes(item.qualificacoesPaises)
              return `${emAndamentoOuAprovado}/${total}`
            },
          },
          { key: 'limiteCredito', header: 'Limite de crédito', render: (item) => formatarValor(item.limiteCredito, item.moedaPadrao) },
          { key: 'creditoUtilizado', header: 'Crédito utilizado', render: (item) => formatarValor(item.creditoUtilizado, item.moedaPadrao) },
          {
            key: 'situacao',
            header: 'Situação',
            render: (item) => <StatusBadge label={item.situacao} tone={TONE_SITUACAO[item.situacao] ?? 'neutral'} />,
          },
        ]}
      />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Nova empresa"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="empresa-form"
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Salvar
            </button>
          </>
        }
      >
        <form id="empresa-form" onSubmit={salvar} className="flex flex-col gap-4">
          <Field label="Nome" required>
            <input
              className={inputClass}
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Field>
          <Field label="País" required>
            <input
              className={inputClass}
              required
              value={form.pais}
              onChange={(e) => setForm({ ...form, pais: e.target.value })}
            />
          </Field>
          <Field label="Endereço completo" hint="Usado nos documentos de PO/Proforma">
            <textarea
              className={inputClass}
              rows={2}
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </Field>
          <Field label="SIF / número de estabelecimento" hint="Se for fornecedor, usado no documento para o cliente final">
            <input className={inputClass} value={form.sif} onChange={(e) => setForm({ ...form, sif: e.target.value })} />
          </Field>
          <Field label="Tipo" required>
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Cliente">Cliente</option>
              <option value="Fornecedor">Fornecedor</option>
            </select>
          </Field>
          <Field label="Responsável Ayamo" required>
            <select
              className={inputClass}
              required
              value={form.responsavelAyamoId}
              onChange={(e) => setForm({ ...form, responsavelAyamoId: e.target.value })}
            >
              <option value="">Selecione</option>
              {responsaveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Moeda padrão de negociação" required>
            <select
              className={inputClass}
              required
              value={form.moedaPadrao}
              onChange={(e) => setForm({ ...form, moedaPadrao: e.target.value })}
            >
              <option value="">Selecione</option>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo} — {m.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Limite de crédito" required>
            <CampoNumerico required value={form.limiteCredito} onChange={(limiteCredito) => setForm({ ...form, limiteCredito })} />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
