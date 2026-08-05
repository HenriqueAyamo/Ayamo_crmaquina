import { useMemo, useState } from 'react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useDivisao } from '../divisoes/DivisaoContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalNovoClaim from './claims/ModalNovoClaim.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'
import { chartColor } from '../utils/chartColors.js'

const TONE_STATUS = { 'Não iniciado': 'neutral', 'Em andamento': 'warning', Resolvido: 'success', Rejeitado: 'danger' }

export default function Claims() {
  const { claims, empresas, produtos, getProduto, getEmpresa } = useData()
  const { t } = useI18n()
  const { noEscopo } = useDivisao()

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo')
  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')

  const claimsFiltrados = useMemo(() => {
    const termo = busca.toLowerCase()
    return noEscopo(claims.items).filter((c) => {
      const combinaBusca =
        !termo ||
        getProduto(c.produtoId)?.nome.toLowerCase().includes(termo) ||
        getEmpresa(c.fornecedorId)?.nome.toLowerCase().includes(termo)
      const combinaStatus = !statusFiltro || c.status === statusFiltro
      return combinaBusca && combinaStatus
    })
  }, [claims.items, noEscopo, busca, statusFiltro, getProduto, getEmpresa])

  const topImpacto = useMemo(() => {
    return claims.items
      .filter((c) => c.impacto)
      .map((c) => ({
        rotulo: `${getProduto(c.produtoId)?.nome ?? '—'} · ${getEmpresa(c.fornecedorId)?.nome ?? '—'}`,
        valor: c.impacto.valor,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
      .map((linha, indice) => ({ ...linha, cor: chartColor(indice) }))
  }, [claims.items, getProduto, getEmpresa])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(claim) {
    setEditando(claim)
    setModalAberto(true)
  }

  return (
    <div>
      <PageHeader
        title={t('claims.titulo')}
        subtitle={t('claims.subtitulo')}
        actionLabel={t('claims.novo')}
        onAction={abrirNovo}
      />

      {topImpacto.length > 0 && (
        <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Top 10 claims por impacto financeiro</h2>
          <BarraRanking linhas={topImpacto} formatarValor={(v) => formatarValor(v, 'USD')} />
        </div>
      )}

      <FilterBar>
        <Field label={t('comum.buscar')}>
          <input className={inputClass} placeholder={t('claims.buscaPlaceholder')} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </Field>
        <Field label={t('comum.status')}>
          <select className={inputClass} value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            <option value="Não iniciado">Não iniciado</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Rejeitado">Rejeitado</option>
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey="id"
        storageKey="claims"
        data={claimsFiltrados}
        onRowClick={(item) => abrirEdicao(item)}
        emptyLabel={t('claims.vazio')}
        columns={[
          {
            key: 'fornecedor',
            header: t('comum.fornecedor'),
            toggleable: false,
            render: (item) => getEmpresa(item.fornecedorId)?.nome ?? '—',
            sortValue: (item) => getEmpresa(item.fornecedorId)?.nome ?? '',
          },
          {
            key: 'produto',
            header: t('comum.produto'),
            render: (item) => getProduto(item.produtoId)?.nome ?? '—',
            sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
          },
          { key: 'descricao', header: t('comum.descricao'), render: (item) => <span className="whitespace-normal">{item.descricao}</span> },
          {
            key: 'impacto',
            header: t('claims.impacto'),
            render: (item) => (item.impacto ? formatarValor(item.impacto.valor, item.impacto.moeda) : '—'),
            sortValue: (item) => item.impacto?.valor ?? 0,
          },
          {
            key: 'status',
            header: t('comum.status'),
            toggleable: false,
            render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
          },
          { key: 'data', header: t('comum.data'), render: (item) => formatarData(item.data) },
        ]}
      />

      <ModalNovoClaim
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        fornecedores={fornecedores}
        produtosAtivos={produtosAtivos}
        editando={editando}
      />
    </div>
  )
}
