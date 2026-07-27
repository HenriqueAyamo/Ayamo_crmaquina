import { useMemo, useState } from 'react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import DataTable from '../components/DataTable.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import SeloValidade from '../components/SeloValidade.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalNovoFrete from './freight/ModalNovoFrete.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'
import { TIPOS_CONTAINER } from '../data/tiposContainer.js'
import { chartColor } from '../utils/chartColors.js'
import { converterParaUSD } from '../data/cambio.js'

export default function Freight() {
  const { fretes } = useData()

  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const fretesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase()
    return fretes.items.filter((f) => {
      const combinaBusca =
        !termo ||
        f.origem.toLowerCase().includes(termo) ||
        f.destino.toLowerCase().includes(termo) ||
        f.transportadora.toLowerCase().includes(termo)
      const combinaTipo = !tipoFiltro || f.tipoContainer === tipoFiltro
      return combinaBusca && combinaTipo
    })
  }, [fretes.items, busca, tipoFiltro])

  const mediaPorRota = useMemo(() => {
    const mapa = new Map()
    fretes.items.forEach((f) => {
      const rota = `${f.origem} → ${f.destino}`
      const valorUSD = converterParaUSD(f.valor.valor, f.valor.moeda)
      const atual = mapa.get(rota) ?? { soma: 0, n: 0 }
      mapa.set(rota, { soma: atual.soma + valorUSD, n: atual.n + 1 })
    })
    return [...mapa.entries()]
      .map(([rotulo, { soma, n }], indice) => ({ rotulo, valor: Math.round(soma / n), cor: chartColor(indice) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
  }, [fretes.items])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(frete) {
    setEditando(frete)
    setModalAberto(true)
  }

  return (
    <div>
      <PageHeader title="Freight" subtitle="Tabela de fretes por rota e transportadora" actionLabel="Novo frete" onAction={abrirNovo} />

      {mediaPorRota.length > 0 && (
        <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Frete médio por rota (USD)</h2>
          <BarraRanking linhas={mediaPorRota} formatarValor={(v) => formatarValor(v, 'USD')} />
        </div>
      )}

      <FilterBar>
        <Field label="Buscar">
          <input
            className={inputClass}
            placeholder="Origem, destino ou transportadora"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
        <Field label="Tipo de contêiner">
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS_CONTAINER.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      <DataTable
        rowKey="id"
        storageKey="fretes"
        data={fretesFiltrados}
        onRowClick={(item) => abrirEdicao(item)}
        emptyLabel="Nenhum frete registrado"
        columns={[
          { key: 'origem', header: 'Origem', toggleable: false },
          { key: 'destino', header: 'Destino', toggleable: false },
          { key: 'transportadora', header: 'Transportadora' },
          { key: 'tipoContainer', header: 'Contêiner' },
          {
            key: 'valor',
            header: 'Valor',
            render: (item) => formatarValor(item.valor.valor, item.valor.moeda),
            sortValue: (item) => item.valor.valor,
          },
          { key: 'validade', header: 'Validade', render: (item) => <SeloValidade validadeAte={item.validadeAte} /> },
          { key: 'data', header: 'Registrado em', render: (item) => formatarData(item.data) },
        ]}
      />

      <ModalNovoFrete open={modalAberto} onClose={() => setModalAberto(false)} editando={editando} />
    </div>
  )
}
