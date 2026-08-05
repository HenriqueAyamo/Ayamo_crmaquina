import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useDivisao } from '../divisoes/DivisaoContext.jsx'
import Botao from '../components/Botao.jsx'
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
  const { ofertas, produtos, empresas, getDivisaoIdDeProduto, getProduto, getEmpresa } = useData()
  const { t } = useI18n()
  const { noEscopo, divisaoAtiva } = useDivisao()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [produtoFiltro, setProdutoFiltro] = useState('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalAgrupadaAberto, setModalAgrupadaAberto] = useState(false)
  const [importarAberto, setImportarAberto] = useState(false)
  const [aba, setAba] = useState('ofertas')

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')
  // Produtos do módulo: a divisão vem da família do produto.
  const produtosAtivos = produtos.items.filter(
    (p) => p.situacao === 'Ativo' && (!divisaoAtiva || getDivisaoIdDeProduto(p.id) === divisaoAtiva.id),
  )

  // Só as ofertas do módulo aberto — o escopo vem antes de qualquer filtro de tela.
  const ofertasAtuais = useMemo(() => noEscopo(obterOfertasAtuais(ofertas.items)), [ofertas.items, noEscopo])

  const ofertasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return ofertasAtuais.filter((o) => {
      const produto = getProduto(o.produtoId)
      const combinaBusca = !termo || produto?.nome.toLowerCase().includes(termo)
      const combinaProduto = !produtoFiltro || o.produtoId === Number(produtoFiltro)
      const combinaFornecedor = !fornecedorFiltro || o.fornecedorId === Number(fornecedorFiltro)
      const combinaStatus = !statusFiltro || o.status === statusFiltro
      const combinaTipo = !tipoFiltro || (o.tipoRegistro ?? 'Position') === tipoFiltro
      return combinaBusca && combinaProduto && combinaFornecedor && combinaStatus && combinaTipo
    })
  }, [ofertasAtuais, busca, produtoFiltro, fornecedorFiltro, statusFiltro, tipoFiltro, getProduto])

  return (
    <div>
      <PageHeader
        title={t('compras.titulo')}
        subtitle={divisaoAtiva ? `Módulo ${divisaoAtiva.nome}` : undefined}
        actionLabel={t('compras.novaOferta')}
        onAction={() => setModalAberto(true)}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 border-b border-ayamo-border">
          {[
            { id: 'ofertas', label: t('compras.abaOfertas') },
            { id: 'precos', label: t('compras.abaPrecos') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                aba === item.id ? 'border-ayamo-primary text-ayamo-primary' : 'border-transparent text-ayamo-text-mut hover:text-ayamo-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {aba === 'ofertas' && (
          <div className="flex gap-2">
            <Botao variante="secundario" tamanho="sm" onClick={() => setModalAgrupadaAberto(true)}>
              {t('compras.mixContainer')}
            </Botao>
            <Botao variante="secundario" tamanho="sm" onClick={() => setImportarAberto((atual) => !atual)}>
              {importarAberto ? t('compras.fecharImportacao') : t('compras.importarPlanilha')}
            </Botao>
            <Botao
              variante="secundario"
              tamanho="sm"
              icone={Download}
              onClick={() => exportarOfertasExcel(ofertasFiltradas, { getProduto, getEmpresa })}
            >
              {t('compras.exportarExcel')}
            </Botao>
          </div>
        )}
      </div>

      {aba === 'precos' && <HistoricoPreco />}

      {aba === 'ofertas' && (
        <>
          {importarAberto && (
            <div className="mb-4">
              <Suspense fallback={<p className="text-sm text-ayamo-text-mut">{t('compras.carregandoImportador')}</p>}>
                <ImportarPlanilha />
              </Suspense>
            </div>
          )}

          <FilterBar>
            <Field label={t('comum.buscar')}>
              <input className={inputClass} placeholder={t('comum.produto')} value={busca} onChange={(e) => setBusca(e.target.value)} />
            </Field>
            <Field label={t('comum.produto')}>
              <select className={inputClass} value={produtoFiltro} onChange={(e) => setProdutoFiltro(e.target.value)}>
                <option value="">{t('comum.todos')}</option>
                {produtosAtivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('comum.tipo')}>
              <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                <option value="">{t('comum.todos')}</option>
                <option value="Oferta">{t('pendencias.oferta')}</option>
                <option value="Position">Position</option>
              </select>
            </Field>
            <Field label={t('comum.fornecedor')}>
              <select className={inputClass} value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)}>
                <option value="">{t('comum.todos')}</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('comum.status')}>
              <select className={inputClass} value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                <option value="">{t('comum.todos')}</option>
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
              { key: 'codigo', header: t('comum.codigo') },
              {
                key: 'tipoRegistro',
                header: t('comum.tipo'),
                toggleable: false,
                render: (item) => (
                  <StatusBadge label={item.tipoRegistro ?? 'Position'} tone={(item.tipoRegistro ?? 'Position') === 'Position' ? 'info' : 'accent'} />
                ),
              },
              {
                key: 'produto',
                header: t('comum.produto'),
                render: (item) => getProduto(item.produtoId)?.nome ?? '—',
                sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
              },
              {
                key: 'proteina',
                header: t('compras.proteina'),
                render: (item) => (getProduto(item.produtoId)?.proteinaPercentual ? `${getProduto(item.produtoId).proteinaPercentual}%` : '—'),
              },
              {
                key: 'fornecedor',
                header: t('comum.fornecedor'),
                render: (item) => (
                  <PopoverContato empresaId={item.fornecedorId}>{getEmpresa(item.fornecedorId)?.nome ?? '—'}</PopoverContato>
                ),
                sortValue: (item) => getEmpresa(item.fornecedorId)?.nome ?? '',
              },
              { key: 'mfgSite', header: t('compras.mfgSite'), render: (item) => item.mfgSite || '—' },
              {
                key: 'precoCusto',
                header: t('compras.precoCusto'),
                render: (item) => formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade),
                sortValue: (item) => item.precoCusto.valor,
              },
              {
                key: 'quantidade',
                header: t('compras.vendidoRestante'),
                render: (item) =>
                  item.quantidade == null ? (
                    <span className="text-ayamo-text-mut">{t('compras.aDefinir')}</span>
                  ) : (
                    <BarraEstoque total={item.quantidadeOriginal ?? item.quantidade} restante={item.quantidade} unidade={item.unidade} />
                  ),
                sortValue: (item) => item.quantidade,
              },
              {
                key: 'status',
                header: t('comum.status'),
                render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
              },
              {
                key: 'statusProducao',
                header: t('compras.producao'),
                render: (item) =>
                  item.statusProducao ? (
                    <StatusBadge label={item.statusProducao} tone={TONE_STATUS_PRODUCAO[item.statusProducao] ?? 'neutral'} />
                  ) : (
                    '—'
                  ),
              },
              { key: 'validade', header: t('compras.validade'), render: (item) => <SeloValidade validadeAte={item.validadeAte} /> },
              { key: 'data', header: t('comum.data'), render: (item) => formatarData(item.data) },
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
