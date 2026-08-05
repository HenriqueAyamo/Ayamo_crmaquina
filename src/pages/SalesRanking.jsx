import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import KpiCard from '../components/KpiCard.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { formatarValor, formatarPercentual } from '../utils/formato.js'
import { chartColor } from '../utils/chartColors.js'
import { useI18n } from '../i18n/I18nContext.jsx'

const PERIODOS = [
  { valor: '3', rotulo: 'Últimos 3 meses' },
  { valor: '6', rotulo: 'Últimos 6 meses' },
  { valor: '12', rotulo: 'Últimos 12 meses' },
  { valor: '', rotulo: 'Todo o período' },
]

export default function SalesRanking() {
  const { t } = useI18n()
  const { propostas, usuarios, getProduto, getUsuario, calcularResumoProposta } = useData()
  const [periodo, setPeriodo] = useState('')
  const [vendedorFiltro, setVendedorFiltro] = useState('')

  const vendedores = usuarios.items.filter((u) => u.perfil === 'Vendedor')

  const propostasNoPeriodo = useMemo(() => {
    let lista = propostas.items
    if (vendedorFiltro) lista = lista.filter((p) => p.vendedorId === Number(vendedorFiltro))
    if (!periodo) return lista
    const limite = new Date()
    limite.setMonth(limite.getMonth() - Number(periodo))
    const limiteStr = limite.toISOString().slice(0, 10)
    return lista.filter((p) => p.dataEnvio >= limiteStr)
  }, [propostas.items, periodo, vendedorFiltro])

  const propostasFechadas = useMemo(() => propostasNoPeriodo.filter((p) => p.status === 'Aceita'), [propostasNoPeriodo])

  const conversao = useMemo(() => {
    const total = propostasNoPeriodo.length
    const aceitas = propostasNoPeriodo.filter((p) => p.status === 'Aceita').length
    const recusadas = propostasNoPeriodo.filter((p) => p.status === 'Recusada').length
    const emAndamento = total - aceitas - recusadas
    const taxa = total > 0 ? (aceitas / total) * 100 : 0
    return { total, aceitas, recusadas, emAndamento, taxa }
  }, [propostasNoPeriodo])

  const porStatus = useMemo(() => {
    const mapa = new Map()
    propostasNoPeriodo.forEach((p) => mapa.set(p.status, (mapa.get(p.status) ?? 0) + 1))
    return [...mapa.entries()]
      .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: chartColor(indice + 4) }))
      .sort((a, b) => b.valor - a.valor)
  }, [propostasNoPeriodo])

  const porProduto = useMemo(() => {
    const mapa = new Map()
    propostasFechadas.forEach((p) => {
      p.itens.forEach((item) => {
        const nome = getProduto(item.produtoId)?.nome ?? 'Sem produto'
        mapa.set(nome, (mapa.get(nome) ?? 0) + item.quantidade)
      })
    })
    return [...mapa.entries()]
      .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: chartColor(indice) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
  }, [propostasFechadas, getProduto])

  const porVendedor = useMemo(() => {
    const mapa = new Map()
    propostasFechadas.forEach((p) => {
      const nome = getUsuario(p.vendedorId)?.nome ?? 'Sem vendedor'
      const { vendaUSD } = calcularResumoProposta(p)
      mapa.set(nome, (mapa.get(nome) ?? 0) + vendaUSD)
    })
    return [...mapa.entries()]
      .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: chartColor(indice + 2) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
  }, [propostasFechadas, getUsuario, calcularResumoProposta])

  return (
    <div>
      <PageHeader title="Sales Ranking" subtitle="Ranking de vendas fechadas e conversão de propostas" />

      <div className="mb-6 grid max-w-xl grid-cols-2 gap-3">
        <Field label={t('campo.periodo')}>
          <select className={inputClass} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('campo.vendedor')}>
          <select className={inputClass} value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)}>
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label={t('campo.propostasCriadas')} value={conversao.total} tone="primary" />
        <KpiCard label={t('campo.aceitas')} value={conversao.aceitas} tone="success" />
        <KpiCard label={t('campo.recusadas')} value={conversao.recusadas} tone="danger" />
        <KpiCard label={t('campo.taxaConversao')} value={formatarPercentual(conversao.taxa)} tone="teal" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Propostas por status</h2>
          <BarraRanking linhas={porStatus} />
        </div>

        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-ayamo-accent" />
            <h2 className="text-sm font-semibold text-ayamo-text">Top vendedores por faturamento (Aceitas)</h2>
          </div>
          <BarraRanking linhas={porVendedor} formatarValor={(v) => formatarValor(v, 'USD')} />
        </div>

        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-ayamo-accent" />
            <h2 className="text-sm font-semibold text-ayamo-text">Top produtos por volume (MT, Aceitas)</h2>
          </div>
          <BarraRanking linhas={porProduto} formatarValor={(v) => `${v.toLocaleString('pt-BR')} MT`} />
        </div>
      </div>
    </div>
  )
}
