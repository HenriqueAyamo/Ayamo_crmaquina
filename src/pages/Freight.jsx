import { useMemo, useState, lazy, Suspense } from 'react'
import { Trash2 } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import SeloValidade from '../components/SeloValidade.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import DisabledActionTooltip from '../components/DisabledActionTooltip.jsx'
import ModalNovoFrete from './freight/ModalNovoFrete.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'
import { chartColor } from '../utils/chartColors.js'
import { totalFreight } from '../utils/frete.js'
import { MOTIVOS, podeExcluirRegistros } from '../utils/permissoes.js'

const ImportarPlanilhaFretes = lazy(() => import('./freight/ImportarPlanilhaFretes.jsx'))

export default function Freight() {
  const { fretes, usuarioLogado } = useData()
  const podeExcluir = podeExcluirRegistros(usuarioLogado.perfil)

  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [importarAberto, setImportarAberto] = useState(false)

  const tiposContainer = useMemo(
    () => [...new Set(fretes.items.map((f) => f.tipoContainer).filter(Boolean))].sort(),
    [fretes.items],
  )

  const fretesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase()
    return fretes.items.filter((f) => {
      const combinaBusca =
        !termo ||
        (f.pol ?? '').toLowerCase().includes(termo) ||
        (f.pod ?? '').toLowerCase().includes(termo) ||
        (f.transportadora ?? '').toLowerCase().includes(termo)
      const combinaTipo = !tipoFiltro || f.tipoContainer === tipoFiltro
      return combinaBusca && combinaTipo
    })
  }, [fretes.items, busca, tipoFiltro])

  const mediaPorRota = useMemo(() => {
    const mapa = new Map()
    fretes.items.forEach((f) => {
      const rota = `${f.pol || '—'} → ${f.pod || '—'}`
      const atual = mapa.get(rota) ?? { soma: 0, n: 0 }
      mapa.set(rota, { soma: atual.soma + totalFreight(f), n: atual.n + 1 })
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

  function excluirFrete(frete) {
    if (!window.confirm(`Excluir o frete ${frete.pol} → ${frete.pod} (${frete.transportadora})? Essa ação não pode ser desfeita.`)) return
    fretes.remover(frete.id)
  }

  return (
    <div>
      <PageHeader title="Freight" subtitle="Tabela de fretes por rota e transportadora" actionLabel="Novo frete" onAction={abrirNovo} />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setImportarAberto((atual) => !atual)}
          className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
        >
          {importarAberto ? 'Fechar importação' : 'Importar planilha'}
        </button>
      </div>

      {importarAberto && (
        <div className="mb-4">
          <Suspense fallback={<p className="text-sm text-ayamo-text-mut">Carregando importador...</p>}>
            <ImportarPlanilhaFretes onImportado={() => setImportarAberto(false)} />
          </Suspense>
        </div>
      )}

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
            placeholder="POL, POD ou armador"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
        <Field label="Tipo de contêiner">
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {tiposContainer.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey="id"
        data={fretesFiltrados}
        onRowClick={(item) => abrirEdicao(item)}
        emptyLabel="Nenhum frete registrado"
        columns={[
          {
            key: 'rota',
            header: 'Rota',
            render: (item) => `${item.pol || '—'} → ${item.pod || '—'}`,
          },
          { key: 'anoTrimestre', header: 'Período', render: (item) => `${item.ano || '—'} ${item.trimestre || ''}` },
          { key: 'mercado', header: 'Market', render: (item) => item.mercado || '—' },
          { key: 'transportadora', header: 'Shipping Line / Agent', render: (item) => item.transportadora || '—' },
          { key: 'tipoContainer', header: 'Contêiner', render: (item) => item.tipoContainer || '—' },
          { key: 'commodity', header: 'Commodity', render: (item) => item.commodity || '—' },
          {
            key: 'total',
            header: 'Total freight',
            render: (item) => formatarValor(totalFreight(item), 'USD'),
            sortValue: (item) => totalFreight(item),
          },
          { key: 'validade', header: 'Vigência até', render: (item) => <SeloValidade validadeAte={item.vigenciaAte} /> },
          { key: 'data', header: 'Registrado em', render: (item) => formatarData(item.data) },
          {
            key: '_acoes',
            header: '',
            render: (item) => (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <DisabledActionTooltip desabilitado={!podeExcluir} motivo={MOTIVOS.excluirRegistro}>
                  <button
                    type="button"
                    disabled={!podeExcluir}
                    onClick={() => excluirFrete(item)}
                    className="rounded p-1 text-ayamo-danger hover:bg-ayamo-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </DisabledActionTooltip>
              </div>
            ),
          },
        ]}
      />

      <ModalNovoFrete open={modalAberto} onClose={() => setModalAberto(false)} editando={editando} />
    </div>
  )
}
