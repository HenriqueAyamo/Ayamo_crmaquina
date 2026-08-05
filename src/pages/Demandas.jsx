import { useEffect, useMemo, useState } from 'react'
import { PackageSearch, X } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useDivisao } from '../divisoes/DivisaoContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalNovaDemanda from './demandas/ModalNovaDemanda.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'
import { obterOfertasAtuais } from '../utils/ofertasAtuais.js'
import { sugerirDemandasOfertaParada } from '../utils/sugestoesDemanda.js'

const TONE_STATUS = { Aberta: 'info', Atendida: 'success', Cancelada: 'neutral' }
const CHAVE_DISPENSADAS = 'ayamo_crm_v1_sugestoesDemandaDispensadas'

function carregarDispensadas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_DISPENSADAS)) ?? []
  } catch {
    return []
  }
}

export default function Demandas() {
  const { demandas, ofertas, propostas, empresas, produtos, usuarioLogado, getProduto, getEmpresa } = useData()
  const { t } = useI18n()
  const { noEscopo } = useDivisao()

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('Aberta')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [dispensadas, setDispensadas] = useState(carregarDispensadas)

  useEffect(() => {
    localStorage.setItem(CHAVE_DISPENSADAS, JSON.stringify(dispensadas))
  }, [dispensadas])

  const sugestoes = useMemo(
    () => sugerirDemandasOfertaParada({ ofertas, propostas, demandas, ignoradas: dispensadas }),
    [ofertas, propostas, demandas, dispensadas],
  )

  function criarDemandaDaSugestao({ oferta, diasParada }) {
    demandas.criar({
      clienteId: null,
      produtoId: oferta.produtoId,
      quantidade: oferta.quantidade,
      precoAlvo: null,
      incoterm: oferta.incoterm || 'CFR',
      origem: oferta.portoOrigem || '',
      destino: '',
      embalagem: '',
      mesEmbarque: oferta.embarqueDe ? `${oferta.embarqueDe} - ${oferta.embarqueAte || ''}` : '',
      observacao: `Sugestão automática — oferta ${oferta.codigo} disponível há ${diasParada} dias sem proposta de venda vinculada.`,
      origemAutomatica: 'oferta_parada',
      ofertaCodigo: oferta.codigo,
      status: 'Aberta',
      vendedorId: usuarioLogado.id,
      data: new Date().toISOString().slice(0, 10),
    })
  }

  function dispensarSugestao(codigoBase) {
    setDispensadas((atual) => [...atual, codigoBase])
  }

  const clientes = empresas.items.filter((e) => e.tipo === 'Cliente' && e.situacao === 'Ativo')
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')

  const demandasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return noEscopo(demandas.items).filter((d) => {
      const combinaBusca = !termo || getProduto(d.produtoId)?.nome.toLowerCase().includes(termo)
      const combinaStatus = !statusFiltro || d.status === statusFiltro
      return combinaBusca && combinaStatus
    })
  }, [demandas.items, noEscopo, busca, statusFiltro, getProduto])

  function contarOfertasCompativeis(produtoId) {
    return obterOfertasAtuais(ofertas.items).filter((o) => o.produtoId === produtoId && o.status === 'Disponível').length
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
      <PageHeader
        title={t('demandas.titulo')}
        subtitle={t('demandas.subtitulo')}
        actionLabel={t('demandas.nova')}
        onAction={abrirNova}
      />

      {sugestoes.length > 0 && (
        <div className="mb-6 rounded border border-ayamo-accent/40 bg-ayamo-accent/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <PackageSearch size={16} className="text-ayamo-accent" />
            <h2 className="text-sm font-semibold text-ayamo-text">
              Sugestões — ofertas de compra sem comprador ({sugestoes.length})
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {sugestoes.map(({ oferta, diasParada }) => (
              <div
                key={oferta.codigoBase}
                className="flex items-center justify-between gap-3 rounded border border-ayamo-border bg-ayamo-surface px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium text-ayamo-text">
                    {oferta.codigo} — {getProduto(oferta.produtoId)?.nome ?? ''}
                  </span>
                  <span className="text-ayamo-text-mut">
                    {' '}
                    · {oferta.quantidade.toLocaleString('pt-BR')} {oferta.unidade} disponível há {diasParada} dias sem
                    proposta de venda
                  </span>
                </span>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => criarDemandaDaSugestao({ oferta, diasParada })}
                    className="rounded border border-ayamo-primary px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
                  >
                    Criar demanda
                  </button>
                  <button
                    type="button"
                    onClick={() => dispensarSugestao(oferta.codigoBase)}
                    className="text-ayamo-text-mut hover:text-ayamo-text"
                    title={t('demandas.dispensar')}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterBar>
        <Field label={t('comum.buscar')}>
          <input className={inputClass} placeholder={t('comum.produto')} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </Field>
        <Field label={t('comum.status')}>
          <select className={inputClass} value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            <option value="Aberta">Aberta</option>
            <option value="Atendida">Atendida</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey="id"
        storageKey="demandas"
        stickyFirstColumn
        data={demandasFiltradas}
        onRowClick={(item) => abrirEdicao(item)}
        emptyLabel={t('demandas.vazio')}
        columns={[
          {
            key: 'cliente',
            header: t('comum.cliente'),
            render: (item) => (
              <span className="flex items-center gap-2">
                {getEmpresa(item.clienteId)?.nome ?? (item.origemAutomatica ? 'A definir' : '—')}
                {item.origemAutomatica && (
                  <span className="rounded-full border border-ayamo-accent/40 bg-ayamo-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ayamo-accent">
                    Automática
                  </span>
                )}
              </span>
            ),
            sortValue: (item) => getEmpresa(item.clienteId)?.nome ?? '',
          },
          {
            key: 'produto',
            header: t('comum.produto'),
            render: (item) => getProduto(item.produtoId)?.nome ?? '—',
            sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
          },
          { key: 'quantidade', header: t('demandas.volume'), render: (item) => `${item.quantidade.toLocaleString('pt-BR')} MT` },
          {
            key: 'precoAlvo',
            header: t('demandas.precoAlvo'),
            render: (item) => (item.precoAlvo ? formatarValor(item.precoAlvo.valor, item.precoAlvo.moeda) : '—'),
          },
          { key: 'incoterm', header: 'Incoterm' },
          { key: 'destino', header: t('demandas.destino'), render: (item) => item.destino || '—' },
          { key: 'mesEmbarque', header: t('demandas.embarque'), render: (item) => item.mesEmbarque || '—' },
          {
            key: 'ofertasCompativeis',
            header: t('demandas.ofertasCompativeis'),
            render: (item) => {
              const n = contarOfertasCompativeis(item.produtoId)
              return <span className={n > 0 ? 'font-medium text-ayamo-success' : 'text-ayamo-text-mut'}>{n}</span>
            },
          },
          {
            key: 'status',
            header: t('comum.status'),
            render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
          },
          { key: 'data', header: t('comum.data'), render: (item) => formatarData(item.data) },
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
