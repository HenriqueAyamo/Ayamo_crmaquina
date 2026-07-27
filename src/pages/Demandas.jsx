import { useMemo, useState } from 'react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalNovaDemanda from './demandas/ModalNovaDemanda.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'

const TONE_STATUS = { Aberta: 'info', Atendida: 'success', Cancelada: 'neutral' }

export default function Demandas() {
  const { demandas, ofertas, empresas, produtos, getProduto, getEmpresa } = useData()

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Aberta')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const clientes = empresas.items.filter((e) => e.tipo === 'Cliente' && e.situacao === 'Ativo')
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')

  const demandasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return demandas.items.filter((d) => {
      const combinaBusca = !termo || getProduto(d.produtoId)?.nome.toLowerCase().includes(termo)
      const combinaStatus = !statusFiltro || d.status === statusFiltro
      return combinaBusca && combinaStatus
    })
  }, [demandas.items, busca, statusFiltro, getProduto])

  function contarOfertasCompativeis(produtoId) {
    return ofertas.items.filter((o) => o.produtoId === produtoId && o.status === 'Disponível').length
  }

  function abrirNova() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(demanda) {
    setEditando(demanda)
    setModalAberto(true)
  }

  return (
    <div>
      <PageHeader title="Demandas" subtitle="O que os clientes estão procurando comprar" actionLabel="Nova demanda" onAction={abrirNova} />

      <FilterBar>
        <Field label="Buscar">
          <input className={inputClass} placeholder="Produto" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="Aberta">Aberta</option>
            <option value="Atendida">Atendida</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </Field>
      </FilterBar>

      <DataTable
        rowKey="id"
        data={demandasFiltradas}
        onRowClick={(item) => abrirEdicao(item)}
        emptyLabel="Nenhuma demanda registrada"
        columns={[
          {
            key: 'cliente',
            header: 'Cliente',
            render: (item) => getEmpresa(item.clienteId)?.nome ?? '—',
            sortValue: (item) => getEmpresa(item.clienteId)?.nome ?? '',
          },
          {
            key: 'produto',
            header: 'Produto',
            render: (item) => getProduto(item.produtoId)?.nome ?? '—',
            sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
          },
          { key: 'quantidade', header: 'Volume', render: (item) => `${item.quantidade.toLocaleString('pt-BR')} MT` },
          {
            key: 'precoAlvo',
            header: 'Preço alvo',
            render: (item) => (item.precoAlvo ? formatarValor(item.precoAlvo.valor, item.precoAlvo.moeda) : '—'),
          },
          { key: 'incoterm', header: 'Incoterm' },
          { key: 'destino', header: 'Destino', render: (item) => item.destino || '—' },
          { key: 'mesEmbarque', header: 'Embarque', render: (item) => item.mesEmbarque || '—' },
          {
            key: 'ofertasCompativeis',
            header: 'Ofertas compatíveis',
            render: (item) => {
              const n = contarOfertasCompativeis(item.produtoId)
              return <span className={n > 0 ? 'font-medium text-ayamo-success' : 'text-ayamo-text-mut'}>{n}</span>
            },
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
          },
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
          {
            key: '_acoes',
            header: '',
            render: (item) => (
              <div className="flex justify-end gap-3 text-sm" onClick={(e) => e.stopPropagation()}>
                {item.status === 'Aberta' && (
                  <>
                    <button
                      type="button"
                      onClick={() => demandas.editar(item.id, { status: 'Atendida' })}
                      className="text-ayamo-success hover:underline"
                    >
                      Atendida
                    </button>
                    <button
                      type="button"
                      onClick={() => demandas.editar(item.id, { status: 'Cancelada' })}
                      className="text-ayamo-danger hover:underline"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      <ModalNovaDemanda
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        clientes={clientes}
        produtosAtivos={produtosAtivos}
        editando={editando}
      />
    </div>
  )
}
