import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import BarraEstoque from '../components/BarraEstoque.jsx'
import SeloValidade from '../components/SeloValidade.jsx'
import PopoverContato from '../components/PopoverContato.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalNovaOferta from './compras/ModalNovaOferta.jsx'
import ModalNovaOfertaAgrupada from './compras/ModalNovaOfertaAgrupada.jsx'
import HistoricoPreco from './compras/HistoricoPreco.jsx'
import { formatarPreco, formatarData } from '../utils/formato.js'
import { exportarOfertasExcel } from '../utils/exportarOfertas.js'
import { obterOfertasAtuais } from '../utils/ofertasAtuais.js'
import { TONE_STATUS_PRODUCAO } from '../data/statusProducao.js'

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
  const [produtoFiltro, setProdutoFiltro] = useState('')
  const [divisaoFiltro, setDivisaoFiltro] = useState('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalAgrupadaAberto, setModalAgrupadaAberto] = useState(false)
  const [importarAberto, setImportarAberto] = useState(false)
  const [aba, setAba] = useState('ofertas')

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')

  const ofertasAtuais = useMemo(() => obterOfertasAtuais(ofertas.items), [ofertas.items])

  const ofertasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return ofertasAtuais.filter((o) => {
      const produto = getProduto(o.produtoId)
      const combinaBusca = !termo || produto?.nome.toLowerCase().includes(termo)
      const combinaProduto = !produtoFiltro || o.produtoId === Number(produtoFiltro)
      const combinaDivisao = !divisaoFiltro || getDivisaoIdDeProduto(o.produtoId) === Number(divisaoFiltro)
      const combinaFornecedor = !fornecedorFiltro || o.fornecedorId === Number(fornecedorFiltro)
      const combinaStatus = !statusFiltro || o.status === statusFiltro
      const combinaTipo = !tipoFiltro || (o.tipoRegistro ?? 'Position') === tipoFiltro
      return combinaBusca && combinaProduto && combinaDivisao && combinaFornecedor && combinaStatus && combinaTipo
    })
  }, [ofertasAtuais, busca, produtoFiltro, divisaoFiltro, fornecedorFiltro, statusFiltro, tipoFiltro, getProduto, getDivisaoIdDeProduto])

  return (
    <div>
      <PageHeader title="Compras" actionLabel="Nova oferta" onAction={() => setModalAberto(true)} />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 border-b border-ayamo-border">
          {[
            { id: 'ofertas', label: 'Ofertas' },
            { id: 'precos', label: 'Histórico de preço' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAba(t.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                aba === t.id ? 'border-ayamo-primary text-ayamo-primary' : 'border-transparent text-ayamo-text-mut hover:text-ayamo-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {aba === 'ofertas' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModalAgrupadaAberto(true)}
              className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
            >
              Oferta mix container
            </button>
            <button
              type="button"
              onClick={() => setImportarAberto((atual) => !atual)}
              className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
            >
              {importarAberto ? 'Fechar importação' : 'Importar planilha'}
            </button>
            <button
              type="button"
              onClick={() => exportarOfertasExcel(ofertasFiltradas, { getProduto, getEmpresa })}
              className="flex items-center gap-1.5 rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
            >
              <Download size={14} />
              Exportar Excel
            </button>
          </div>
        )}
      </div>

      {aba === 'precos' && <HistoricoPreco />}

      {aba === 'ofertas' && (
        <>
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
            <Field label="Produto">
              <select className={inputClass} value={produtoFiltro} onChange={(e) => setProdutoFiltro(e.target.value)}>
                <option value="">Todos</option>
                {produtosAtivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo">
              <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="Oferta">Oferta</option>
                <option value="Position">Position</option>
              </select>
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

          <CardList
            rowKey="id"
            storageKey="compras"
            stickyFirstColumn
            data={ofertasFiltradas}
            onRowClick={(item) => navigate(`/compras/${item.codigoBase}`)}
            columns={[
              { key: 'codigo', header: 'Código' },
              {
                key: 'tipoRegistro',
                header: 'Tipo',
                toggleable: false,
                render: (item) => (
                  <StatusBadge label={item.tipoRegistro ?? 'Position'} tone={(item.tipoRegistro ?? 'Position') === 'Position' ? 'info' : 'accent'} />
                ),
              },
              {
                key: 'produto',
                header: 'Produto',
                render: (item) => getProduto(item.produtoId)?.nome ?? '—',
                sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
              },
              {
                key: 'proteina',
                header: 'Proteína %',
                render: (item) => (getProduto(item.produtoId)?.proteinaPercentual ? `${getProduto(item.produtoId).proteinaPercentual}%` : '—'),
              },
              {
                key: 'fornecedor',
                header: 'Fornecedor',
                render: (item) => (
                  <PopoverContato empresaId={item.fornecedorId}>{getEmpresa(item.fornecedorId)?.nome ?? '—'}</PopoverContato>
                ),
                sortValue: (item) => getEmpresa(item.fornecedorId)?.nome ?? '',
              },
              { key: 'mfgSite', header: 'Site de fabricação', render: (item) => item.mfgSite || '—' },
              {
                key: 'precoCusto',
                header: 'Preço de custo',
                render: (item) => formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade),
                sortValue: (item) => item.precoCusto.valor,
              },
              {
                key: 'quantidade',
                header: 'Vendido / restante',
                render: (item) =>
                  item.quantidade == null ? (
                    <span className="text-ayamo-text-mut">A definir</span>
                  ) : (
                    <BarraEstoque total={item.quantidadeOriginal ?? item.quantidade} restante={item.quantidade} unidade={item.unidade} />
                  ),
                sortValue: (item) => item.quantidade,
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
              },
              {
                key: 'statusProducao',
                header: 'Produção',
                render: (item) =>
                  item.statusProducao ? (
                    <StatusBadge label={item.statusProducao} tone={TONE_STATUS_PRODUCAO[item.statusProducao] ?? 'neutral'} />
                  ) : (
                    '—'
                  ),
              },
              { key: 'validade', header: 'Validade', render: (item) => <SeloValidade validadeAte={item.validadeAte} /> },
              { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
            ]}
          />
        </>
      )}

      <ModalNovaOferta
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        produtosAtivos={produtosAtivos}
        fornecedores={fornecedores}
        onCriada={(nova) => navigate(`/compras/${nova.codigoBase}`)}
      />

      <ModalNovaOfertaAgrupada
        open={modalAgrupadaAberto}
        onClose={() => setModalAgrupadaAberto(false)}
        produtosAtivos={produtosAtivos}
        fornecedores={fornecedores}
        onCriada={(novas) => navigate(`/compras/${novas[0].codigoBase}`)}
      />
    </div>
  )
}
