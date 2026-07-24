import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalNovaOferta from './compras/ModalNovaOferta.jsx'
import { formatarPreco, formatarData } from '../utils/formato.js'

const ImportarPlanilha = lazy(() => import('./compras/ImportarPlanilha.jsx'))

const TONE_STATUS = {
  Disponível: 'success',
  'Em revisão': 'warning',
  Esgotada: 'neutral',
  Expirada: 'danger',
}

export default function Compras() {
  const { ofertas, produtos, empresas, divisoes, getDivisaoIdDeProduto, getProduto, getEmpresa } = useData()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [divisaoFiltro, setDivisaoFiltro] = useState('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [importarAberto, setImportarAberto] = useState(false)

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

  return (
    <div>
      <PageHeader title="Compras" actionLabel="Nova oferta" onAction={() => setModalAberto(true)} />

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setImportarAberto((atual) => !atual)}
          className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
        >
          {importarAberto ? 'Fechar importação' : 'Importar planilha de ofertas'}
        </button>
      </div>

      {importarAberto && (
        <div className="mb-4">
          <Suspense fallback={<p className="text-sm text-ayamo-text-mut">Carregando importador...</p>}>
            <ImportarPlanilha />
          </Suspense>
        </div>
      )}

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

      <ModalNovaOferta
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        produtosAtivos={produtosAtivos}
        fornecedores={fornecedores}
        onCriada={(nova) => navigate(`/compras/${nova.codigoBase}`)}
      />
    </div>
  )
}
