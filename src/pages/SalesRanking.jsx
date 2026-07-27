import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { formatarValor } from '../utils/formato.js'
import { chartColor } from '../utils/chartColors.js'

const PERIODOS = [
  { valor: '3', rotulo: 'Últimos 3 meses' },
  { valor: '6', rotulo: 'Últimos 6 meses' },
  { valor: '12', rotulo: 'Últimos 12 meses' },
  { valor: '', rotulo: 'Todo o período' },
]

export default function SalesRanking() {
  const { propostas, getProduto, getUsuario, calcularResumoProposta } = useData()
  const [periodo, setPeriodo] = useState('')

  const propostasFechadas = useMemo(() => {
    const aceitas = propostas.items.filter((p) => p.status === 'Aceita')
    if (!periodo) return aceitas
    const limite = new Date()
    limite.setMonth(limite.getMonth() - Number(periodo))
    const limiteStr = limite.toISOString().slice(0, 10)
    return aceitas.filter((p) => p.dataEnvio >= limiteStr)
  }, [propostas.items, periodo])

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
      <PageHeader title="Sales Ranking" subtitle="Ranking de vendas fechadas (propostas Aceitas)" />

      <div className="mb-6 max-w-xs">
        <Field label="Período">
          <select className={inputClass} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-ayamo-accent" />
            <h2 className="text-sm font-semibold text-ayamo-text">Top produtos por volume (MT)</h2>
          </div>
          <BarraRanking linhas={porProduto} formatarValor={(v) => `${v.toLocaleString('pt-BR')} MT`} />
        </div>

        <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-ayamo-accent" />
            <h2 className="text-sm font-semibold text-ayamo-text">Top vendedores por faturamento</h2>
          </div>
          <BarraRanking linhas={porVendedor} formatarValor={(v) => formatarValor(v, 'USD')} />
        </div>
      </div>
    </div>
  )
}
