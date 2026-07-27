import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import NovaPropostaModal from './vendas/NovaPropostaModal.jsx'
import { formatarValor, formatarData, formatarPercentual } from '../utils/formato.js'

const TONE_STATUS = {
  Rascunho: 'neutral',
  Enviada: 'info',
  'Em negociação': 'warning',
  'Aguardando aprovação': 'accent',
  'Aguardando aprovação financeira': 'warning',
  Aceita: 'success',
  Recusada: 'danger',
  Expirada: 'neutral',
}

function nomesProdutos(item, getProduto) {
  return item.itens.map((i) => getProduto(i.produtoId)?.nome ?? '—').join(', ')
}

function toneMargem(margemPercentual, margemMinima) {
  if (margemPercentual < margemMinima) return 'text-ayamo-danger'
  if (margemPercentual < margemMinima + 3) return 'text-ayamo-warning'
  return 'text-ayamo-success'
}

export default function Vendas() {
  const { propostas, empresas, usuarios, getEmpresa, getUsuario, getProduto, calcularResumoProposta } = useData()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [vendedorFiltro, setVendedorFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  const clientes = empresas.items.filter((e) => e.tipo === 'Cliente' && e.situacao === 'Ativo')
  const vendedores = usuarios.items.filter((u) => u.perfil === 'Vendedor' && u.situacao === 'Ativo')

  const propostasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return propostas.items.filter((p) => {
      const combinaBusca = !termo || getEmpresa(p.clienteId)?.nome.toLowerCase().includes(termo)
      const combinaVendedor = !vendedorFiltro || p.vendedorId === Number(vendedorFiltro)
      const combinaStatus = !statusFiltro || p.status === statusFiltro
      return combinaBusca && combinaVendedor && combinaStatus
    })
  }, [propostas.items, busca, vendedorFiltro, statusFiltro, getEmpresa])

  return (
    <div>
      <PageHeader title="Vendas" actionLabel="Nova proposta" onAction={() => setModalAberto(true)} />

      <FilterBar>
        <Field label="Cliente">
          <input className={inputClass} placeholder="Nome do cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </Field>
        <Field label="Vendedor">
          <select className={inputClass} value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)}>
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
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
        storageKey="vendas"
        stickyFirstColumn
        data={propostasFiltradas}
        onRowClick={(item) => navigate(`/vendas/${item.numero}`)}
        columns={[
          { key: 'numero', header: 'Número' },
          {
            key: 'cliente',
            header: 'Cliente',
            render: (item) => getEmpresa(item.clienteId)?.nome ?? '—',
            sortValue: (item) => getEmpresa(item.clienteId)?.nome ?? '',
          },
          {
            key: 'vendedor',
            header: 'Vendedor',
            render: (item) => getUsuario(item.vendedorId)?.nome ?? '—',
            sortValue: (item) => getUsuario(item.vendedorId)?.nome ?? '',
          },
          {
            key: 'produto',
            header: 'Produto',
            render: (item) => nomesProdutos(item, getProduto),
            sortValue: (item) => nomesProdutos(item, getProduto),
          },
          { key: 'itens', header: 'Itens', render: (item) => item.itens.length, sortValue: (item) => item.itens.length },
          {
            key: 'valorTotal',
            header: 'Valor total',
            render: (item) => formatarValor(calcularResumoProposta(item).vendaUSD, 'USD'),
            sortValue: (item) => calcularResumoProposta(item).vendaUSD,
          },
          {
            key: 'margem',
            header: 'Margem %',
            render: (item) => {
              const { margemPercentual } = calcularResumoProposta(item)
              return (
                <span className={`font-medium ${toneMargem(margemPercentual, item.margemMinima)}`}>
                  {formatarPercentual(margemPercentual)}
                </span>
              )
            },
            sortValue: (item) => calcularResumoProposta(item).margemPercentual,
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
          },
          { key: 'dataEnvio', header: 'Data de envio', render: (item) => formatarData(item.dataEnvio) },
        ]}
      />

      <NovaPropostaModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        clientes={clientes}
        onCriada={(numeros) => {
          if (numeros.length === 1) navigate(`/vendas/${numeros[0]}`)
        }}
      />
    </div>
  )
}
