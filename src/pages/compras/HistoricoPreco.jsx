import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../DataContext.jsx'
import { converterParaUSD } from '../../data/cambio.js'
import FilterBar from '../../components/FilterBar.jsx'
import DataTable from '../../components/DataTable.jsx'
import GraficoLinha from '../../components/GraficoLinha.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import { formatarPreco, formatarData } from '../../utils/formato.js'
import { chartColor } from '../../utils/chartColors.js'

const METRICAS = {
  media: { rotulo: 'Média', calcular: (valores) => valores.reduce((a, b) => a + b, 0) / valores.length },
  minimo: { rotulo: 'Mínimo', calcular: (valores) => Math.min(...valores) },
  maximo: { rotulo: 'Máximo', calcular: (valores) => Math.max(...valores) },
}

export default function HistoricoPreco() {
  const { ofertas, produtos, empresas, getProduto, getEmpresa } = useData()
  const navigate = useNavigate()

  const [produtoFiltro, setProdutoFiltro] = useState('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')
  const [agruparPorFornecedor, setAgruparPorFornecedor] = useState(false)
  const [metrica, setMetrica] = useState('media')

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor')

  const revisoes = useMemo(() => {
    return [...ofertas.items]
      .filter((o) => (!produtoFiltro || o.produtoId === Number(produtoFiltro)) && (!fornecedorFiltro || o.fornecedorId === Number(fornecedorFiltro)))
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [ofertas.items, produtoFiltro, fornecedorFiltro])

  const grafico = useMemo(() => {
    if (!produtoFiltro) return null
    const registros = [...ofertas.items]
      .filter((o) => o.produtoId === Number(produtoFiltro) && (!fornecedorFiltro || o.fornecedorId === Number(fornecedorFiltro)))
      .map((o) => ({ mes: o.data.slice(0, 7), fornecedorNome: getEmpresa(o.fornecedorId)?.nome ?? '—', valorUSD: converterParaUSD(o.precoCusto.valor, o.precoCusto.moeda) }))

    if (registros.length === 0) return null

    const meses = [...new Set(registros.map((r) => r.mes))].sort()
    const chavesSerie = agruparPorFornecedor ? [...new Set(registros.map((r) => r.fornecedorNome))] : ['Todos os fornecedores']

    const series = chavesSerie.map((chave, indice) => {
      const pontos = meses.map((mes) => {
        const valores = registros
          .filter((r) => r.mes === mes && (!agruparPorFornecedor || r.fornecedorNome === chave))
          .map((r) => r.valorUSD)
        return valores.length > 0 ? METRICAS[metrica].calcular(valores) : null
      })
      return { nome: chave, cor: chartColor(indice), pontos }
    })

    return { series, meses }
  }, [ofertas.items, produtoFiltro, fornecedorFiltro, agruparPorFornecedor, metrica, getEmpresa])

  return (
    <div>
      <FilterBar>
        <Field label="Produto">
          <select className={inputClass} value={produtoFiltro} onChange={(e) => setProdutoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {produtos.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
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
        {grafico && (
          <>
            <Field label="Métrica">
              <select className={inputClass} value={metrica} onChange={(e) => setMetrica(e.target.value)}>
                {Object.entries(METRICAS).map(([chave, { rotulo }]) => (
                  <option key={chave} value={chave}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Agrupar por">
              <select
                className={inputClass}
                value={agruparPorFornecedor ? 'fornecedor' : 'produto'}
                onChange={(e) => setAgruparPorFornecedor(e.target.value === 'fornecedor')}
              >
                <option value="produto">Só produto</option>
                <option value="fornecedor">Produto + fornecedor</option>
              </select>
            </Field>
          </>
        )}
      </FilterBar>

      {grafico && (
        <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-1 text-sm font-semibold text-ayamo-text">
            Tendência de preço — {getProduto(Number(produtoFiltro))?.nome} (USD, {METRICAS[metrica].rotulo.toLowerCase()} por mês)
          </h2>
          <GraficoLinha series={grafico.series} rotulosX={grafico.meses} formatarY={(v) => `$${Math.round(v)}`} />
        </div>
      )}

      <DataTable
        rowKey="id"
        data={revisoes}
        emptyLabel="Nenhuma revisão de preço registrada"
        onRowClick={(item) => navigate(`/compras/${item.codigoBase}`)}
        columns={[
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
          {
            key: 'produto',
            header: 'Produto',
            render: (item) => getProduto(item.produtoId)?.nome ?? '—',
            sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
          },
          {
            key: 'fornecedor',
            header: 'Fornecedor',
            render: (item) => getEmpresa(item.fornecedorId)?.nome ?? '—',
            sortValue: (item) => getEmpresa(item.fornecedorId)?.nome ?? '',
          },
          {
            key: 'versao',
            header: 'Versão',
            render: (item) => (item.versao === 0 ? 'Original' : `R${item.versao}`),
          },
          {
            key: 'preco',
            header: 'Preço',
            render: (item) => formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade),
            sortValue: (item) => item.precoCusto.valor,
          },
          {
            key: 'quantidade',
            header: 'Quantidade',
            render: (item) => (item.quantidade == null ? 'A definir' : `${item.quantidade.toLocaleString('pt-BR')} ${item.unidade}`),
          },
        ]}
      />
    </div>
  )
}
