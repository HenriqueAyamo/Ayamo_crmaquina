import { useMemo } from 'react'
import { Package, Container, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import KpiCard from '../components/KpiCard.jsx'
import BarraDuasCores from '../components/BarraDuasCores.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import { obterOfertasAtuais } from '../utils/ofertasAtuais.js'
import { chartColor } from '../utils/chartColors.js'

export default function PurchaseDashboard() {
  const { ofertas, getProduto, getEmpresa } = useData()

  const posicoesAtivas = useMemo(
    () => obterOfertasAtuais(ofertas.items).filter((o) => o.status !== 'Expirada'),
    [ofertas.items],
  )

  const kpis = useMemo(() => {
    const volumeTotal = posicoesAtivas.reduce((soma, o) => soma + (o.quantidadeOriginal ?? o.quantidade), 0)
    const restante = posicoesAtivas.reduce((soma, o) => soma + o.quantidade, 0)
    return { posicoes: posicoesAtivas.length, volumeTotal, restante, vendido: volumeTotal - restante }
  }, [posicoesAtivas])

  const volumePorProduto = useMemo(() => {
    const mapa = new Map()
    posicoesAtivas.forEach((o) => {
      const nome = getProduto(o.produtoId)?.nome ?? 'Sem produto'
      const total = o.quantidadeOriginal ?? o.quantidade
      const atual = mapa.get(nome) ?? { rotulo: nome, restante: 0, vendido: 0 }
      atual.restante += o.quantidade
      atual.vendido += total - o.quantidade
      mapa.set(nome, atual)
    })
    return [...mapa.values()].sort((a, b) => b.restante + b.vendido - (a.restante + a.vendido)).slice(0, 8)
  }, [posicoesAtivas, getProduto])

  const volumePorFornecedor = useMemo(() => {
    const mapa = new Map()
    posicoesAtivas.forEach((o) => {
      const nome = getEmpresa(o.fornecedorId)?.nome ?? 'Sem fornecedor'
      const total = o.quantidadeOriginal ?? o.quantidade
      mapa.set(nome, (mapa.get(nome) ?? 0) + total)
    })
    return [...mapa.entries()]
      .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: chartColor(indice) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
  }, [posicoesAtivas, getEmpresa])

  const posicoesPorStatus = useMemo(() => {
    const mapa = new Map()
    obterOfertasAtuais(ofertas.items).forEach((o) => {
      mapa.set(o.status, (mapa.get(o.status) ?? 0) + 1)
    })
    return [...mapa.entries()]
      .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: chartColor(indice + 2) }))
      .sort((a, b) => b.valor - a.valor)
  }, [ofertas.items])

  return (
    <div>
      <PageHeader title="Painel de Compras" subtitle="Visão consolidada das posições de compra ativas" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Posições ativas" value={kpis.posicoes} icon={Container} tone="primary" />
        <KpiCard label="Volume total" value={`${kpis.volumeTotal.toLocaleString('pt-BR')} MT`} icon={Package} tone="teal" />
        <KpiCard label="Vendido" value={`${kpis.vendido.toLocaleString('pt-BR')} MT`} icon={CheckCircle2} tone="success" />
        <KpiCard label="Restante" value={`${kpis.restante.toLocaleString('pt-BR')} MT`} icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Volume por produto (vendido x restante)</h2>
          <BarraDuasCores linhas={volumePorProduto} />
        </div>

        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Volume por fornecedor</h2>
          <BarraRanking linhas={volumePorFornecedor} formatarValor={(v) => `${v.toLocaleString('pt-BR')} MT`} />
        </div>

        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Posições por status</h2>
          <BarraRanking linhas={posicoesPorStatus} />
        </div>
      </div>
    </div>
  )
}
