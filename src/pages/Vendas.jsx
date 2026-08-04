import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import NovaPropostaModal from './vendas/NovaPropostaModal.jsx'
import PopoverContato from '../components/PopoverContato.jsx'
import { formatarValor, formatarData, formatarPercentual, formatarPreco } from '../utils/formato.js'
import { avaliarMargem } from '../data/cambio.js'

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

const CLASSE_TONE = { danger: 'text-ayamo-danger', warning: 'text-ayamo-warning', success: 'text-ayamo-success' }

function nomesProdutos(item, getProduto) {
  return item.itens.map((i) => getProduto(i.produtoId)?.nome ?? '—').join(', ')
}

function formatarMargemAtual(avaliacao) {
  return avaliacao.tipo === 'valor' ? formatarPreco(avaliacao.atual, 'USD', 'ton') : formatarPercentual(avaliacao.atual)
}

export default function Vendas() {
  const { propostas, empresas, usuarios, getEmpresa, getUsuario, getProduto, calcularResumoProposta } = useData()
  const { t } = useI18n()
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
      <PageHeader title={t('vendas.titulo')} actionLabel={t('vendas.novaProposta')} onAction={() => setModalAberto(true)} />

      <FilterBar>
        <Field label={t('comum.cliente')}>
          <input
            className={inputClass}
            placeholder={t('vendas.nomeClientePlaceholder')}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
        <Field label={t('comum.vendedor')}>
          <select className={inputClass} value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
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
        storageKey="vendas"
        stickyFirstColumn
        data={propostasFiltradas}
        onRowClick={(item) => navigate(`/vendas/${item.numero}`)}
        columns={[
          { key: 'numero', header: t('vendas.numero') },
          {
            key: 'cliente',
            header: t('comum.cliente'),
            render: (item) => <PopoverContato empresaId={item.clienteId}>{getEmpresa(item.clienteId)?.nome ?? '—'}</PopoverContato>,
            sortValue: (item) => getEmpresa(item.clienteId)?.nome ?? '',
          },
          {
            key: 'vendedor',
            header: t('comum.vendedor'),
            render: (item) => getUsuario(item.vendedorId)?.nome ?? '—',
            sortValue: (item) => getUsuario(item.vendedorId)?.nome ?? '',
          },
          {
            key: 'produto',
            header: t('comum.produto'),
            render: (item) => nomesProdutos(item, getProduto),
            sortValue: (item) => nomesProdutos(item, getProduto),
          },
          { key: 'itens', header: t('vendas.itens'), render: (item) => item.itens.length, sortValue: (item) => item.itens.length },
          {
            key: 'valorTotal',
            header: t('vendas.valorTotal'),
            render: (item) => formatarValor(calcularResumoProposta(item).vendaUSD, 'USD'),
            sortValue: (item) => calcularResumoProposta(item).vendaUSD,
          },
          {
            key: 'margem',
            header: t('vendas.margem'),
            render: (item) => {
              const avaliacao = avaliarMargem(calcularResumoProposta(item), item)
              return <span className={`font-medium ${CLASSE_TONE[avaliacao.tone]}`}>{formatarMargemAtual(avaliacao)}</span>
            },
            sortValue: (item) => calcularResumoProposta(item).margemPercentual,
          },
          {
            key: 'status',
            header: t('comum.status'),
            render: (item) => <StatusBadge label={item.status} tone={TONE_STATUS[item.status] ?? 'neutral'} />,
          },
          { key: 'dataEnvio', header: t('vendas.dataEnvio'), render: (item) => formatarData(item.dataEnvio) },
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
