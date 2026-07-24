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
import { formatarPreco, formatarData } from '../utils/formato.js'
import { MOEDAS, UNIDADES_PESO } from '../data/unidades.js'

const TONE_STATUS = {
  Disponível: 'success',
  'Em revisão': 'warning',
  Esgotada: 'neutral',
  Expirada: 'danger',
}

function proximoCodigo(ofertas) {
  const numeros = ofertas.map((o) => Number(o.codigoBase.replace('OF-', '')))
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

export default function Compras() {
  const { ofertas, produtos, empresas, divisoes, getDivisaoIdDeProduto, getProduto, getEmpresa, usuarioLogado } = useData()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [divisaoFiltro, setDivisaoFiltro] = useState('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(valoresIniciais())

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')

  const ofertasOrdenadas = useMemo(
    () => [...ofertas.items].sort((a, b) => a.codigoBase.localeCompare(b.codigoBase) || a.versao - b.versao),
    [ofertas.items],
  )

  const ofertasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return ofertasOrdenadas.filter((o) => {
      const produto = getProduto(o.produtoId)
      const combinaBusca = !termo || produto?.nome.toLowerCase().includes(termo)
      const combinaDivisao = !divisaoFiltro || getDivisaoIdDeProduto(o.produtoId) === Number(divisaoFiltro)
      const combinaFornecedor = !fornecedorFiltro || o.fornecedorId === Number(fornecedorFiltro)
      const combinaStatus = !statusFiltro || o.status === statusFiltro
      return combinaBusca && combinaDivisao && combinaFornecedor && combinaStatus
    })
  }, [ofertasOrdenadas, busca, divisaoFiltro, fornecedorFiltro, statusFiltro, getProduto, getDivisaoIdDeProduto])

  function abrirNova() {
    setForm(valoresIniciais())
    setModalAberto(true)
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
    setModalAberto(false)
    navigate(`/compras/${nova.codigoBase}`)
  }

  return (
    <div>
      <PageHeader title="Compras" actionLabel="Nova oferta" onAction={abrirNova} />

      <FilterBar>
        <Field label="Buscar">
          <input className={inputClass} placeholder="Produto" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </Field>
        <Field label="Divisão">
          <select className={inputClass} value={divisaoFiltro} onChange={(e) => setDivisaoFiltro(e.target.value)}>
            <option value="">Todas</option>
            {divisoes.items.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fornecedor">
          <select className={inputClass} value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)}>
            <option value="">Todos</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputClass} value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos</option>
            {Object.keys(TONE_STATUS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      <DataTable
        rowKey="id"
        data={ofertasFiltradas}
        onRowClick={(item) => navigate(`/compras/${item.codigoBase}`)}
        columns={[
          { key: 'codigo', header: 'Código' },
          {
            key: 'produto',
            header: 'Produto',
            render: (item) => getProduto(item.produtoId)?.nome ?? '—',
            sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
          },
          {
            key: 'divisao',
            header: 'Divisão',
            render: (item) => divisoes.items.find((d) => d.id === getDivisaoIdDeProduto(item.produtoId))?.nome ?? '—',
            sortValue: (item) => divisoes.items.find((d) => d.id === getDivisaoIdDeProduto(item.produtoId))?.nome ?? '',
          },
          {
            key: 'fornecedor',
            header: 'Fornecedor',
            render: (item) => getEmpresa(item.fornecedorId)?.nome ?? '—',
            sortValue: (item) => getEmpresa(item.fornecedorId)?.nome ?? '',
          },
          {
            key: 'precoCusto',
            header: 'Preço de custo',
            render: (item) => formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade),
            sortValue: (item) => item.precoCusto.valor,
          },
          { key: 'quantidade', header: 'Quantidade', render: (item) => item.quantidade.toLocaleString('pt-BR') },
          { key: 'unidade', header: 'Unidade' },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
          },
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
        ]}
      />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Nova oferta"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
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
    </div>
  )
}
